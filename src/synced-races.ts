import { supabase } from './supabase';
import type { Category, Race, StandingItem } from './types';

// Categorias sem API propria: calendario mantido pelo job agendado em
// scripts/sync-thesportsdb.mjs (GitHub Actions), gravado na tabela
// public.synced_races. O job roda 1x/dia, entao um cache local generoso
// evita bater no Supabase toda hora sem necessidade.
const SYNCED_CATEGORY_IDS = [
  'f2', 'f3', 'f1-academy', 'wec', 'imsa', 'dtm', 'indy', 'nascar', 'wrc',
] as const;

const CACHE_TTL_MS = 30 * 60 * 1000;

type SyncedRaceRow = {
  race_id: string;
  name: string;
  en_name: string | null;
  location: string | null;
  en_location: string | null;
  circuit: string | null;
  date: string;
  starts_at?: string | null;
  status: Race['status'];
  winner: string | null;
};

type SyncedStandingRow = {
  position: number;
  name: string;
  team: string | null;
  points: number;
};

type CacheEntry<T> = { expiresAt: number; value: Promise<T> };
const calendarCache = new Map<string, CacheEntry<Race[] | null>>();
const standingsCache = new Map<string, CacheEntry<StandingItem[] | null>>();

export function isCategorySynced(id: string): boolean {
  return (SYNCED_CATEGORY_IDS as readonly string[]).includes(id);
}

export function getSyncedCategoryIds(): string[] {
  return [...SYNCED_CATEGORY_IDS];
}

