import type { Category, CategoryStandings, Driver, Race, StandingItem, Team } from './types';

const API_BASE = 'https://api.jolpi.ca/ergast/f1';
const TIMEOUT_MS = 10000;
const SUMMARY_TTL_MS = 5 * 60 * 1000;
const DETAIL_TTL_MS = 10 * 60 * 1000;

// Jolpica constructorId → our static team id
const CONSTRUCTOR_ID_TO_TEAM: Record<string, string> = {
  mercedes: 'mercedes',
  ferrari: 'ferrari',
  mclaren: 'mclaren',
  red_bull: 'redbull',
  haas: 'haas',
  alpine: 'alpine',
  alphatauri: 'rb',
  racing_bulls: 'rb',
  rb: 'rb',
  sauber: 'audi',
  kick_sauber: 'audi',
  audi: 'audi',
  williams: 'williams',
  andretti: 'cadillac',
  cadillac: 'cadillac',
  aston_martin: 'astonmartin',
};

// ─── API response types ───────────────────────────────────────────────────────

type MRData<T> = { MRData: T };

type RaceTableWrapper = {
  RaceTable: { season?: string; Races: JolpicaRace[] };
};

type StandingsTableWrapper = {
  StandingsTable: { season?: string; round?: string; StandingsLists: JolpicaStandingsList[] };
};

type JolpicaRace = {
  season?: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: { locality: string; country: string };
  };
  date: string;
  time?: string;
  Results?: JolpicaResult[];
};

type JolpicaResult = {
  position: string;
  Driver: {
    driverId: string;
    permanentNumber?: string;
    givenName: string;
    familyName: string;
    nationality?: string;
  };
  Constructor: { constructorId: string; name: string };
};

type JolpicaStandingsList = {
  season?: string;
  round?: string;
  DriverStandings?: JolpicaDriverStanding[];
  ConstructorStandings?: JolpicaConstructorStanding[];
};

type JolpicaDriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    permanentNumber?: string;
    givenName: string;
    familyName: string;
    nationality?: string;
  };
  Constructors: Array<{ constructorId: string; name: string }>;
};

type JolpicaConstructorStanding = {
  position: string;
  points: string;
  Constructor: { constructorId: string; name: string };
};

// ─── Public types ─────────────────────────────────────────────────────────────

export type LiveCoverageTier = 'supported' | 'local';

export type JolpicaLiveEvent = {
  id: string;
  name: string;
  date: string;
  circuit: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
};

export type JolpicaCategoryData = {
  currentSeason?: string;
  drivers?: Driver[];
  calendar?: Race[];
  standings?: CategoryStandings;
  nextEvent?: JolpicaLiveEvent | null;
  lastEvent?: JolpicaLiveEvent | null;
  matchedDriverCount?: number;
  matchedCalendarCount?: number;
};

// ─── Cache ────────────────────────────────────────────────────────────────────

type CacheEntry<T> = { expiresAt: number; value: Promise<T> };

const summaryCache = new Map<string, CacheEntry<JolpicaCategoryData | null>>();
const detailCache = new Map<string, CacheEntry<JolpicaCategoryData | null>>();

// ─── Public API ───────────────────────────────────────────────────────────────

export function isCategoryLiveSupported(id: Category['id']): boolean {
  return id === 'f1';
}

export function getSupportedLiveCategoryIds(): string[] {
  return ['f1'];
}

export function getCategoryLiveCoverage(id: Category['id']): LiveCoverageTier {
  return id === 'f1' ? 'supported' : 'local';
}

export function mergeCategoryWithLiveData(
  category: Category,
  liveData: JolpicaCategoryData | null,
): Category {
  if (!liveData) return category;

  const mergedDrivers = liveData.drivers?.length
    ? mergeDriversByName(category.drivers, liveData.drivers)
    : category.drivers;

  return {
    ...category,
    drivers: mergedDrivers,
    calendar: liveData.calendar?.length ? liveData.calendar : category.calendar,
    standings: liveData.standings ?? category.standings,
  };
}

export async function fetchCategoryLiveSummary(
  category: Category,
  force = false,
): Promise<JolpicaCategoryData | null> {
  return getCached(summaryCache, `${category.id}:summary`, SUMMARY_TTL_MS, force, async () => {
    if (category.id !== 'f1') return null;

    const year = getCategoryYear(category);
    const [races, winnerMap] = await Promise.all([fetchRaces(year), fetchWinners(year)]);
    const calendar = buildCalendar(category, races, winnerMap);
    const next = getNextRace(calendar);
    const last = getLastRace(calendar);

    return {
      currentSeason: year,
      calendar,
      nextEvent: next ? toEvent(next) : null,
      lastEvent: last ? toEvent(last) : null,
      matchedCalendarCount: calendar.length,
    };
  });
}

