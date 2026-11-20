import type { RaceResultRow } from './jolpica';

const envBase = (import.meta.env?.VITE_API_MOTORSPORTS_URL as string | undefined)?.trim().replace(/\/+$/, '');
export const API_MOTORSPORTS_BASE = envBase || 'https://api-motorsports.vercel.app';
const TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 30 * 60 * 1000;

export type BootstrapGtwcRace = {
  seriesId: string;
  raceId: string;
  round: number | null;
  name: string;
  location: string | null;
  date: string;
  sourceUrl: string | null;
  winner: string | null;
};

export type BootstrapGtwcTeam = {
  name: string;
  car: string | null;
  class: string | null;
  carNumber: string | null;
  drivers: { name: string; nationality: string }[];
};

export type BootstrapStandingsClass = {
  classLabel: string;
  entries: { position: number; name: string; team?: string | null; points: number; uf?: string | null }[];
};

export type BootstrapGtwcData = {
  races: BootstrapGtwcRace[];
  teams: BootstrapGtwcTeam[];
  standings: {
    drivers: BootstrapStandingsClass[] | null;
    teams: BootstrapStandingsClass[] | null;
  };
};

export type BootstrapEbData = {
  races: {
    raceId: string;
    round: number | null;
    name: string;
    location: string | null;
    date: string;
    sourceUrl: string | null;
    completed: boolean;
    winner: string | null;
  }[];
  teams: {
    teamId: string;
    name: string;
    teamPrincipal: string | null;
    sourceUrl: string | null;
    drivers: { name: string; driverId: string }[];
  }[];
  drivers: {
    driverId: string;
    name: string;
    uf: string | null;
    class: string | null;
    teamId: string | null;
    sourceUrl: string | null;
  }[];
  standings: {
    drivers: BootstrapStandingsClass[] | null;
    teams: null;
  };
};

export type BootstrapEngineRace = {
  raceId: string;
  round: number | null;
  name: string;
  enName?: string | null;
  location: string | null;
  enLocation?: string | null;
  circuit: string | null;
  date: string;
  startsAt: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  winner: string | null;
  official: boolean;
  sourceUrl: string | null;
};

export type BootstrapEngineStandings = {
  season: number | null;
  asOfRound: number | null;
  drivers: BootstrapStandingsClass[] | null;
  teams: BootstrapStandingsClass[] | null;
};

export type BootstrapEngineDriver = {
  driverId: string;
  name: string;
  number: string | null;
  team?: string | null;
  classes: string[];
};

export type BootstrapCategoryData = {
  id: string;
  name: string;
  season: number | null;
  source: string | null;
  lastUpdate: string | null;
  asOfRound: number | null;
  degraded: boolean;
  races: BootstrapEngineRace[];
  standings: BootstrapEngineStandings;
  drivers: BootstrapEngineDriver[];
};

export type MotorsportsBootstrap = {
  gtwc: Partial<Record<'europe' | 'america' | 'asia', BootstrapGtwcData | null>>;
  enduranceBrasil: BootstrapEbData | null;
  categories: Partial<Record<string, BootstrapCategoryData | null>>;
};

type CacheEntry<T> = { expiresAt: number; value: Promise<T> };
let bootstrapCache: CacheEntry<MotorsportsBootstrap | null> | null = null;
const raceResultsCache = new Map<string, CacheEntry<RaceResultRow[] | null>>();

export async function fetchMotorsportsJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_MOTORSPORTS_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`api-motorsports HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Busca o pacote agregado das 15 categorias na api-motorsports (/bootstrap).
 * Se o endpoint ainda nao estiver publicado (404) ou falhar, devolve null sem
 * lancar erro, permitindo que cada modulo use seu fallback individual.
 */
export async function fetchMotorsportsBootstrap(force = false): Promise<MotorsportsBootstrap | null> {
  const now = Date.now();
  if (!force && bootstrapCache && bootstrapCache.expiresAt > now) {
    return bootstrapCache.value;
  }

  const value = fetchMotorsportsJson<MotorsportsBootstrap>('/bootstrap').catch(() => {
    if (bootstrapCache) return bootstrapCache.value;
    bootstrapCache = null;
    return null;
  });

  bootstrapCache = { expiresAt: now + CACHE_TTL_MS, value };
  return value;
}

type EngineRaceDetailResponse = BootstrapEngineRace & {
  sessions?: {
    session: string;
    official: boolean;
    rows: {
      position: number | null;
      driver: string;
      team?: string | null;
      number: string | null;
      points: number | null;
      time?: string | null;
      laps?: number | null;
      status: string | null;
    }[];
  }[];
};

function pickMainSession(sessions: EngineRaceDetailResponse['sessions']) {
  if (!sessions || sessions.length === 0) return null;
  const withRows = sessions.filter((s) => Array.isArray(s.rows) && s.rows.length > 0);
  if (withRows.length === 0) return null;
  for (const preferred of ['feature', 'feature2', 'feature1', 'race', 'main', 'race2', 'race1']) {
    const hit = withRows.find((s) => s.session.toLowerCase() === preferred);
    if (hit) return hit;
  }
  const nonBonus = withRows.filter((s) => !/^(bonus|qualifying\d*|practice\d*|pole(-le-mans)?|supersunday|powerstage)$/i.test(s.session));
  return nonBonus[0] ?? withRows[0];
}

/**
 * Resultado completo de uma etapa das categorias servidas pela api-motorsports.
 * Se a etapa ainda nao tiver sessoes gravadas em race_results (ou responder 404),
 * devolve null e a RacePage mostra apenas o vencedor da prova.
 */
export async function fetchEngineRaceResults(
  categoryId: string,
  raceId: string,
  force = false,
): Promise<RaceResultRow[] | null> {
  const key = `${categoryId}:${raceId}`;
  const now = Date.now();
  const hit = raceResultsCache.get(key);
  if (!force && hit && hit.expiresAt > now) return hit.value;

  const value = (async () => {
    const detail = await fetchMotorsportsJson<EngineRaceDetailResponse>(
      `/${encodeURIComponent(categoryId)}/races/${encodeURIComponent(raceId)}`,
    );
    const session = pickMainSession(detail.sessions);
    if (!session) return null;

    return session.rows.map((row, idx): RaceResultRow => ({
      position: row.position != null ? String(row.position) : String(idx + 1),
      driverName: row.driver,
      driverCode: row.driver.slice(0, 3).toUpperCase(),
      driverNumber: row.number ?? '',
      teamName: row.team ?? '',
      grid: null,
      laps: row.laps ?? null,
      time: row.time ?? '',
      status: row.status ?? '',
      points: row.points ?? 0,
      fastestLapRank: null,
      fastestLapTime: null,
    }));
  })().catch(() => null);

  raceResultsCache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}