export async function fetchSyncedCalendar(categoryId: string, force = false): Promise<Race[] | null> {
  if (!supabase || !isCategorySynced(categoryId)) return null;

  const now = Date.now();
  const hit = calendarCache.get(categoryId);
  if (!force && hit && hit.expiresAt > now) return hit.value;

  const value = loadCalendar(categoryId).catch((error: unknown) => {
    console.error(`Falha ao carregar calendario sincronizado de ${categoryId}.`, error);
    if (hit) return hit.value;
    calendarCache.delete(categoryId);
    return null;
  });

  calendarCache.set(categoryId, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}

export function mergeCategoryWithSyncedCalendar(category: Category, calendar: Race[] | null): Category {
  if (!calendar || calendar.length === 0) return category;
  const synced = calendar.map((race) =>
    normalizeRaceWinner(preferOfficialWinner(category, nameFromCatalog(category, race)), category)
  );
  return {
    ...category,
    calendar: dropNonChampionshipImsaRaces(
      category,
      fillMissingOfficialRaces(category, synced)
    ).map((race) => normalizeRaceWinner(race, category)),
  };
}

// A TheSportsDB agrupa os eventos de um fim de semana e, quando nao escolhe um nome, a rotina diaria grava
// "Rodada 7". Esse nome nao diz nada na tela (e vira o titulo grande da Inicio): usa o nome do catalogo para a
// mesma data e, sem ele, o local da etapa.
const GENERIC_ROUND_NAME = /^(rodada|round)\s*\d+$/i;

export function nameFromCatalog(category: Category, race: Race): Race {
  if (!GENERIC_ROUND_NAME.test(race.name.trim())) return race;
  const base = category.calendar.find((item) => item.date === race.date && !GENERIC_ROUND_NAME.test(item.name.trim()));
  if (base) {
    return { ...race, name: base.name, enName: base.enName ?? base.name, location: race.location || base.location, enLocation: race.enLocation ?? base.enLocation, circuit: race.circuit || base.circuit };
  }
  const place = race.location || race.circuit;
  return place ? { ...race, name: place, enName: race.enLocation || place } : race;
}

// WEC/IMSA: a TheSportsDB devolve "equipe #carro" (e as vezes o carro errado,
// ex. Imola 2026 como Toyota #7 em vez do #8). O catalogo estatico em types.ts
// guarda o piloto confirmado em fiawec.com / imsa.com. Casa por data OU nome
// (Le Mans e 13-14/jun; Long Beach oficial foi 18/abr).
function preferOfficialWinner(category: Category, race: Race): Race {
  if (category.id !== 'wec' && category.id !== 'imsa') return race;
  if (race.status === 'cancelled') return race;
  const official = category.calendar.find((base) => base.winner && isSameEnduranceRace(base, race));
  return official?.winner ? { ...race, winner: official.winner } : race;
}

// Le Mans e Long Beach costumam faltar no synced_races: a 24h nao entra como
// rodada regular da liga WEC na TheSportsDB, e o GP de Long Beach da IMSA
// as vezes vem com intRound fora de 1..60 (cai no groupByRound). Sem isso o
// merge substituia o calendario inteiro e as duas etapas sumiam da UI.
// O Roar Before the Rolex 24 (18/jan) e teste de pre-temporada, nao pontua.
// A TheSportsDB ja descarta (intRound 500), mas o fallback estatico e o
// fillMissingOfficialRaces recolocavam a etapa na UI da IMSA.
function dropNonChampionshipImsaRaces(category: Category, races: Race[]): Race[] {
  if (category.id !== 'imsa') return races;
  return races.filter((race) => !/roar before/i.test(raceLabel(race)));
}

function fillMissingOfficialRaces(category: Category, synced: Race[]): Race[] {
  if (category.id !== 'wec' && category.id !== 'imsa') return synced;
  const missing = category.calendar.filter(
    (base) => !synced.some((race) => isSameEnduranceRace(base, race))
  );
  if (missing.length === 0) return synced;
  return [...synced, ...missing].sort((a, b) => a.date.localeCompare(b.date));
}

function isSameEnduranceRace(a: Race, b: Race): boolean {
  if (a.date && a.date === b.date) return true;
  if (isWecLeMans(a) && isWecLeMans(b)) return true;
  if (isLongBeach(a) && isLongBeach(b)) return true;
  const an = normalizeText(a.enName ?? a.name);
  const bn = normalizeText(b.enName ?? b.name);
  return Boolean(an && bn && an === bn);
}

function raceLabel(race: Race): string {
  return `${race.enName ?? ''} ${race.name} ${race.location} ${race.enLocation ?? ''}`;
}

function isWecLeMans(race: Race): boolean {
  const n = raceLabel(race).toLowerCase();
  return /le mans/.test(n) && !/lone star/.test(n);
}

function isLongBeach(race: Race): boolean {
  return /long beach/i.test(raceLabel(race));
}

// A TheSportsDB traz o vencedor em formatos abreviados tipo "U. Ugochukwu"
// (inicial + sobrenome), que nunca bate com o nome completo que guardamos
// ("Ugo Ugochukwu"). Sem isso, driverByName.get(race.winner) nunca acha o
// piloto e a foto/link da corrida fica quebrado mesmo com o dado certo.
function normalizeRaceWinner(race: Race, category: Category): Race {
  if (!race.winner) return race;
  const norm = normalizeText(race.winner);
  const exact = category.drivers.find((d) => normalizeText(d.name) === norm);
  if (exact) return { ...race, winner: exact.name };
  const lastName = norm.split(' ').at(-1) ?? '';
  const bySurname = category.drivers.find((d) => normalizeText(d.name).split(' ').at(-1) === lastName);
  return bySurname ? { ...race, winner: bySurname.name } : race;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

export async function fetchSyncedStandings(categoryId: string, force = false): Promise<StandingItem[] | null> {
  if (!supabase || !isCategorySynced(categoryId)) return null;

  const now = Date.now();
  const hit = standingsCache.get(categoryId);
  if (!force && hit && hit.expiresAt > now) return hit.value;

  const value = loadStandings(categoryId).catch((error: unknown) => {
    console.error(`Falha ao carregar classificacao sincronizada de ${categoryId}.`, error);
    if (hit) return hit.value;
    standingsCache.delete(categoryId);
    return null;
  });

  standingsCache.set(categoryId, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}

export function mergeCategoryWithSyncedStandings(category: Category, standings: StandingItem[] | null): Category {
  if (!standings || standings.length === 0) return category;
  return { ...category, standings: { ...category.standings, drivers: standings } };
}

async function loadCalendar(categoryId: string): Promise<Race[] | null> {
  if (!supabase) return null;

  const fullSelect = 'race_id, name, en_name, location, en_location, circuit, date, starts_at, status, winner';
  const query = await supabase
    .from('synced_races')
    .select(fullSelect)
    .eq('category_id', categoryId)
    .order('round', { ascending: true });

  let rows = (query.data ?? null) as SyncedRaceRow[] | null;
  let error = query.error;

  if (error && /starts_at/i.test(error.message)) {
    const legacy = await supabase
      .from('synced_races')
      .select('race_id, name, en_name, location, en_location, circuit, date, status, winner')
      .eq('category_id', categoryId)
      .order('round', { ascending: true });
    rows = (legacy.data ?? null) as SyncedRaceRow[] | null;
    error = legacy.error;
  }

  if (error) throw error;
  if (!rows || rows.length === 0) return null;

  return rows.map((row) => ({
    id: row.race_id,
    name: row.name,
    enName: row.en_name ?? undefined,
    location: row.location ?? '',
    enLocation: row.en_location ?? undefined,
    circuit: row.circuit ?? '',
    date: row.date,
    startsAt: row.starts_at ?? undefined,
    status: row.status,
    winner: row.winner ?? undefined,
  }));
}

async function loadStandings(categoryId: string): Promise<StandingItem[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('synced_standings')
    .select('position, name, team, points')
    .eq('category_id', categoryId)
    .order('position', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return (data as SyncedStandingRow[]).map((row) => ({
    position: row.position,
    name: row.name,
    points: row.points,
    team: row.team ?? undefined,
  }));
}

// Frescor do dado sincronizado (view public.sync_freshness, mantida pelo motor
// do pitstophub-data): ate qual etapa a classificacao vai e quando mudou.
export type SyncFreshness = {
  season: number | null;
  asOfRound: number | null;
  lastSuccessAt: string | null;
  degraded: boolean;
};

const freshnessCache = new Map<string, CacheEntry<SyncFreshness | null>>();

export async function fetchSyncFreshness(categoryId: string): Promise<SyncFreshness | null> {
  if (!supabase || !isCategorySynced(categoryId)) return null;
  const now = Date.now();
  const hit = freshnessCache.get(categoryId);
  if (hit && hit.expiresAt > now) return hit.value;
  const value = (async () => {
    const { data, error } = await supabase!
      .from('sync_freshness')
      .select('season, as_of_round, last_success_at, degraded')
      .eq('category_id', categoryId)
      .maybeSingle();
    // View ainda nao criada (motor novo nao instalado): so nao mostra nada.
    if (error || !data) return null;
    return {
      season: data.season ?? null,
      asOfRound: data.as_of_round ?? null,
      lastSuccessAt: data.last_success_at ?? null,
      degraded: Boolean(data.degraded),
    };
  })().catch(() => null);
  freshnessCache.set(categoryId, { expiresAt: now + CACHE_TTL_MS, value });
  return value;
}