export async function fetchCategoryLiveData(
  category: Category,
  force = false,
): Promise<JolpicaCategoryData | null> {
  return getCached(detailCache, `${category.id}:detail`, DETAIL_TTL_MS, force, async () => {
    if (category.id !== 'f1') return null;

    const year = getCategoryYear(category);
    const [races, winnerMap, driverStandings, constructorStandings] = await Promise.all([
      fetchRaces(year),
      fetchWinners(year),
      fetchDriverStandings(year).catch((): JolpicaDriverStanding[] => []),
      fetchConstructorStandings(year).catch((): JolpicaConstructorStanding[] => []),
    ]);

    const calendar = buildCalendar(category, races, winnerMap);
    const liveDrivers = buildDrivers(category, driverStandings);
    const mergedDrivers = liveDrivers.length
      ? mergeDriversByName(category.drivers, liveDrivers)
      : category.drivers;
    const normalizedCalendar = normalizeWinners(calendar, mergedDrivers);
    const standings = buildStandings(driverStandings, constructorStandings);
    const next = getNextRace(normalizedCalendar);
    const last = getLastRace(normalizedCalendar);

    return {
      currentSeason: year,
      drivers: liveDrivers,
      calendar: normalizedCalendar,
      standings: standings ?? undefined,
      nextEvent: next ? toEvent(next) : null,
      lastEvent: last ? toEvent(last) : null,
      matchedDriverCount: countMatched(category.drivers, mergedDrivers),
      matchedCalendarCount: normalizedCalendar.length,
    };
  });
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchRaces(year: string): Promise<JolpicaRace[]> {
  const data = await fetchJson<MRData<RaceTableWrapper>>(`/${year}/races.json?limit=100`);
  return data.MRData.RaceTable.Races ?? [];
}

async function fetchWinners(year: string): Promise<Map<string, string>> {
  const data = await fetchJson<MRData<RaceTableWrapper>>(`/${year}/results/1.json?limit=100`);
  const map = new Map<string, string>();
  for (const race of data.MRData.RaceTable.Races ?? []) {
    const result = race.Results?.[0];
    if (result?.position === '1') {
      map.set(race.round, `${result.Driver.givenName} ${result.Driver.familyName}`);
    }
  }
  return map;
}

async function fetchDriverStandings(year: string): Promise<JolpicaDriverStanding[]> {
  const data = await fetchJson<MRData<StandingsTableWrapper>>(`/${year}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

async function fetchConstructorStandings(year: string): Promise<JolpicaConstructorStanding[]> {
  const data = await fetchJson<MRData<StandingsTableWrapper>>(`/${year}/constructorStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

// ─── Builders ─────────────────────────────────────────────────────────────────

function buildCalendar(
  category: Category,
  races: JolpicaRace[],
  winnerMap: Map<string, string>,
): Race[] {
  return races.map((race) => {
    const base = matchBaseRace(category.calendar, race);
    const status = getRaceStatus(race, winnerMap.has(race.round));
    return {
      id: base?.id ?? slugify(race.raceName),
      name: base?.name ?? formatPt(race.raceName),
      enName: base?.enName ?? race.raceName,
      location: base?.location ?? race.Circuit.Location.locality,
      enLocation: base?.enLocation ?? race.Circuit.Location.locality,
      date: race.date,
      circuit: base?.circuit ?? race.Circuit.circuitName,
      status,
      winner: winnerMap.get(race.round) ?? (status === 'completed' ? base?.winner : undefined),
    };
  });
}

function buildDrivers(category: Category, standings: JolpicaDriverStanding[]): Driver[] {
  return standings.map((entry) => {
    const fullName = `${entry.Driver.givenName} ${entry.Driver.familyName}`;
    const base = findBaseDriver(category.drivers, fullName);
    const constructorId = entry.Constructors[0]?.constructorId ?? '';
    const constructorName = entry.Constructors[0]?.name ?? '';
    const teamId = resolveTeamId(constructorId, constructorName, category.teams, base?.teamId);
    return {
      id: base?.id ?? slugify(fullName),
      name: base?.name ?? toTitleCase(fullName),
      number: entry.Driver.permanentNumber ?? base?.number ?? '--',
      nationality: base?.nationality ?? 'N/A',
      teamId,
      image: base?.image,
    };
  });
}

function buildStandings(
  driverStandings: JolpicaDriverStanding[],
  constructorStandings: JolpicaConstructorStanding[],
): CategoryStandings | null {
  const drivers: StandingItem[] = driverStandings
    .map((e) => ({
      position: parseInt(e.position, 10),
      name: `${e.Driver.givenName} ${e.Driver.familyName}`,
      points: parseFloat(e.points),
      team: e.Constructors[0]?.name,
    }))
    .filter((s) => !Number.isNaN(s.position) && !Number.isNaN(s.points));

  const constructors: StandingItem[] = constructorStandings
    .map((e) => ({
      position: parseInt(e.position, 10),
      name: e.Constructor.name,
      points: parseFloat(e.points),
    }))
    .filter((s) => !Number.isNaN(s.position) && !Number.isNaN(s.points));

  if (!drivers.length && !constructors.length) return null;
  return {
    drivers: drivers.length ? drivers : undefined,
    constructors: constructors.length ? constructors : undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRaceStatus(race: JolpicaRace, hasResult: boolean): Race['status'] {
  if (hasResult) return 'completed';
  return new Date(`${race.date}T23:59:59Z`) < new Date() ? 'completed' : 'upcoming';
}

function matchBaseRace(baseCalendar: Race[], race: JolpicaRace): Race | null {
  const byDate = baseCalendar.find((r) => r.date === race.date);
  if (byDate) return byDate;

  const raceTokens = extractTokens([race.raceName, race.Circuit.Location.locality, race.Circuit.Location.country]);
  let best: Race | null = null;
  let bestScore = 0;
  for (const r of baseCalendar) {
    const baseTokens = extractTokens([r.name, r.enName, r.location, r.enLocation]);
    let score = 0;
    for (const t of raceTokens) {
      if (baseTokens.has(t)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return bestScore >= 1 ? best : null;
}

function findBaseDriver(drivers: Driver[], fullName: string): Driver | null {
  const norm = normalizeText(fullName);
  const exact = drivers.find((d) => normalizeText(d.name) === norm);
  if (exact) return exact;
  const lastName = norm.split(' ').at(-1) ?? '';
  return drivers.find((d) => normalizeText(d.name).split(' ').at(-1) === lastName) ?? null;
}

function resolveTeamId(
  constructorId: string,
  constructorName: string,
  baseTeams: Team[],
  fallback?: string,
): string {
  const byId = CONSTRUCTOR_ID_TO_TEAM[constructorId.toLowerCase()];
  if (byId) return byId;
  const norm = normalizeText(constructorName);
  const byName = baseTeams.find((t) => {
    const tn = normalizeText(t.name);
    return tn === norm || tn.includes(norm) || norm.includes(tn);
  });
  if (byName) return byName.id;
  return fallback ?? slugify(constructorName || constructorId || 'team');
}

function formatPt(raceName: string): string {
  return raceName.replace(/^(.+?) Grand Prix$/i, (_, loc: string) => `GP de ${loc}`);
}

function getNextRace(calendar: Race[]): Race | null {
  return (
    calendar
      .filter((r) => r.status === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

function getLastRace(calendar: Race[]): Race | null {
  return (
    calendar
      .filter((r) => r.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  );
}

function toEvent(race: Race): JolpicaLiveEvent {
  return {
    id: race.id,
    name: race.enName ?? race.name,
    date: race.date,
    circuit: race.circuit,
    location: race.enLocation ?? race.location,
    status: race.status,
  };
}

function normalizeWinners(calendar: Race[], drivers: Driver[]): Race[] {
  return calendar.map((race) => {
    if (!race.winner) return race;
    const match = drivers.find((d) => normalizeText(d.name) === normalizeText(race.winner!));
    return { ...race, winner: match?.name ?? race.winner };
  });
}

function countMatched(base: Driver[], merged: Driver[]): number {
  const names = new Set(base.map((d) => normalizeText(d.name)));
  return merged.filter((d) => names.has(normalizeText(d.name))).length;
}

function extractTokens(values: Array<string | null | undefined>): Set<string> {
  const stop = new Set(['gp', 'grand', 'prix', 'de', 'do', 'da', 'the', 'of', 'formula', 'prix']);
  const tokens = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    for (const t of normalizeText(v).split(' ')) {
      if (t.length >= 3 && !stop.has(t)) tokens.add(t);
    }
  }
  return tokens;
}

function mergeDriversByName(base: Driver[], live: Driver[]): Driver[] {
  const merged = new Map(base.map((d) => [d.id, d]));
  for (const d of live) {
    const found = findBaseDriver(base, d.name);
    if (found) {
      // Preserve base nationality (Portuguese) and image; update number and teamId from live data
      merged.set(found.id, {
        ...found,
        ...d,
        id: found.id,
        name: found.name,
        nationality: found.nationality,
        image: d.image ?? found.image,
      });
    } else {
      merged.set(d.id, d);
    }
  }
  return [...merged.values()];
}

function getCategoryYear(category: Category): string {
  return category.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
}

// ─── HTTP / Cache ─────────────────────────────────────────────────────────────

async function fetchJson<T>(path: string, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      clearTimeout(timerId);
      await new Promise<void>((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      return fetchJson(path, attempt + 1);
    }
    if (!res.ok) throw new Error(`Jolpica HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timerId);
  }
}

async function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttl: number,
  force: boolean,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (!force && hit && hit.expiresAt > now) return hit.value;

  const value = loader().catch((err) => {
    if (hit) return hit.value;
    cache.delete(key);
    throw err;
  });

  cache.set(key, { expiresAt: now + ttl, value });
  return value;
}

// ─── Text utils ───────────────────────────────────────────────────────────────

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}
