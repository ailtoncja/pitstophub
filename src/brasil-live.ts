import type { Category, CategoryStandings, Driver, Race, StandingItem } from './types';

// NASCAR Brasil e Porsche Cup Brasil: a mesma API propria do GTWC e do
// Endurance Brasil (api-motorsports), que publica o que o motor do Supabase ja
// le das fontes oficiais (CBA e planilha oficial da Porsche Cup). Calendario,
// classificacao e grid vem de la; o catalogo estatico so tem nome e regras.
const API_BASE = 'https://api-motorsports.vercel.app';
const TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 30 * 60 * 1000;

const CATEGORY_IDS = ['nascar-brasil', 'porsche-cup'] as const;

export function isBrasilCategory(id: string): boolean {
  return (CATEGORY_IDS as readonly string[]).includes(id);
}

export function getBrasilCategoryIds(): string[] {
  return [...CATEGORY_IDS];
}

type ApiRace = {
  raceId: string;
  round: number | null;
  name: string;
  location: string | null;
  circuit: string | null;
  date: string;
  startsAt: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  winner: string | null;
  official: boolean;
  sourceUrl: string | null;
};

type ApiStandingEntry = { position: number; name: string; team: string | null; points: number };
type ApiStandingsClass = { classLabel: string; entries: ApiStandingEntry[] };
type ApiStandings = { season: number | null; asOfRound: number | null; drivers: ApiStandingsClass[] | null };
type ApiDriver = { driverId: string; name: string; number: string | null; classes: string[] };

type CacheEntry<T> = { expiresAt: number; value: Promise<T> };
const calendarCache = new Map<string, CacheEntry<Race[] | null>>();
const standingsCache = new Map<string, CacheEntry<CategoryStandings | null>>();
const driversCache = new Map<string, CacheEntry<Driver[] | null>>();

export async function fetchBrasilCalendar(categoryId: string, force = false): Promise<Race[] | null> {
  if (!isBrasilCategory(categoryId)) return null;
  return getCached(calendarCache, categoryId, force, async () => {
    const races = await fetchJson<ApiRace[]>(`/${categoryId}/races`);
    if (!races.length) return null;
    return races.map(toRace);
  });
}

export function mergeCategoryWithBrasilCalendar(category: Category, calendar: Race[] | null): Category {
  if (!isBrasilCategory(category.id) || !calendar || calendar.length === 0) return category;
  return { ...category, calendar };
}

export async function fetchBrasilStandings(categoryId: string, force = false): Promise<CategoryStandings | null> {
  if (!isBrasilCategory(categoryId)) return null;
  return getCached(standingsCache, `${categoryId}:standings`, force, async () => {
    const data = await fetchJson<ApiStandings>(`/${categoryId}/standings`);
    const classes = (data.drivers ?? []).filter((cls) => cls.entries.length > 0);
    if (classes.length === 0) return null;

    const toItems = (entries: ApiStandingEntry[]): StandingItem[] =>
      entries.map((entry) => ({
        position: entry.position,
        name: entry.name,
        points: entry.points,
        team: entry.team ?? undefined,
      }));

    // Uma lista so (NASCAR Brasil) vira a classificacao normal de pilotos. A
    // Porsche Cup disputa Sprint e Endurance em tres divisoes, entao cada uma
    // fica na sua -- somar Carrera com Trophy numa lista so nao seria o
    // campeonato de ninguem.
    if (classes.length === 1) return { drivers: toItems(classes[0].entries) };
    return {
      driverClasses: classes.map((cls) => ({ classLabel: cls.classLabel, entries: toItems(cls.entries) })),
    };
  });
}

export function mergeCategoryWithBrasilStandings(category: Category, standings: CategoryStandings | null): Category {
  if (!isBrasilCategory(category.id) || !standings) return category;
  return { ...category, standings };
}

export async function fetchBrasilDrivers(categoryId: string, force = false): Promise<Driver[] | null> {
  if (!isBrasilCategory(categoryId)) return null;
  return getCached(driversCache, `${categoryId}:drivers`, force, async () => {
    const drivers = await fetchJson<ApiDriver[]>(`/${categoryId}/drivers`);
    if (!drivers.length) return null;
    return drivers.map((driver) => ({
      id: driver.driverId,
      name: driver.name,
      number: driver.number ?? '',
      nationality: 'Brasil',
      // Nenhuma das duas fontes oficiais publica a equipe de cada piloto.
      teamId: '',
    }));
  });
}

export function mergeCategoryWithBrasilDrivers(category: Category, drivers: Driver[] | null): Category {
  if (!isBrasilCategory(category.id) || !drivers || drivers.length === 0) return category;
  return { ...category, drivers };
}

function toRace(race: ApiRace): Race {
  return {
    id: race.raceId,
    name: race.name,
    enName: race.name,
    location: race.location ?? '',
    enLocation: race.location ?? undefined,
    circuit: race.circuit ?? race.location ?? '',
    date: race.date,
    startsAt: race.startsAt ?? undefined,
    status: race.status,
    winner: race.winner ?? undefined,
    round: race.round ?? undefined,
  };
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
    console.error(`Falha ao carregar dado das categorias brasileiras (${key}).`, error);
    if (hit) return hit.value;
    cache.delete(key);
    return null as T;
  });

  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}
