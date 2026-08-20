import type { Category, CategoryStandings, Driver, Race, StandingItem, Team } from './types';
import { lookupTeamAssets } from './team-bios';

// GT World Challenge (Europe/America/Asia) nao usa TheSportsDB nem o pipeline
// de synced_races/synced_standings -- e uma API propria (api-motorsports),
// que raspa os sites oficiais e ja guarda o grid de cada corrida
// separadamente. Buscamos direto no navegador, no mesmo padrao do F1 em
// jolpica.ts, em vez de duplicar isso numa tabela do Supabase daqui.
const API_BASE = 'https://api-motorsports.vercel.app';
const TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 30 * 60 * 1000;

const GTWC_SERIES_BY_CATEGORY: Record<string, 'europe' | 'america' | 'asia'> = {
  'gtwc-europe': 'europe',
  'gtwc-america': 'america',
  'gtwc-asia': 'asia',
};

export function isGtwcCategory(id: string): boolean {
  return id in GTWC_SERIES_BY_CATEGORY;
}

export function getGtwcCategoryIds(): string[] {
  return Object.keys(GTWC_SERIES_BY_CATEGORY);
}

// ─── API response types (api-motorsports) ──────────────────────────────────

type ApiRace = {
  seriesId: string;
  raceId: string;
  round: number | null;
  name: string;
  location: string | null;
  date: string;
  sourceUrl: string | null;
  winner: string | null;
};

type ApiDriver = {
  name: string;
  nationality: string;
};

type ApiTeamSummary = {
  name: string;
  car: string | null;
  class: string | null;
  carNumber: string | null;
  drivers: ApiDriver[];
};

type ApiStandingEntry = { position: number; name: string; points: number };
type ApiStandingsClass = { classLabel: string; entries: ApiStandingEntry[] };
type ApiSeriesStandings = { drivers: ApiStandingsClass[] | null; teams: ApiStandingsClass[] | null };

// ─── Public types ───────────────────────────────────────────────────────────

export type GtwcRoster = { teams: Team[]; drivers: Driver[] };

// ─── Cache ──────────────────────────────────────────────────────────────────

type CacheEntry<T> = { expiresAt: number; value: Promise<T> };
const calendarCache = new Map<string, CacheEntry<Race[] | null>>();
const rosterCache = new Map<string, CacheEntry<GtwcRoster | null>>();
const standingsCache = new Map<string, CacheEntry<CategoryStandings | null>>();

export async function fetchGtwcCalendar(categoryId: string, force = false): Promise<Race[] | null> {
  const seriesId = GTWC_SERIES_BY_CATEGORY[categoryId];
  if (!seriesId) return null;
  return getCached(calendarCache, categoryId, force, async () => {
    const races = await fetchJson<ApiRace[]>(`/series/${seriesId}/races`);
    if (!races.length) return null;
    return races.map(toRace);
  });
}

export function mergeCategoryWithGtwcCalendar(category: Category, calendar: Race[] | null): Category {
  if (!calendar || calendar.length === 0) return category;
  return { ...category, calendar };
}

export async function fetchGtwcRoster(categoryId: string, force = false): Promise<GtwcRoster | null> {
  const seriesId = GTWC_SERIES_BY_CATEGORY[categoryId];
  if (!seriesId) return null;
  return getCached(rosterCache, `${categoryId}:roster`, force, async () => {
    const apiTeams = await fetchJson<ApiTeamSummary[]>(`/series/${seriesId}/teams`);
    if (!apiTeams.length) return null;

    const teams: Team[] = [];
    const drivers: Driver[] = [];
    const seenDriverIds = new Set<string>();

    for (const apiTeam of apiTeams) {
      const teamId = slugify(apiTeam.name);
      const assets = lookupTeamAssets(apiTeam.name);
      teams.push({
        id: teamId,
        name: apiTeam.name,
        color: classColor(apiTeam.class),
        car: apiTeam.car ?? undefined,
        class: apiTeam.class ? toTitleCase(apiTeam.class) : undefined,
        badge: assets?.badge,
        clearart: assets?.clearart,
      });
      for (const apiDriver of apiTeam.drivers) {
        const driverId = `${teamId}-${slugify(apiDriver.name)}`;
        if (seenDriverIds.has(driverId)) continue;
        seenDriverIds.add(driverId);
        drivers.push({
          id: driverId,
          name: toDriverName(apiDriver.name),
          number: apiTeam.carNumber ?? '',
          nationality: apiDriver.nationality,
          teamId,
        });
      }
    }

    return { teams, drivers };
  });
}

