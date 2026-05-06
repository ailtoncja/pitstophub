import type { Category, Driver, Race, Team } from './types';

const API_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/123';
const API_REQUEST_TIMEOUT_MS = 8000;
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;
const DETAIL_CACHE_TTL_MS = 10 * 60 * 1000;

const CATEGORY_LEAGUE_IDS: Partial<Record<Category['id'], number>> = {
  f1: 4370,
  fe: 4371,
  f2: 4486,
  f3: 4487,
  'f1-academy': 5382,
  wec: 4413,
  imsa: 4488,
  dtm: 4438,
  indycar: 4373,
  nascar: 4393,
  wrc: 4409,
  'gt-world-challenge': 4439,
};

const CATEGORY_TEAM_SEARCH_ALIASES: Partial<Record<Category['id'], string[]>> = {
  f1: ['Formula 1'],
  f2: ['Formula 2', 'FIA Formula 2 Championship'],
  f3: ['Formula 3', 'FIA Formula 3 Championship'],
  'f1-academy': ['F1 Academy'],
  fe: ['Formula E'],
  wec: ['WEC', 'World Endurance Championship'],
  imsa: ['IMSA', 'IMSA SportsCar Championship', 'IMSA WeatherTech SportsCar Championship'],
  dtm: ['DTM'],
  indycar: ['IndyCar Series', 'IndyCar'],
  nascar: ['NASCAR Cup Series', 'NASCAR'],
  wrc: ['WRC', 'World Rally Championship'],
  'gt-world-challenge': ['GT World Challenge Europe', 'GT World Challenge'],
};

type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

type SportsDbLeague = {
  strCurrentSeason?: string | null;
  strDescriptionEN?: string | null;
  strDescriptionPT?: string | null;
};

type SportsDbLeagueResponse = {
  leagues?: SportsDbLeague[] | null;
};

type SportsDbTeam = {
  idTeam?: string | null;
  strTeam?: string | null;
  strColour1?: string | null;
  strBadge?: string | null;
  strEquipment?: string | null;
};

type SportsDbTeamsResponse = {
  teams?: SportsDbTeam[] | null;
};

type SportsDbPlayer = {
  idPlayer?: string | null;
  strPlayer?: string | null;
  strNumber?: string | null;
  strNationality?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
  strRender?: string | null;
};

type SportsDbPlayersResponse = {
  player?: SportsDbPlayer[] | null;
};

type SportsDbPlayerSearchResponse = {
  player?: SportsDbPlayer[] | null;
};

type SportsDbEvent = {
  idEvent?: string | null;
  strEvent?: string | null;
  strEventAlternate?: string | null;
  dateEvent?: string | null;
  strVenue?: string | null;
  strCity?: string | null;
  strCountry?: string | null;
  strStatus?: string | null;
  strPostponed?: string | null;
  intRound?: string | null;
};

type SportsDbEventsResponse = {
  events?: SportsDbEvent[] | null;
};

export type SportsDbLiveEvent = {
  id: string;
  name: string;
  date: string;
  circuit: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
};

export type SportsDbCategoryData = {
  currentSeason?: string;
  longDescription?: string;
  enLongDescription?: string;
  teams?: Team[];
  drivers?: Driver[];
  nextEvent?: SportsDbLiveEvent | null;
  lastEvent?: SportsDbLiveEvent | null;
};

const summaryCache = new Map<string, CacheEntry<SportsDbCategoryData | null>>();
const detailCache = new Map<string, CacheEntry<SportsDbCategoryData | null>>();

export function isCategoryLiveSupported(categoryId: Category['id']) {
  return categoryId in CATEGORY_LEAGUE_IDS;
}

export function getSupportedLiveCategoryIds() {
  return Object.keys(CATEGORY_LEAGUE_IDS) as Category['id'][];
}

