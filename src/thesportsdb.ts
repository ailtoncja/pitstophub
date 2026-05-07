import type { Category, Race } from './types';
import type { JolpicaCategoryData } from './jolpica';

const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const TIMEOUT_MS = 10000;
const CALENDAR_TTL_MS = 10 * 60 * 1000;

// TheSportsDB league IDs for each supported category
const LEAGUE_IDS: Record<string, string> = {
  'f2':                '4486',
  'f3':                '4487',
  'f1-academy':        '5382',
  'wec':               '4413',
  'imsa':              '4488',
  'dtm':               '4438',
  'gt-world-challenge':'4440',
  'indy':              '4373',
  'nascar':            '4393',
  'wrc':               '4409',
};

interface SportsDbEvent {
  idEvent:    string;
  strEvent:   string;
  dateEvent:  string;        // "YYYY-MM-DD"
  strVenue:   string | null;
  strCountry: string | null;
  strStatus:  string | null; // "Match Finished" | "" | null
  intRound:   string | null;
}

interface SportsDbEventsResponse {
  events: SportsDbEvent[] | null;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

type CacheEntry<T> = { promise: Promise<T>; resolvedAt?: number };
const calendarCache = new Map<string, CacheEntry<JolpicaCategoryData>>();

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`TheSportsDB ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(tid);
  }
}

// ─── Event selection ──────────────────────────────────────────────────────────

// F2/F3/F1Academy have Sprint + Feature per round. We keep only the Feature
// Race (last event chronologically within a round) as the representative race.
function pickMainEvents(events: SportsDbEvent[]): SportsDbEvent[] {
  const byRound = new Map<string, SportsDbEvent[]>();
  for (const e of events) {
    const key = e.intRound ?? e.dateEvent;
    const group = byRound.get(key) ?? [];
    group.push(e);
    byRound.set(key, group);
  }

  const result: SportsDbEvent[] = [];
  for (const group of byRound.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const feature = group.find(e => /feature|race\s*2|main\s*race/i.test(e.strEvent));
    if (feature) {
      result.push(feature);
    } else {
      // Take the latest date within the round
      const sorted = [...group].sort((a, b) => a.dateEvent.localeCompare(b.dateEvent));
      result.push(sorted[sorted.length - 1]);
    }
  }
  return result;
}

// ─── Matching ─────────────────────────────────────────────────────────────────

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function matchEvent(base: Race, pool: SportsDbEvent[]): SportsDbEvent | undefined {
  // 1. Exact date
  const exact = pool.find(e => e.dateEvent === base.date);
  if (exact) return exact;

  // 2. Within ±7 days (handles rescheduled races)
  const baseMs = new Date(base.date).getTime();
  const nearby = pool.filter(e => Math.abs(new Date(e.dateEvent).getTime() - baseMs) <= 7 * 86400_000);
  if (nearby.length === 1) return nearby[0];

  // 3. Token overlap on name
  const label = base.enName ?? base.name;
  const baseTokens = tokenize(label);
  let best: SportsDbEvent | undefined;
  let bestScore = 0;
  for (const e of pool) {
    const score = tokenize(e.strEvent).filter(t => baseTokens.includes(t)).length;
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return bestScore >= 1 ? best : undefined;
}

// ─── Core ─────────────────────────────────────────────────────────────────────

function getCategoryYear(category: Category): string {
  return category.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
}

async function loadCalendarData(category: Category): Promise<JolpicaCategoryData> {
  const leagueId = LEAGUE_IDS[category.id];
  const year = getCategoryYear(category);

  const data = await fetchJson<SportsDbEventsResponse>(
    `${API_BASE}/eventsseason.php?id=${leagueId}&s=${year}`,
  );

  const allEvents = data.events ?? [];
  if (allEvents.length === 0) {
    // No data for this season yet — return empty so static data is preserved
    return {};
  }

  const mainEvents = pickMainEvents(allEvents);

  const updatedCalendar: Race[] = category.calendar.map(base => {
    const match = matchEvent(base, mainEvents);
    if (!match) return base;
    return {
      ...base,
      date: match.dateEvent,
      status: match.strStatus === 'Match Finished' ? 'completed' : 'upcoming',
    };
  });

  const nextEvent  = updatedCalendar.find(r => r.status === 'upcoming') ?? null;
  const lastEvent  = [...updatedCalendar].reverse().find(r => r.status === 'completed') ?? null;

  const toEvent = (r: Race | null) =>
    r ? { id: r.id, name: r.name, date: r.date, circuit: r.circuit, location: r.location, status: r.status } : null;

  return {
    calendar: updatedCalendar,
    nextEvent:  toEvent(nextEvent),
    lastEvent:  toEvent(lastEvent),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isCategoryTheSportsDbSupported(id: string): boolean {
  return id in LEAGUE_IDS;
}

export function getTheSportsDbCategoryIds(): string[] {
  return Object.keys(LEAGUE_IDS);
}

export async function fetchTheSportsDbCalendar(
  category: Category,
  force = false,
): Promise<JolpicaCategoryData> {
  const key = `${category.id}:sportsdb`;
  const cached = calendarCache.get(key);

  if (!force && cached) {
    if (!cached.resolvedAt) return cached.promise;                          // in-flight
    if (Date.now() - cached.resolvedAt < CALENDAR_TTL_MS) return cached.promise; // fresh
  }

  const entry: CacheEntry<JolpicaCategoryData> = {
    promise: loadCalendarData(category)
      .then(data => { entry.resolvedAt = Date.now(); return data; })
      .catch(err => {
        const prev = calendarCache.get(key);
        if (prev && prev !== entry && prev.resolvedAt) return prev.promise;
        throw err;
      }),
  };

  calendarCache.set(key, entry);
  return entry.promise;
}