export function mergeCategoryWithGtwcRoster(category: Category, roster: GtwcRoster | null): Category {
  if (!roster || roster.teams.length === 0) return category;
  return {
    ...category,
    teams: roster.teams,
    drivers: roster.drivers,
    calendar: category.calendar.map((race) => ({
      ...race,
      winner: race.winner ? matchWinnerToRoster(race.winner, roster.drivers) : race.winner,
    })),
  };
}

function matchWinnerToRoster(winner: string, drivers: Driver[]): string {
  return winner
    .split(/\s*\/\s*/)
    .map((part) => matchDriverName(part.trim(), drivers))
    .join(' / ');
}

function matchDriverName(name: string, drivers: Driver[]): string {
  const norm = normalizePersonName(name);
  const exact = drivers.find((driver) => normalizePersonName(driver.name) === norm);
  if (exact) return exact.name;
  // Sites da Asia invertem dado/familia ("Wei Lu" vs "Lu Wei").
  const swapped = norm.split(' ').reverse().join(' ');
  const swappedHit = drivers.find((driver) => normalizePersonName(driver.name) === swapped);
  return swappedHit ? swappedHit.name : name;
}

function normalizePersonName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

// So expoe uma classificacao quando ela tem uma unica classe "geral" -- ex.:
// America so tem classificacao de times dividida em Pro/Pro-Am/Am (sem
// classificacao de pilotos), e misturar 3 classes numa lista so de posicoes
// reintroduziria o mesmo tipo de erro (misturar classificacoes que nao devem
// se misturar) que tirou o GT World Challenge do pitstophub da primeira vez.
// Nesse caso a aba Classificacao cai no fallback "nao disponivel" ja
// existente, em vez de mostrar um ranking enganoso.
export async function fetchGtwcStandings(categoryId: string, force = false): Promise<CategoryStandings | null> {
  const seriesId = GTWC_SERIES_BY_CATEGORY[categoryId];
  if (!seriesId) return null;
  return getCached(standingsCache, `${categoryId}:standings`, force, async () => {
    const data = await fetchJson<ApiSeriesStandings>(`/series/${seriesId}/standings`);
    const drivers = toSingleClassEntries(data.drivers);
    const teams = toSingleClassEntries(data.teams);
    if (!drivers && !teams) return null;
    return { drivers: drivers ?? undefined, teams: teams ?? undefined };
  });
}

function toSingleClassEntries(classes: ApiStandingsClass[] | null): StandingItem[] | null {
  if (!classes || classes.length !== 1) return null;
  return classes[0].entries.map((e) => ({ position: e.position, name: toDriverName(e.name), points: e.points }));
}

export function mergeCategoryWithGtwcStandings(category: Category, standings: CategoryStandings | null): Category {
  if (!standings) return category;
  return { ...category, standings };
}

// ─── Mapping helpers ────────────────────────────────────────────────────────

function toRace(race: ApiRace): Race {
  const status: Race['status'] = new Date(`${race.date}T23:59:59Z`) < new Date() ? 'completed' : 'upcoming';
  return {
    id: race.raceId,
    name: race.name,
    circuit: race.name,
    location: translateLocation(race.location),
    enLocation: race.location ?? undefined,
    date: race.date,
    status,
    winner: preferOfficialWinner(race) ?? undefined,
  };
}