export function mergeCategoryWithLiveData(category: Category, liveData: SportsDbCategoryData | null): Category {
  if (!liveData) {
    return category;
  }

  return {
    ...category,
    longDescription: liveData.longDescription || category.longDescription,
    enLongDescription: liveData.enLongDescription || category.enLongDescription || category.longDescription,
    teams: liveData.teams?.length ? liveData.teams : category.teams,
    drivers: liveData.drivers?.length ? liveData.drivers : category.drivers,
  };
}

export async function fetchCategoryLiveSummary(category: Category, force = false): Promise<SportsDbCategoryData | null> {
  return getCached(summaryCache, `${category.id}:summary`, SUMMARY_CACHE_TTL_MS, force, () => fetchCategoryLiveSummaryUncached(category));
}

export async function fetchCategoryLiveData(category: Category, force = false): Promise<SportsDbCategoryData | null> {
  return getCached(detailCache, `${category.id}:detail`, DETAIL_CACHE_TTL_MS, force, () => fetchCategoryLiveDataUncached(category));
}

async function fetchCategoryLiveSummaryUncached(category: Category): Promise<SportsDbCategoryData | null> {
  const leagueId = CATEGORY_LEAGUE_IDS[category.id];
  if (!leagueId) {
    return null;
  }

  const [leagueResponse, seasonEventsResponse] = await Promise.all([
    fetchJson<SportsDbLeagueResponse>(`lookupleague.php?id=${leagueId}`),
    fetchJson<SportsDbEventsResponse>(`eventsseason.php?id=${leagueId}&s=${getCategorySeason(category)}`).catch(() => ({ events: null })),
  ]);

  const league = leagueResponse.leagues?.[0];
  const calendar = mapCalendar(seasonEventsResponse.events ?? [], category);

  const nextEvent = calendar.find((race) => race.status === 'upcoming');
  const lastEvent = [...calendar].reverse().find((race) => race.status === 'completed');

  return {
    currentSeason: league?.strCurrentSeason || getCategorySeason(category),
    longDescription: league?.strDescriptionPT || category.longDescription,
    enLongDescription: league?.strDescriptionEN || category.enLongDescription || category.longDescription,
    nextEvent: nextEvent ? mapRaceToLiveEvent(nextEvent) : null,
    lastEvent: lastEvent ? mapRaceToLiveEvent(lastEvent) : null,
  };
}

async function fetchCategoryLiveDataUncached(category: Category): Promise<SportsDbCategoryData | null> {
  const leagueId = CATEGORY_LEAGUE_IDS[category.id];
  if (!leagueId) {
    return null;
  }

  const summary = await fetchCategoryLiveSummaryUncached(category);
  const teamsResponse = await fetchTeamsForCategory(category);

  const fallbackTeams = new Map(category.teams.map((team) => [normalizeText(team.name), team]));
  const mappedTeams = (teamsResponse.teams ?? [])
    .filter((team): team is SportsDbTeam & { idTeam: string; strTeam: string } => Boolean(team.idTeam && team.strTeam))
    .map((team) => mapTeam(team, fallbackTeams.get(normalizeText(team.strTeam))));

  const rosterDrivers = mappedTeams.length ? await fetchDriversForTeams(mappedTeams) : [];
  const drivers = await resolveCategoryDrivers(category, rosterDrivers);

  return {
    ...summary,
    teams: mappedTeams.length ? mappedTeams : undefined,
    drivers: drivers.length ? drivers : undefined,
  };
}

async function fetchTeamsForCategory(category: Category): Promise<SportsDbTeamsResponse> {
  const candidateNames = uniqueStrings([
    ...(CATEGORY_TEAM_SEARCH_ALIASES[category.id] ?? []),
    category.fullName,
    category.enFullName,
    category.name,
  ]);

  for (const candidate of candidateNames) {
    try {
      const response = await fetchJson<SportsDbTeamsResponse>(`search_all_teams.php?l=${encodeURIComponent(candidate)}`);
      if (response.teams?.length) {
        return response;
      }
    } catch {
      // Try the next alias when the current one is unsupported or rate-limited.
    }
  }

  return { teams: null };
}

