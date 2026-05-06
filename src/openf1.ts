import type { Category, CategoryStandings, Driver, Race, Team } from './types';

const OPEN_F1_API_BASE_URL = '/api/openf1';
const API_REQUEST_TIMEOUT_MS = 8000;
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;
const DETAIL_CACHE_TTL_MS = 10 * 60 * 1000;
const SUPPORTED_CATEGORY_IDS = new Set(['f1']);
const TEAM_NAME_ALIASES = new Map<string, string>([
  ['mercedes-amg petronas', 'mercedes'],
  ['mercedes amg petronas', 'mercedes'],
  ['scuderia ferrari hp', 'ferrari'],
  ['mclaren formula 1', 'mclaren'],
  ['moneygram haas f1 team', 'haas f1 team'],
  ['bwt alpine f1 team', 'alpine'],
  ['oracle red bull racing', 'red bull racing'],
  ['red bull', 'red bull racing'],
  ['visa cash app rb', 'racing bulls'],
  ['visa cash app racing bulls', 'racing bulls'],
  ['rb', 'racing bulls'],
  ['williams racing', 'williams'],
  ['audi f1 team', 'audi'],
  ['cadillac racing', 'cadillac'],
  ['aston martin aramco', 'aston martin'],
]);

export type LiveCoverageTier = 'supported' | 'local';

type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

type OpenF1Meeting = {
  circuit_short_name?: string | null;
  country_name?: string | null;
  date_end?: string | null;
  date_start?: string | null;
  is_cancelled?: boolean | null;
  location?: string | null;
  meeting_key?: number | null;
  meeting_name?: string | null;
  meeting_official_name?: string | null;
  year?: number | null;
};

type OpenF1Session = {
  circuit_short_name?: string | null;
  country_name?: string | null;
  date_end?: string | null;
  date_start?: string | null;
  is_cancelled?: boolean | null;
  location?: string | null;
  meeting_key?: number | null;
  session_key?: number | null;
  session_name?: string | null;
  session_type?: string | null;
  year?: number | null;
};

type OpenF1Driver = {
  driver_number?: number | null;
  full_name?: string | null;
  headshot_url?: string | null;
  team_colour?: string | null;
  team_name?: string | null;
};

type OpenF1DriverStanding = {
  driver_number?: number | null;
  points_current?: number | null;
  position_current?: number | null;
};

type OpenF1TeamStanding = {
  points_current?: number | null;
  position_current?: number | null;
  team_name?: string | null;
};

type OpenF1SessionResult = {
  driver_number?: number | null;
  position?: number | null;
};

type F1SeasonContext = {
  latestCompletedRaceSession: OpenF1Session | null;
  latestKnownSession: OpenF1Session | null;
  meetings: OpenF1Meeting[];
  raceSessionsByMeetingKey: Map<number, OpenF1Session>;
  year: string;
};

export type OpenF1LiveEvent = {
  id: string;
  name: string;
  date: string;
  circuit: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
};

export type OpenF1CategoryData = {
  currentSeason?: string;
  longDescription?: string;
  enLongDescription?: string;
  teams?: Team[];
  drivers?: Driver[];
  calendar?: Race[];
  standings?: CategoryStandings;
  nextEvent?: OpenF1LiveEvent | null;
  lastEvent?: OpenF1LiveEvent | null;
  matchedTeamCount?: number;
  matchedDriverCount?: number;
  matchedCalendarCount?: number;
};

const summaryCache = new Map<string, CacheEntry<OpenF1CategoryData | null>>();
const detailCache = new Map<string, CacheEntry<OpenF1CategoryData | null>>();

export function isCategoryLiveSupported(categoryId: Category['id']) {
  return getCategoryLiveCoverage(categoryId) === 'supported';
}

export function getSupportedLiveCategoryIds() {
  return Array.from(SUPPORTED_CATEGORY_IDS);
}

export function getCategoryLiveCoverage(categoryId: Category['id']): LiveCoverageTier {
  return SUPPORTED_CATEGORY_IDS.has(categoryId) ? 'supported' : 'local';
}

