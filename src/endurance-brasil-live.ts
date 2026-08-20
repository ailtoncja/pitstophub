import type { Category, CategoryStandings, Driver, Race, StandingItem, Team } from './types';

// Endurance Brasil nao usa TheSportsDB -- e a mesma API propria do GTWC
// (api-motorsports), em /endurance-brasil. Buscamos direto no navegador.
const API_BASE = 'https://api-motorsports.vercel.app';
const TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const CATEGORY_ID = 'endurance-brasil';

const CLASS_ORDER = ['P1', 'P2', 'P2 Light', 'P3', 'GT3', 'GT3L', 'GT4', 'GT4L'];

export function isEnduranceBrasilCategory(id: string): boolean {
  return id === CATEGORY_ID;
}

export function getEnduranceBrasilCategoryIds(): string[] {
  return [CATEGORY_ID];
}

type ApiRace = {
  raceId: string;
  round: number | null;
  name: string;
  location: string | null;
  date: string;
  sourceUrl: string | null;
  completed: boolean;
  winner: string | null;
};

type ApiDriverRef = { name: string; driverId: string };

type ApiTeam = {
  teamId: string;
  name: string;
  teamPrincipal: string | null;
  sourceUrl: string | null;
  drivers: ApiDriverRef[];
};

type ApiDriver = {
  driverId: string;
  name: string;
  uf: string | null;
  class: string | null;
  teamId: string | null;
  sourceUrl: string | null;
};

type ApiStandingEntry = { position: number; name: string; points: number; uf: string | null };
type ApiStandingsClass = { classLabel: string; entries: ApiStandingEntry[] };
type ApiStandings = { drivers: ApiStandingsClass[] | null; teams: null };

export type EbRoster = { teams: Team[]; drivers: Driver[] };

type CacheEntry<T> = { expiresAt: number; value: Promise<T> };
const calendarCache = new Map<string, CacheEntry<Race[] | null>>();
const rosterCache = new Map<string, CacheEntry<EbRoster | null>>();
const standingsCache = new Map<string, CacheEntry<CategoryStandings | null>>();

export async function fetchEbCalendar(categoryId: string, force = false): Promise<Race[] | null> {
  if (!isEnduranceBrasilCategory(categoryId)) return null;
  return getCached(calendarCache, categoryId, force, async () => {
    const races = await fetchJson<ApiRace[]>('/endurance-brasil/races');
    if (!races.length) return null;
    return races.map(toRace);
  });
}

export function mergeCategoryWithEbCalendar(category: Category, calendar: Race[] | null): Category {
  if (!isEnduranceBrasilCategory(category.id) || !calendar || calendar.length === 0) return category;
  return { ...category, calendar };
}

export async function fetchEbRoster(categoryId: string, force = false): Promise<EbRoster | null> {
  if (!isEnduranceBrasilCategory(categoryId)) return null;
  return getCached(rosterCache, `${categoryId}:roster`, force, async () => {
    const [apiTeams, apiDrivers] = await Promise.all([
      fetchJson<ApiTeam[]>('/endurance-brasil/teams'),
      fetchJson<ApiDriver[]>('/endurance-brasil/drivers'),
    ]);
    if (!apiTeams.length && !apiDrivers.length) return null;

    const classByDriverId = new Map(apiDrivers.map((d) => [d.driverId, d.class]));
    const teams: Team[] = apiTeams.map((apiTeam) => {
      const teamClass = apiTeam.drivers
        .map((d) => classByDriverId.get(d.driverId))
        .find((value) => Boolean(value)) ?? null;
      return {
        id: apiTeam.teamId,
        name: apiTeam.name,
        color: classColor(teamClass),
        class: teamClass ?? undefined,
      };
    });

    const drivers: Driver[] = apiDrivers.map((apiDriver) => ({
      id: apiDriver.driverId,
      name: apiDriver.name,
      number: '',
      nationality: 'Brasil',
      teamId: apiDriver.teamId ?? '',
    }));

    return { teams, drivers };
  });
}

