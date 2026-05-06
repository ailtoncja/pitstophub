import type { Category, CategoryStandings, Driver, Race, StandingItem, Team } from './types';

const API_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/123';
const API_REQUEST_TIMEOUT_MS = 8000;
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;
const DETAIL_CACHE_TTL_MS = 10 * 60 * 1000;
const RESULTS_CACHE_TTL_MS = 10 * 60 * 1000;

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

type SportsDbResult = {
  idPlayer?: string | null;
  strPlayer?: string | null;
  idTeam?: string | null;
  intPoints?: string | null;
  intPosition?: string | null;
};

type SportsDbResultsResponse = {
  results?: SportsDbResult[] | null;
};

type SportsDbCalendarOverlay = {
  calendar: Race[];
  apiEventsByRaceId: Map<string, SportsDbEvent & { idEvent: string; strEvent: string; dateEvent: string }>;
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
  calendar?: Race[];
  standings?: CategoryStandings;
  nextEvent?: SportsDbLiveEvent | null;
  lastEvent?: SportsDbLiveEvent | null;
};

const summaryCache = new Map<string, CacheEntry<SportsDbCategoryData | null>>();
const detailCache = new Map<string, CacheEntry<SportsDbCategoryData | null>>();
const resultsCache = new Map<string, CacheEntry<SportsDbResult[]>>();

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
    calendar: liveData.calendar?.length ? liveData.calendar : category.calendar,
    standings: liveData.standings ? mergeStandings(category.standings, liveData.standings) : category.standings,
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
    fetchJson<SportsDbLeagueResponse>(`lookupleague.php?id=${leagueId}`).catch(() => ({ leagues: null })),
    fetchJson<SportsDbEventsResponse>(`eventsseason.php?id=${leagueId}&s=${getCategorySeason(category)}`).catch(() => ({ events: null })),
  ]);

  const league = leagueResponse.leagues?.[0];
  const overlay = buildCalendarOverlay(category, seasonEventsResponse.events ?? []);
  const nextEvent = overlay.calendar.find((race) => race.status === 'upcoming') ?? null;
  const lastEvent = [...overlay.calendar].reverse().find((race) => race.status === 'completed') ?? null;

  return {
    currentSeason: league?.strCurrentSeason || getCategorySeason(category),
    longDescription: league?.strDescriptionPT || category.longDescription,
    enLongDescription: league?.strDescriptionEN || category.enLongDescription || category.longDescription,
    calendar: overlay.calendar,
    nextEvent: nextEvent ? mapRaceToLiveEvent(nextEvent) : null,
    lastEvent: lastEvent ? mapRaceToLiveEvent(lastEvent) : null,
  };
}