export function mergeCategoryWithLiveData(category: Category, liveData: OpenF1CategoryData | null): Category {
  if (!liveData) {
    return category;
  }

  const mergedTeams = liveData.teams?.length ? mergeTeamsByName(category.teams, liveData.teams) : category.teams;
  const mergedDrivers = liveData.drivers?.length ? mergeDriversByName(category.drivers, liveData.drivers) : category.drivers;

  return {
    ...category,
    longDescription: liveData.longDescription || category.longDescription,
    enLongDescription: liveData.enLongDescription || category.enLongDescription || category.longDescription,
    teams: mergedTeams,
    drivers: mergedDrivers,
    calendar: liveData.calendar?.length ? liveData.calendar : category.calendar,
    standings: liveData.standings || category.standings,
  };
}

export async function fetchCategoryLiveSummary(category: Category, force = false): Promise<OpenF1CategoryData | null> {
  return getCached(summaryCache, `${category.id}:summary`, SUMMARY_CACHE_TTL_MS, force, async () => {
    if (category.id !== 'f1') {
      return null;
    }

    const context = await fetchF1SeasonContext(category);
    const calendar = await fetchF1Calendar(category, context);
    const nextEvent = getNextUpcomingRace(calendar);
    const lastEvent = getLastCompletedRace(calendar);

    return {
      currentSeason: context.year,
      calendar,
      nextEvent: nextEvent ? mapRaceToLiveEvent(nextEvent) : null,
      lastEvent: lastEvent ? mapRaceToLiveEvent(lastEvent) : null,
      matchedCalendarCount: calendar.length,
    };
  });
}

export async function fetchCategoryLiveData(category: Category, force = false): Promise<OpenF1CategoryData | null> {
  return getCached(detailCache, `${category.id}:detail`, DETAIL_CACHE_TTL_MS, force, async () => {
    if (category.id !== 'f1') {
      return null;
    }

    const context = await fetchF1SeasonContext(category);
    const [calendar, teams, drivers, standings] = await Promise.all([
      fetchF1Calendar(category, context),
      fetchF1Teams(category, context),
      fetchF1Drivers(category, context),
      fetchF1Standings(context),
    ]);

    const mergedTeams = teams.length ? mergeTeamsByName(category.teams, teams) : category.teams;
    const mergedDrivers = drivers.length ? mergeDriversByName(category.drivers, drivers) : category.drivers;
    const normalizedCalendar = normalizeCalendarWinners(calendar, mergedDrivers);
    const nextEvent = getNextUpcomingRace(normalizedCalendar);
    const lastEvent = getLastCompletedRace(normalizedCalendar);

    return {
      currentSeason: context.year,
      teams,
      drivers,
      calendar: normalizedCalendar,
      standings,
      nextEvent: nextEvent ? mapRaceToLiveEvent(nextEvent) : null,
      lastEvent: lastEvent ? mapRaceToLiveEvent(lastEvent) : null,
      matchedTeamCount: countMatchedTeams(category.teams, mergedTeams),
      matchedDriverCount: countMatchedDrivers(category.drivers, mergedDrivers),
      matchedCalendarCount: normalizedCalendar.length,
    };
  });
}

async function fetchF1SeasonContext(category: Category): Promise<F1SeasonContext> {
  const year = getCategorySeason(category);
  const [meetings, sessions] = await Promise.all([
    fetchOpenF1Json<OpenF1Meeting[]>(`/meetings?year=${year}`),
    fetchOpenF1Json<OpenF1Session[]>(`/sessions?year=${year}`),
  ]);

  const filteredMeetings = meetings
    .filter((meeting) => isGrandPrixMeeting(meeting))
    .sort((left, right) => (left.date_start || left.date_end || '').localeCompare(right.date_start || right.date_end || ''));

  const raceSessionsByMeetingKey = new Map<number, OpenF1Session>();
  const raceSessions = sessions
    .filter((session) => session.meeting_key != null && isMainRaceSession(session))
    .sort((left, right) => (left.date_start || '').localeCompare(right.date_start || ''));

  for (const session of raceSessions) {
    raceSessionsByMeetingKey.set(session.meeting_key!, session);
  }

  const now = new Date();
  const latestCompletedRaceSession = [...raceSessionsByMeetingKey.values()]
    .filter((session) => session.date_end && new Date(session.date_end) <= now)
    .sort((left, right) => (right.date_end || '').localeCompare(left.date_end || ''))[0] ?? null;

  const latestKnownSession = [...sessions]
    .filter((session) => session.session_key != null)
    .sort((left, right) => (right.date_start || '').localeCompare(left.date_start || ''))[0] ?? null;

  return {
    latestCompletedRaceSession,
    latestKnownSession,
    meetings: filteredMeetings,
    raceSessionsByMeetingKey,
    year,
  };
}