export function mergeCategoryWithEbRoster(category: Category, roster: EbRoster | null): Category {
  if (!isEnduranceBrasilCategory(category.id) || !roster) return category;
  if (roster.teams.length === 0 && roster.drivers.length === 0) return category;
  return { ...category, teams: roster.teams, drivers: roster.drivers };
}

export async function fetchEbStandings(categoryId: string, force = false): Promise<CategoryStandings | null> {
  if (!isEnduranceBrasilCategory(categoryId)) return null;
  return getCached(standingsCache, `${categoryId}:standings`, force, async () => {
    const data = await fetchJson<ApiStandings>('/endurance-brasil/standings');
    const classes = (data.drivers ?? [])
      .filter((cls) => cls.entries.length > 0)
      .sort((a, b) => classRank(a.classLabel) - classRank(b.classLabel));
    if (classes.length === 0) return null;
    return {
      driverClasses: classes.map((cls) => ({
        classLabel: cls.classLabel,
        entries: cls.entries.map((e): StandingItem => ({
          position: e.position,
          name: e.name,
          points: e.points,
          extra: e.uf ?? undefined,
        })),
      })),
    };
  });
}

export function mergeCategoryWithEbStandings(category: Category, standings: CategoryStandings | null): Category {
  if (!isEnduranceBrasilCategory(category.id) || !standings) return category;
  const teamByDriverName = new Map(category.drivers.map((d) => [d.name, category.teams.find((t) => t.id === d.teamId)?.name]));
  const withTeams = standings.driverClasses?.map((cls) => ({
    ...cls,
    entries: cls.entries.map((entry) => ({
      ...entry,
      team: teamByDriverName.get(entry.name) ?? entry.team,
    })),
  }));
  return { ...category, standings: { ...standings, driverClasses: withTeams } };
}

function toRace(race: ApiRace): Race {
  return {
    id: race.raceId,
    name: race.name,
    enName: translateRaceName(race.name),
    circuit: race.location ?? race.name,
    location: race.location ?? '',
    enLocation: translateLocation(race.location),
    date: race.date,
    status: race.completed ? 'completed' : 'upcoming',
    winner: race.winner ?? undefined,
  };
}

function translateRaceName(name: string): string {
  return name
    .replace(/Etapa\s+(\d+)/gi, 'Round $1')
    .replace(/Quatro Horas d[eo]\s+/gi, 'Four Hours of ')
    .replace(/Tr[eê]s Horas d[eo]\s+/gi, 'Three Hours of ')
    .replace(/Horas d[eo]\s+/gi, 'Hours of ');
}

function translateLocation(location: string | null): string | undefined {
  if (!location) return undefined;
  return location
    .replace(/^Autódromo Internacional de\s+/i, '')
    .replace(/^Autódromo de\s+/i, '')
    .replace(/^Autódromo\s+/i, '');
}

function classRank(label: string): number {
  const idx = CLASS_ORDER.indexOf(label);
  return idx === -1 ? CLASS_ORDER.length : idx;
}

function classColor(className: string | null | undefined): string {
  const norm = (className ?? '').toUpperCase();
  if (norm === 'P1') return '#E63946';
  if (norm.startsWith('P2')) return '#F77F00';
  if (norm === 'P3') return '#F4A261';
  if (norm.startsWith('GT3')) return '#2A9D8F';
  if (norm.startsWith('GT4')) return '#E9C46A';
  return '#009B3A';
}

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`api-motorsports HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timerId);
  }
}

async function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  force: boolean,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (!force && hit && hit.expiresAt > now) return hit.value;

  const value = loader().catch((error: unknown) => {
    console.error(`Falha ao carregar dado Endurance Brasil (${key}).`, error);
    if (hit) return hit.value;
    cache.delete(key);
    return null as T;
  });

  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}