async function fetchCategoryLiveDataUncached(category: Category): Promise<SportsDbCategoryData | null> {
  const leagueId = CATEGORY_LEAGUE_IDS[category.id];
  if (!leagueId) {
    return null;
  }

  const [leagueResponse, seasonEventsResponse, teamsResponse] = await Promise.all([
    fetchJson<SportsDbLeagueResponse>(`lookupleague.php?id=${leagueId}`).catch(() => ({ leagues: null })),
    fetchJson<SportsDbEventsResponse>(`eventsseason.php?id=${leagueId}&s=${getCategorySeason(category)}`).catch(() => ({ events: null })),
    fetchTeamsForCategory(category),
  ]);

  const league = leagueResponse.leagues?.[0];
  const overlay = buildCalendarOverlay(category, seasonEventsResponse.events ?? []);
  const calendarWithWinners = await syncWinnersIntoCalendar(overlay.calendar);

  const fallbackTeams = new Map(category.teams.map((team) => [normalizeText(team.name), team]));
  const mappedTeams = (teamsResponse.teams ?? [])
    .filter((team): team is SportsDbTeam & { idTeam: string; strTeam: string } => Boolean(team.idTeam && team.strTeam))
    .map((team) => mapTeam(team, fallbackTeams.get(normalizeText(team.strTeam))));

  const rosterDrivers = mappedTeams.length ? await fetchDriversForTeams(mappedTeams) : [];
  const drivers = await resolveCategoryDrivers(category, rosterDrivers);
  const normalizedCalendar = canonicalizeCalendarWinners(calendarWithWinners, drivers);
  const standings = await buildLiveStandings(category, normalizedCalendar, drivers, mappedTeams, forceNumericRaceIds(normalizedCalendar));
  const nextEvent = normalizedCalendar.find((race) => race.status === 'upcoming') ?? null;
  const lastEvent = [...normalizedCalendar].reverse().find((race) => race.status === 'completed') ?? null;

  return {
    currentSeason: league?.strCurrentSeason || getCategorySeason(category),
    longDescription: league?.strDescriptionPT || category.longDescription,
    enLongDescription: league?.strDescriptionEN || category.enLongDescription || category.longDescription,
    teams: mappedTeams.length ? mappedTeams : undefined,
    drivers: drivers.length ? drivers : undefined,
    calendar: normalizedCalendar,
    standings,
    nextEvent: nextEvent ? mapRaceToLiveEvent(nextEvent) : null,
    lastEvent: lastEvent ? mapRaceToLiveEvent(lastEvent) : null,
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

async function syncWinnersIntoCalendar(calendar: Race[]) {
  const resultsByRaceId = await fetchResultsForRaces(forceNumericRaceIds(calendar));
  return calendar.map((race) => {
    const results = resultsByRaceId.get(race.id) ?? [];
    const winner = results
      .find((result) => Number(result.intPosition || '999') === 1)
      ?.strPlayer;

    return {
      ...race,
      winner: winner || race.winner,
    };
  });
}

async function buildLiveStandings(
  category: Category,
  calendar: Race[],
  drivers: Driver[],
  teams: Team[],
  eligibleRaceIds: string[],
) {
  const baseDriverCount = category.standings?.drivers?.length ?? 0;
  const baseConstructorCount = category.standings?.constructors?.length ?? category.standings?.teams?.length ?? 0;

  if (!baseDriverCount && !baseConstructorCount) {
    return undefined;
  }

  const completedRaces = calendar.filter((race) => race.status === 'completed' && eligibleRaceIds.includes(race.id));
  if (!completedRaces.length) {
    return undefined;
  }

  const resultsByRaceId = await fetchResultsForRaces(completedRaces.map((race) => race.id));
  const resultSets = Array.from(resultsByRaceId.values()).filter((results) => results.length > 0);
  if (!resultSets.length) {
    return undefined;
  }

  const averageRows = resultSets.reduce((total, results) => total + results.length, 0) / resultSets.length;
  const uniqueDrivers = new Set(
    resultSets.flatMap((results) => results.map((result) => normalizeText(result.strPlayer || '')).filter(Boolean)),
  ).size;

  const minDriverCoverage = Math.min(Math.max(6, Math.ceil(baseDriverCount * 0.45)), baseDriverCount || 6);
  if (averageRows < 6 || uniqueDrivers < minDriverCoverage) {
    return undefined;
  }

  const pointsByDriver = new Map<string, { name: string; points: number; teamName?: string }>();
  const pointsByTeam = new Map<string, { name: string; points: number }>();

  for (const results of resultSets) {
    for (const result of results) {
      if (!result.strPlayer) continue;

      const driverKey = normalizeText(result.strPlayer);
      const teamName = findTeamName(result.idTeam, teams, drivers, result.strPlayer);
      const driverEntry = pointsByDriver.get(driverKey) ?? { name: result.strPlayer, points: 0, teamName };
      driverEntry.points += Number(result.intPoints || '0');
      driverEntry.teamName = driverEntry.teamName || teamName;
      pointsByDriver.set(driverKey, driverEntry);

      if (teamName) {
        const teamKey = normalizeText(teamName);
        const teamEntry = pointsByTeam.get(teamKey) ?? { name: teamName, points: 0 };
        teamEntry.points += Number(result.intPoints || '0');
        pointsByTeam.set(teamKey, teamEntry);
      }
    }
  }

  const driverStandings = toStandingItems(
    Array.from(pointsByDriver.values())
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((entry) => ({ name: entry.name, points: entry.points, team: entry.teamName })),
  );

  const teamStandings = toStandingItems(
    Array.from(pointsByTeam.values())
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((entry) => ({ name: entry.name, points: entry.points })),
  );

  if (!driverStandings.length && !teamStandings.length) {
    return undefined;
  }

  return {
    drivers: driverStandings.length ? driverStandings : undefined,
    constructors: category.standings?.constructors?.length ? teamStandings : undefined,
    teams: category.standings?.teams?.length ? teamStandings : undefined,
  } satisfies CategoryStandings;
}

async function fetchResultsForRaces(raceIds: string[]) {
  const validRaceIds = uniqueStrings(raceIds.filter((raceId) => /^\d+$/.test(raceId)));
  const resultsByRaceId = new Map<string, SportsDbResult[]>();

  const responses = await Promise.allSettled(
    validRaceIds.map(async (raceId) => {
      const results = await getCached(resultsCache, `result:${raceId}`, RESULTS_CACHE_TTL_MS, false, async () => {
        const payload = await fetchJson<SportsDbResultsResponse>(`eventresults.php?id=${raceId}`);
        return payload.results ?? [];
      });
      return [raceId, results] as const;
    }),
  );

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      resultsByRaceId.set(response.value[0], response.value[1]);
    }
  }

  return resultsByRaceId;
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
    if (cached) {
      return cached.value;
    }
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

function buildCalendarOverlay(category: Category, events: SportsDbEvent[]): SportsDbCalendarOverlay {
  const apiMainEvents = mapCalendar(events, category);
  const matchedApiEvents = new Set<string>();
  const calendar = category.calendar.map((baseRace) => {
    const matchedRace = findBestApiRaceForBaseRace(baseRace, apiMainEvents.filter((race) => !matchedApiEvents.has(race.id)));
    if (!matchedRace) {
      return normalizeBaseRaceStatus(baseRace);
    }

    matchedApiEvents.add(matchedRace.id);
    return {
      ...baseRace,
      id: matchedRace.id,
      enName: matchedRace.enName || baseRace.enName,
      location: matchedRace.location || baseRace.location,
      enLocation: matchedRace.enLocation || baseRace.enLocation || matchedRace.location,
      circuit: matchedRace.circuit || baseRace.circuit,
      status: matchedRace.status,
      winner: matchedRace.winner || baseRace.winner,
    };
  });

  return {
    calendar,
    apiEventsByRaceId: new Map(
      apiMainEvents
        .filter((race) => matchedApiEvents.has(race.id))
        .map((race) => [
          race.id,
          {
            idEvent: race.id,
            strEvent: race.enName || race.name,
            dateEvent: race.date,
          } as SportsDbEvent & { idEvent: string; strEvent: string; dateEvent: string },
        ]),
    ),
  };
}

function findBestApiRaceForBaseRace(baseRace: Race, candidates: Race[]) {
  return candidates.find((candidate) => candidate.date === baseRace.date)
    ?? candidates.find((candidate) => namesLikelyMatch(baseRace, candidate))
    ?? null;
}

function namesLikelyMatch(baseRace: Race, candidate: Race) {
  const baseNames = [baseRace.name, baseRace.enName].filter(Boolean).map((value) => normalizeText(value!));
  const candidateNames = [candidate.name, candidate.enName].filter(Boolean).map((value) => normalizeText(value!));

  return baseNames.some((baseName) =>
    candidateNames.some((candidateName) =>
      baseName === candidateName
      || baseName.includes(candidateName)
      || candidateName.includes(baseName),
    ),
  );
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
    const key = findBestDriverKey(driver, merged) ?? normalizeText(driver.name);
    const current = merged.get(key);
    if (!current && baseDrivers.length > 0 && key === normalizeText(driver.name)) {
      continue;
    }

    merged.set(key, {
      ...(current ?? driver),
      ...driver,
      name: current?.name || driver.name,
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

function canonicalizeCalendarWinners(calendar: Race[], drivers: Driver[]) {
  return calendar.map((race) => {
    if (!race.winner) {
      return race;
    }

    const matchedDriver = drivers.find((driver) => namesLikelyReferToSameDriver(driver.name, race.winner!));
    return {
      ...race,
      winner: matchedDriver?.name || race.winner,
    };
  });
}

function findTeamName(resultTeamId: string | null | undefined, teams: Team[], drivers: Driver[], driverName: string) {
  if (resultTeamId) {
    const team = teams.find((entry) => entry.id === resultTeamId);
    if (team) {
      return team.name;
    }
  }

  const driver = drivers.find((entry) => normalizeText(entry.name) === normalizeText(driverName));
  if (!driver) {
    return undefined;
  }

  return teams.find((entry) => entry.id === driver.teamId)?.name
    || driver.teamId;
}

function toStandingItems(items: Array<{ name: string; points: number; team?: string }>): StandingItem[] {
  return items.map((item, index) => ({
    position: index + 1,
    name: item.name,
    points: item.points,
    team: item.team,
  }));
}

function mergeStandings(base: CategoryStandings | undefined, live: CategoryStandings): CategoryStandings {
  return {
    drivers: mergeStandingList(base?.drivers, live.drivers),
    constructors: mergeStandingList(base?.constructors, live.constructors),
    teams: mergeStandingList(base?.teams, live.teams),
  };
}

function mergeStandingList(base: StandingItem[] | undefined, live: StandingItem[] | undefined) {
  if (!live?.length) {
    return base;
  }

  if (!base?.length) {
    return live;
  }

  const byName = new Map(base.map((item) => [normalizeText(item.name), item]));
  for (const liveItem of live) {
    byName.set(normalizeText(liveItem.name), {
      ...byName.get(normalizeText(liveItem.name)),
      ...liveItem,
    });
  }

  return Array.from(byName.values())
    .sort((a, b) => b.points - a.points || a.position - b.position || a.name.localeCompare(b.name))
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));
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

function forceNumericRaceIds(calendar: Race[]) {
  return calendar
    .map((race) => race.id)
    .filter((raceId) => /^\d+$/.test(raceId));
}

function normalizeBaseRaceStatus(race: Race): Race {
  if (race.status !== 'upcoming') {
    return race;
  }

  const today = new Date().toISOString().slice(0, 10);
  if (race.date < today) {
    return {
      ...race,
      status: 'completed',
    };
  }

  return race;
}

function findBestDriverKey(driver: Driver, merged: Map<string, Driver>) {
  const normalizedName = normalizeText(driver.name);
  if (merged.has(normalizedName)) {
    return normalizedName;
  }

  for (const [key, current] of merged.entries()) {
    if (current.teamId && driver.teamId && current.teamId !== driver.teamId) {
      continue;
    }

    if (namesLikelyReferToSameDriver(current.name, driver.name)) {
      return key;
    }
  }

  return null;
}

function namesLikelyReferToSameDriver(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const leftWords = normalizedLeft.split(' ').filter(Boolean);
  const rightWords = normalizedRight.split(' ').filter(Boolean);
  const leftLast = leftWords[leftWords.length - 1];
  const rightLast = rightWords[rightWords.length - 1];

  return Boolean(leftLast && rightLast && leftLast === rightLast);
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