async function fetchF1Calendar(category: Category, context: F1SeasonContext): Promise<Race[]> {
  const driverMap = await fetchDriverIndexForWinners(context);
  const winnerPromises = context.meetings.map(async (meeting) => {
    const meetingKey = meeting.meeting_key;
    const raceSession = meetingKey != null ? context.raceSessionsByMeetingKey.get(meetingKey) : undefined;
    if (!raceSession?.session_key || !raceSession.date_end || new Date(raceSession.date_end) > new Date()) {
      return [meetingKey ?? -1, null] as const;
    }

    try {
      const results = await fetchOpenF1Json<OpenF1SessionResult[]>(`/session_result?session_key=${raceSession.session_key}`);
      const winner = results.find((entry) => entry.position === 1);
      return [meetingKey ?? -1, winner?.driver_number ? driverMap.get(winner.driver_number) ?? null : null] as const;
    } catch {
      return [meetingKey ?? -1, null] as const;
    }
  });

  const winnerEntries = await Promise.all(winnerPromises);
  const winnerByMeetingKey = new Map<number, string | null>(winnerEntries);

  return context.meetings.map((meeting, index) => {
    const raceSession = meeting.meeting_key != null ? context.raceSessionsByMeetingKey.get(meeting.meeting_key) : undefined;
    const matchedBaseRace = findBestBaseRace(category.calendar, meeting, raceSession);
    const date = extractDate(raceSession?.date_start || meeting.date_end || meeting.date_start) || matchedBaseRace?.date || '';
    const status = getMeetingStatus(meeting, raceSession, date);

    return {
      id: matchedBaseRace?.id || createRaceId(meeting, index),
      name: matchedBaseRace?.name || formatRaceNamePt(meeting.meeting_name),
      enName: matchedBaseRace?.enName || meeting.meeting_name || undefined,
      location: matchedBaseRace?.location || meeting.location || meeting.country_name || 'N/A',
      enLocation: matchedBaseRace?.enLocation || meeting.location || meeting.country_name || undefined,
      date,
      circuit: matchedBaseRace?.circuit || raceSession?.circuit_short_name || meeting.circuit_short_name || 'N/A',
      status,
      winner: meeting.meeting_key != null ? winnerByMeetingKey.get(meeting.meeting_key) || matchedBaseRace?.winner : matchedBaseRace?.winner,
    };
  });
}

async function fetchF1Teams(category: Category, context: F1SeasonContext): Promise<Team[]> {
  const sessionKey = context.latestCompletedRaceSession?.session_key ?? context.latestKnownSession?.session_key;
  if (!sessionKey) {
    return [];
  }

  const drivers = await fetchOpenF1Json<OpenF1Driver[]>(`/drivers?session_key=${sessionKey}`);
  const baseTeamMap = new Map(category.teams.map((team) => [normalizeText(team.name), team]));
  const teamByName = new Map<string, Team>();

  for (const driver of drivers) {
    const teamName = driver.team_name?.trim();
    if (!teamName) {
      continue;
    }

    const fallback = findBestTeamMatch(teamName, baseTeamMap);
    const normalizedName = normalizeText(teamName);
    if (teamByName.has(normalizedName)) {
      continue;
    }

    teamByName.set(normalizedName, {
      id: fallback?.id || slugify(teamName),
      name: fallback?.name || teamName,
      color: formatHexColor(driver.team_colour) || fallback?.color || '#e10600',
      car: fallback?.car,
      logo: fallback?.logo,
      class: fallback?.class,
    });
  }

  return [...teamByName.values()];
}