async function fetchDriversForTeams(teams: Team[]) {
  const responses = await Promise.allSettled(
    teams.map(async (team) => {
      const payload = await fetchJson<SportsDbPlayersResponse>(`lookup_all_players.php?id=${team.id}`);
      return (payload.player ?? [])
        .filter((player): player is SportsDbPlayer & { idPlayer: string; strPlayer: string } => Boolean(player.idPlayer && player.strPlayer))
        .map((player) => mapDriver(player, team.id));
    }),
  );

  return responses.flatMap((response) => (response.status === 'fulfilled' ? response.value : []));
}

async function resolveCategoryDrivers(category: Category, rosterDrivers: Driver[]) {
  const mergedDrivers = mergeDriversByName(category.drivers, rosterDrivers);
  const driversMissingPhoto = mergedDrivers.filter((driver) => !driver.image);

  if (!driversMissingPhoto.length) {
    return mergedDrivers;
  }

  const imageResults = await Promise.allSettled(
    driversMissingPhoto.map(async (driver) => {
      const payload = await fetchJson<SportsDbPlayerSearchResponse>(`searchplayers.php?p=${encodeURIComponent(driver.name)}`);
      const bestMatch = (payload.player ?? []).find((player) => normalizeText(player.strPlayer || '') === normalizeText(driver.name))
        ?? payload.player?.[0];

      return [
        normalizeText(driver.name),
        bestMatch ? {
          image: bestMatch.strThumb || bestMatch.strCutout || bestMatch.strRender || undefined,
          nationality: bestMatch.strNationality || undefined,
          number: bestMatch.strNumber || undefined,
        } : null,
      ] as const;
    }),
  );

  const imageByDriverName = new Map<string, { image?: string; nationality?: string; number?: string }>();
  for (const result of imageResults) {
    if (result.status === 'fulfilled' && result.value[1] != null) {
      imageByDriverName.set(result.value[0], result.value[1]);
    }
  }

  return mergedDrivers.map((driver) => {
    const fallback = imageByDriverName.get(normalizeText(driver.name));
    if (!fallback) {
      return driver;
    }

    return {
      ...driver,
      image: driver.image || fallback.image,
      nationality: driver.nationality === 'N/A' ? (fallback.nationality || driver.nationality) : driver.nationality,
      number: driver.number === '--' ? (fallback.number || driver.number) : driver.number,
    };
  });
}

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}/${path}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`TheSportsDB request failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  force: boolean,
  loader: () => Promise<T>,
) {
  const now = Date.now();
  const cached = cache.get(key);
  if (!force && cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = loader().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

function mapTeam(team: SportsDbTeam & { idTeam: string; strTeam: string }, fallback?: Team): Team {
  return {
    id: team.idTeam,
    name: team.strTeam,
    color: team.strColour1 || fallback?.color || '#e10600',
    car: fallback?.car,
    logo: team.strBadge || team.strEquipment || fallback?.logo,
    class: fallback?.class,
  };
}

function mapDriver(player: SportsDbPlayer & { idPlayer: string; strPlayer: string }, teamId: string): Driver {
  return {
    id: player.idPlayer,
    name: player.strPlayer,
    number: player.strNumber || '--',
    nationality: player.strNationality || 'N/A',
    teamId,
    image: player.strThumb || player.strCutout || player.strRender || undefined,
  };
}

function mergeDriversByName(baseDrivers: Driver[], liveDrivers: Driver[]) {
  const merged = new Map<string, Driver>();

  for (const driver of baseDrivers) {
    merged.set(normalizeText(driver.name), driver);
  }

  for (const driver of liveDrivers) {
    const key = normalizeText(driver.name);
    const current = merged.get(key);
    merged.set(key, {
      ...(current ?? driver),
      ...driver,
      teamId: driver.teamId || current?.teamId || '',
      image: driver.image || current?.image,
      nationality: driver.nationality || current?.nationality || 'N/A',
      number: driver.number || current?.number || '--',
    });
  }

  return Array.from(merged.values());
}

function mapCalendar(events: SportsDbEvent[], category: Category): Race[] {
  if (!events.length) {
    return [];
  }

  const grouped = new Map<string, SportsDbEvent[]>();
  for (const event of events) {
    if (!event.idEvent || !event.strEvent || !event.dateEvent) continue;
    const groupKey = event.intRound?.trim() || event.dateEvent;
    const current = grouped.get(groupKey) ?? [];
    current.push(event);
    grouped.set(groupKey, current);
  }

  return Array.from(grouped.values())
    .map((group) => group.sort((a, b) => scoreEvent(a.strEvent || '', category) - scoreEvent(b.strEvent || '', category))[0])
    .filter((event): event is SportsDbEvent & { idEvent: string; strEvent: string; dateEvent: string } => Boolean(event?.idEvent && event.strEvent && event.dateEvent))
    .sort((a, b) => a.dateEvent.localeCompare(b.dateEvent))
    .map((event) => mapEventToRace(event, category));
}

function mapEventToRace(event: SportsDbEvent & { idEvent: string; strEvent: string; dateEvent: string }, category: Category): Race {
  const fallbackRace = findFallbackRace(category, event);
  const location = [event.strCity, event.strCountry].filter(Boolean).join(', ') || fallbackRace?.location || 'TBC';

  return {
    id: event.idEvent,
    name: fallbackRace?.name || event.strEvent,
    enName: event.strEvent,
    location,
    enLocation: location,
    date: event.dateEvent,
    circuit: event.strVenue || fallbackRace?.circuit || 'TBC',
    status: getEventStatus(event),
    winner: fallbackRace?.winner,
  };
}

function findFallbackRace(category: Category, event: SportsDbEvent) {
  const normalizedEventName = normalizeText(event.strEvent || '');
  return category.calendar.find((race) => {
    if (race.date === event.dateEvent) {
      return true;
    }
    return normalizedEventName.includes(normalizeText(race.enName || race.name))
      || normalizeText(race.enName || race.name).includes(normalizedEventName);
  });
}

function mapRaceToLiveEvent(race: Race): SportsDbLiveEvent {
  return {
    id: race.id,
    name: race.enName || race.name,
    date: race.date,
    circuit: race.circuit,
    location: race.enLocation || race.location,
    status: race.status,
  };
}

function getEventStatus(event: SportsDbEvent): Race['status'] {
  if (event.strPostponed && event.strPostponed !== 'no') {
    return 'cancelled';
  }

  if ((event.strStatus || '').toLowerCase().includes('finished')) {
    return 'completed';
  }

  const today = new Date().toISOString().slice(0, 10);
  if (event.dateEvent < today) {
    return 'completed';
  }

  return 'upcoming';
}

function scoreEvent(name: string, category: Category) {
  const normalized = normalizeText(name);

  if (normalized.includes('testing') || normalized.includes('practice') || normalized.includes('qualifying')) {
    return 100;
  }

  if (normalized.includes('sprint qualifying') || normalized.includes('duel')) {
    return 90;
  }

  if (normalized.includes('feature race')) {
    return 1;
  }

  if (normalized.includes('race 2')) {
    return 2;
  }

  if (normalized.includes('grand prix') || normalized.includes('e prix') || normalized.includes('500') || normalized.includes('6 hours') || normalized.includes('24 hours')) {
    return 0;
  }

  if (normalized.includes('sprint')) {
    return category.id === 'f2' || category.id === 'f3' ? 5 : 50;
  }

  if (normalized.includes('race 1')) {
    return 6;
  }

  return 10;
}

function getCategorySeason(category: Category) {
  return category.calendar[0]?.date.slice(0, 4) || '2026';
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}