// A api-motorsports guarda o time (e em Sprint "time A / time B" pras duas
// corridas do fim de semana). A UI procura foto/link por nome de piloto, igual
// WEC/IMSA -- troca pelo piloto confirmado nos sites oficiais da SRO.
// Endurance / America (1 corrida): quem levou a bandeirada. Sprint (2 corridas
// no mesmo round da API): "piloto da Race 1 / piloto da Race 2".
const GTWC_OFFICIAL_WINNERS: Record<string, Record<string, string>> = {
  europe: {
    'circuit-paul-ricard': 'Nicki Thiim',
    'brands-hatch': 'Arthur Leclerc / Bastian Buus',
    monza: 'Rocco Mazzola',
    'crowdstrike-24-hours-of-spa': 'Bastian Buus',
    misano: 'Kelvin van der Linde',
    'magny-cours': 'Jules Gounon / Bastian Buus',
  },
  america: {
    'sonoma-raceway': 'Mikael Grenier',
    'circuit-of-the-americas': 'Ryan Yardley',
    'sebring-international-raceway': 'Robby Foley',
    'road-atlanta': 'Philip Ellis',
  },
  asia: {
    sepang: 'Alessandro Ghiretti / Lu Wei',
    'pertamina-mandalika-international-circuit': 'Congfu Cheng / Loek Hartog',
    'fuji-international-speedway': 'Weian Chen / Lu Wei',
  },
};

function preferOfficialWinner(race: ApiRace): string | null {
  const official = GTWC_OFFICIAL_WINNERS[race.seriesId]?.[race.raceId];
  if (!official) return race.winner;
  return official
    .split(/\s*\/\s*/)
    .map((name) => toDriverName(name))
    .join(' / ');
}

// Times/pilotos que ja apareceram em alguma corrida sincronizada da
// temporada -- nao um "roster oficial" fixo, so o que ja foi visto nos
// grids reais raspados ate agora. Cor por classe (nao por time, como as
// outras categorias) porque GTWC nao tem cor de time curada a mao.
function classColor(className: string | null): string {
  if (!className) return '#2ECC71';
  const norm = className.toLowerCase();
  if (norm.includes('pro') && !norm.includes('am')) return '#E63946';
  if (norm.includes('silver')) return '#A8A8A8';
  if (norm.includes('am') || norm.includes('bronze')) return '#CD7F32';
  return '#2ECC71';
}

// Nomes vem em MAIUSCULO no sobrenome (ex.: "Reece BARR") nos sites oficiais
// -- normaliza pra Title Case, igual o resto do app exibe.
function toDriverName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(-| )/)
    .map((part) => (part === '-' || part === ' ' ? part : part[0]?.toUpperCase() + part.slice(1)))
    .join('');
}

// Localizacao vem em ingles direto do site oficial raspado -- traduz o
// conjunto de paises que realmente aparecem no calendario das 3 series, com
// fallback pro texto original quando nao reconhecido (mesmo padrao
// defensivo do codeToCountry() na api-motorsports).
const LOCATION_PT: Record<string, string> = {
  France: 'França',
  'Great Britain': 'Reino Unido',
  Italy: 'Itália',
  Belgium: 'Bélgica',
  Germany: 'Alemanha',
  Netherlands: 'Países Baixos',
  Spain: 'Espanha',
  Portugal: 'Portugal',
  'United States': 'EUA',
  USA: 'EUA',
  Canada: 'Canadá',
  Malaysia: 'Malásia',
  Indonesia: 'Indonésia',
  Japan: 'Japão',
  China: 'China',
};

function translateLocation(location: string | null): string {
  if (!location) return '';
  return LOCATION_PT[location] ?? location;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── HTTP / Cache ───────────────────────────────────────────────────────────

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
    console.error(`Falha ao carregar dado GT World Challenge (${key}).`, error);
    if (hit) return hit.value;
    cache.delete(key);
    return null as T;
  });

  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}