async function fetchF1Drivers(category: Category, context: F1SeasonContext): Promise<Driver[]> {
  const sessionKey = context.latestCompletedRaceSession?.session_key ?? context.latestKnownSession?.session_key;
  if (!sessionKey) {
    return [];
  }

  const liveDrivers = await fetchOpenF1Json<OpenF1Driver[]>(`/drivers?session_key=${sessionKey}`);
  const baseDriverMap = new Map(category.drivers.map((driver) => [normalizeText(driver.name), driver]));
  const baseTeamMap = new Map(category.teams.map((team) => [normalizeText(team.name), team]));

  return liveDrivers
    .filter((driver) => driver.full_name?.trim())
    .map((driver) => {
      const fullName = toTitleCase(driver.full_name!.trim());
      const fallbackDriver = findBestDriverMatch(fullName, baseDriverMap);
      const fallbackTeam = findBestTeamMatch(driver.team_name || '', baseTeamMap);

      return {
        id: fallbackDriver?.id || slugify(fullName),
        name: fallbackDriver?.name || fullName,
        number: driver.driver_number != null ? String(driver.driver_number) : (fallbackDriver?.number || '--'),
        nationality: fallbackDriver?.nationality || 'N/A',
        teamId: fallbackDriver?.teamId || fallbackTeam?.id || slugify(driver.team_name || 'team'),
        image: driver.headshot_url || fallbackDriver?.image,
      };
    });
}

async function fetchF1Standings(context: F1SeasonContext): Promise<CategoryStandings | undefined> {
  const raceSessionKey = context.latestCompletedRaceSession?.session_key;
  if (!raceSessionKey) {
    return undefined;
  }

  const [drivers, teams, roster] = await Promise.all([
    fetchOpenF1Json<OpenF1DriverStanding[]>(`/championship_drivers?session_key=${raceSessionKey}`).catch(() => []),
    fetchOpenF1Json<OpenF1TeamStanding[]>(`/championship_teams?session_key=${raceSessionKey}`).catch(() => []),
    fetchOpenF1Json<OpenF1Driver[]>(`/drivers?session_key=${raceSessionKey}`).catch(() => []),
  ]);

  const driverByNumber = new Map<number, OpenF1Driver>();
  for (const driver of roster) {
    if (driver.driver_number != null) {
      driverByNumber.set(driver.driver_number, driver);
    }
  }

  const driverStandings = drivers
    .filter((entry): entry is OpenF1DriverStanding & { driver_number: number; points_current: number; position_current: number } => (
      entry.driver_number != null && entry.points_current != null && entry.position_current != null
    ))
    .sort((left, right) => left.position_current - right.position_current)
    .map((entry) => {
      const rosterDriver = driverByNumber.get(entry.driver_number);
      return {
        position: entry.position_current,
        name: rosterDriver?.full_name ? toTitleCase(rosterDriver.full_name) : `#${entry.driver_number}`,
        points: entry.points_current,
        team: rosterDriver?.team_name || undefined,
      };
    });

  const constructorStandings = teams
    .filter((entry): entry is OpenF1TeamStanding & { points_current: number; position_current: number; team_name: string } => (
      entry.points_current != null && entry.position_current != null && Boolean(entry.team_name?.trim())
    ))
    .sort((left, right) => left.position_current - right.position_current)
    .map((entry) => ({
      position: entry.position_current,
      name: entry.team_name.trim(),
      points: entry.points_current,
    }));

  if (!driverStandings.length && !constructorStandings.length) {
    return undefined;
  }

  return {
    drivers: driverStandings.length ? driverStandings : undefined,
    constructors: constructorStandings.length ? constructorStandings : undefined,
  };
}

async function fetchDriverIndexForWinners(context: F1SeasonContext) {
  const sessionKey = context.latestCompletedRaceSession?.session_key ?? context.latestKnownSession?.session_key;
  if (!sessionKey) {
    return new Map<number, string>();
  }

  const drivers = await fetchOpenF1Json<OpenF1Driver[]>(`/drivers?session_key=${sessionKey}`).catch(() => []);
  return new Map(
    drivers
      .filter((driver): driver is OpenF1Driver & { driver_number: number; full_name: string } => (
        driver.driver_number != null && Boolean(driver.full_name?.trim())
      ))
      .map((driver) => [driver.driver_number, toTitleCase(driver.full_name.trim())]),
  );
}

