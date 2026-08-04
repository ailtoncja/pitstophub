import { supabase } from './supabase';
import type { Category, Race, StandingItem } from './types';

// Categorias sem API propria: calendario mantido pelo job agendado em
// scripts/sync-thesportsdb.mjs (GitHub Actions), gravado na tabela
// public.synced_races. O job roda 1x/dia, entao um cache local generoso
// evita bater no Supabase toda hora sem necessidade.
const SYNCED_CATEGORY_IDS = [
  'f2', 'f3', 'f1-academy', 'wec', 'imsa', 'dtm', 'gt-world-challenge', 'indy', 'nascar', 'wrc',
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
  return { ...category, calendar };
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

  const { data, error } = await supabase
    .from('synced_races')
    .select('race_id, name, en_name, location, en_location, circuit, date, status, winner')
    .eq('category_id', categoryId)
    .order('round', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return (data as SyncedRaceRow[]).map((row) => ({
    id: row.race_id,
    name: row.name,
    enName: row.en_name ?? undefined,
    location: row.location ?? '',
    enLocation: row.en_location ?? undefined,
    circuit: row.circuit ?? '',
    date: row.date,
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