async function fetchOpenF1Json<T>(path: string, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPEN_F1_API_BASE_URL}${path}`, { signal: controller.signal });

    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      clearTimeout(timeoutId);
      await new Promise<void>((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      return fetchOpenF1Json(path, attempt + 1);
    }

    if (!response.ok) {
      throw new Error(`OpenF1 HTTP ${response.status}`);
    }

    return await response.json() as T;
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

function mergeTeamsByName(baseTeams: Team[], liveTeams: Team[]) {
  const merged = new Map(baseTeams.map((team) => [team.id, team]));
  const baseTeamMap = new Map(baseTeams.map((team) => [normalizeTeamLookupKey(team.name), team]));

  for (const liveTeam of liveTeams) {
    const matched = findBestTeamMatch(liveTeam.name, baseTeamMap);
    if (matched) {
      merged.set(matched.id, { ...matched, ...liveTeam, id: matched.id, name: matched.name, car: liveTeam.car || matched.car });
      continue;
    }

    merged.set(liveTeam.id, liveTeam);
  }

  return [...merged.values()];
}

function mergeDriversByName(baseDrivers: Driver[], liveDrivers: Driver[]) {
  const merged = new Map(baseDrivers.map((driver) => [driver.id, driver]));

  for (const liveDriver of liveDrivers) {
    const matched = findBestDriverMatch(liveDriver.name, new Map(baseDrivers.map((driver) => [normalizeText(driver.name), driver])));
    if (matched) {
      merged.set(matched.id, { ...matched, ...liveDriver, id: matched.id, name: matched.name, teamId: liveDriver.teamId || matched.teamId });
      continue;
    }

    merged.set(liveDriver.id, liveDriver);
  }

  return [...merged.values()];
}

function findBestBaseRace(baseCalendar: Race[], meeting: OpenF1Meeting, raceSession?: OpenF1Session) {
  const targetDate = extractDate(raceSession?.date_start || meeting.date_end || meeting.date_start);
  const targetNames = [meeting.meeting_name, meeting.meeting_official_name, raceSession?.location, meeting.location, meeting.country_name];
  let bestMatch: Race | null = null;
  let bestScore = -1;

  for (const race of baseCalendar) {
    let score = 0;
    if (targetDate && race.date === targetDate) {
      score += 100;
    }

    if (countSharedTokens([race.name, race.enName, race.location, race.circuit], targetNames) > 0) {
      score += countSharedTokens([race.name, race.enName, race.location, race.circuit], targetNames) * 12;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = race;
    }
  }

  return bestScore >= 12 ? bestMatch : null;
}

function countSharedTokens(leftValues: Array<string | null | undefined>, rightValues: Array<string | null | undefined>) {
  const leftTokens = extractMeaningfulTokens(leftValues);
  const rightTokens = extractMeaningfulTokens(rightValues);
  let matches = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      matches += 1;
    }
  }

  return matches;
}

function extractMeaningfulTokens(values: Array<string | null | undefined>) {
  const ignoredTokens = new Set([
    'gp',
    'grand',
    'prix',
    'formula',
    'world',
    'championship',
    'race',
    'de',
    'do',
    'da',
    'the',
    'las',
  ]);

  const tokens = new Set<string>();
  for (const value of values) {
    const normalized = normalizeText(value || '');
    for (const token of normalized.split(' ')) {
      if (token.length < 3 || ignoredTokens.has(token)) {
        continue;
      }
      tokens.add(token);
    }
  }

  return tokens;
}

function findBestDriverMatch(name: string, baseDriverMap: Map<string, Driver>) {
  const normalizedName = normalizeText(name);
  if (baseDriverMap.has(normalizedName)) {
    return baseDriverMap.get(normalizedName) || null;
  }

  const nameWords = normalizedName.split(' ').filter(Boolean);
  const lastName = nameWords[nameWords.length - 1];

  for (const driver of baseDriverMap.values()) {
    const normalizedBase = normalizeText(driver.name);
    if (normalizedBase === normalizedName) {
      return driver;
    }

    const baseWords = normalizedBase.split(' ').filter(Boolean);
    if (lastName && baseWords[baseWords.length - 1] === lastName) {
      return driver;
    }
  }

  return null;
}

function findBestTeamMatch(name: string, baseTeamMap: Map<string, Team>) {
  const normalizedName = normalizeText(name);
  const canonicalName = normalizeTeamLookupKey(name);

  if (baseTeamMap.has(canonicalName)) {
    return baseTeamMap.get(canonicalName) || null;
  }

  if (baseTeamMap.has(normalizedName)) {
    return baseTeamMap.get(normalizedName) || null;
  }

  const aliasedName = TEAM_NAME_ALIASES.get(normalizedName);
  if (aliasedName && baseTeamMap.has(aliasedName)) {
    return baseTeamMap.get(aliasedName) || null;
  }

  for (const team of baseTeamMap.values()) {
    const normalizedBase = normalizeText(team.name);
    const normalizedBaseAlias = normalizeTeamLookupKey(team.name);
    if (
      normalizedBase.includes(normalizedName)
      || normalizedName.includes(normalizedBase)
      || normalizedBaseAlias === normalizedName
      || normalizedBaseAlias === canonicalName
      || aliasedName === normalizedBase
      || countSharedTokens([team.name], [name]) >= 2
    ) {
      return team;
    }
  }

  return null;
}

function countMatchedTeams(baseTeams: Team[], mergedTeams: Team[]) {
  const baseTeamMap = new Map(baseTeams.map((team) => [normalizeTeamLookupKey(team.name), team]));
  return mergedTeams.reduce((count, team) => count + (findBestTeamMatch(team.name, baseTeamMap) ? 1 : 0), 0);
}

function countMatchedDrivers(baseDrivers: Driver[], mergedDrivers: Driver[]) {
  const baseDriverMap = new Map(baseDrivers.map((driver) => [normalizeText(driver.name), driver]));
  return mergedDrivers.reduce((count, driver) => count + (findBestDriverMatch(driver.name, baseDriverMap) ? 1 : 0), 0);
}

function normalizeCalendarWinners(calendar: Race[], drivers: Driver[]) {
  return calendar.map((race) => {
    if (!race.winner) {
      return race;
    }

    const matchedDriver = drivers.find((driver) => normalizeText(driver.name) === normalizeText(race.winner!));
    return {
      ...race,
      winner: matchedDriver?.name || race.winner,
    };
  });
}

function normalizeTeamLookupKey(name: string) {
  const normalizedName = normalizeText(name);
  return TEAM_NAME_ALIASES.get(normalizedName) || normalizedName;
}

function getMeetingStatus(meeting: OpenF1Meeting, raceSession: OpenF1Session | undefined, date: string): Race['status'] {
  if (meeting.is_cancelled || raceSession?.is_cancelled) {
    return 'cancelled';
  }

  const reference = raceSession?.date_end || (date ? `${date}T23:59:59Z` : null);
  if (reference && new Date(reference) < new Date()) {
    return 'completed';
  }

  return 'upcoming';
}

function getNextUpcomingRace(calendar: Race[]) {
  return calendar
    .filter((race) => race.status === 'upcoming')
    .sort((left, right) => left.date.localeCompare(right.date))[0] ?? null;
}

function getLastCompletedRace(calendar: Race[]) {
  return calendar
    .filter((race) => race.status === 'completed')
    .sort((left, right) => right.date.localeCompare(left.date))[0] ?? null;
}

function mapRaceToLiveEvent(race: Race): OpenF1LiveEvent {
  return {
    id: race.id,
    name: race.enName || race.name,
    date: race.date,
    circuit: race.circuit,
    location: race.enLocation || race.location,
    status: race.status,
  };
}

function isGrandPrixMeeting(meeting: OpenF1Meeting) {
  const name = `${meeting.meeting_name || ''} ${meeting.meeting_official_name || ''}`.toLowerCase();
  return name.includes('grand prix') && !name.includes('testing');
}

function isMainRaceSession(session: OpenF1Session) {
  const sessionName = (session.session_name || '').toLowerCase();
  const sessionType = (session.session_type || '').toLowerCase();
  return sessionName === 'race' || sessionType === 'race';
}

function formatRaceNamePt(meetingName?: string | null) {
  if (!meetingName) {
    return 'Grande Prêmio';
  }

  return meetingName
    .replace(/^(.+?) Grand Prix$/i, (_, location: string) => `GP de ${location}`)
    .replace(/^São Paulo Grand Prix$/i, 'GP de São Paulo');
}

function formatHexColor(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(normalized) ? `#${normalized}` : null;
}

function createRaceId(meeting: OpenF1Meeting, index: number) {
  return slugify(meeting.meeting_name || meeting.location || meeting.country_name || `race-${index + 1}`);
}

function extractDate(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function getCategorySeason(category: Category) {
  return category.calendar[0]?.date.slice(0, 4) || String(new Date().getFullYear());
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
