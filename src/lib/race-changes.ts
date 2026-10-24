import { raceStartDate } from '../race-time';
import type { Race } from '../types';
import { findLiveTwin, sameEventAndPlace } from './race-route';

/**
 * Pares "etapa cancelada <-> substituta", guardados no catalogo (types.ts: replacedBy/replaces/relocated/changeSource).
 *
 * As fontes ao vivo nao sabem nada disso: a Jolpica e o synced_races nao listam as canceladas e trocam os ids
 * (ex.: "r02-miami-gardens" no lugar de "miami-f2"). Por isso tudo aqui parte do catalogo e os links usam o id do
 * catalogo, que a pagina da etapa redireciona para o id ao vivo (race-route.ts).
 */
export type RaceChange =
  /** Etapa cancelada que tem substituta(s) (ou foi transferida, quando `relocated`). */
  | { kind: 'replacedBy'; races: Race[]; relocated: boolean; source?: string }
  /** Etapa cancelada sem substituta (confirmado na fonte). */
  | { kind: 'noReplacement'; source?: string }
  /** Etapa que entrou no lugar de etapa(s) cancelada(s). */
  | { kind: 'replaces'; races: Race[]; relocated: boolean; source?: string };

/** A entrada do catalogo que corresponde a uma etapa exibida (pelo id; para ids ao vivo, a mesma etapa no fim de semana). */
export function catalogEntryFor(catalog: Race[], race: Race): Race | null {
  const same = catalog.find((item) => item.id === race.id);
  if (same) return same;
  if (race.status === 'cancelled') return catalog.find((item) => item.status === 'cancelled' && sameEventAndPlace(item, race)) ?? null;
  return catalog.find((item) => item.replaces?.length && findLiveTwin([race], item)) ?? null;
}

export function raceChange(catalog: Race[], race: Race): RaceChange | null {
  const entry = catalogEntryFor(catalog, race);
  if (!entry) return null;
  const byIds = (ids: string[]) => ids.map((id) => catalog.find((item) => item.id === id)).filter((item): item is Race => Boolean(item));
  const relocated = Boolean(entry.relocated);
  if (entry.status === 'cancelled' && entry.replacedBy) {
    const races = byIds(entry.replacedBy);
    return races.length > 0 ? { kind: 'replacedBy', races, relocated, source: entry.changeSource } : { kind: 'noReplacement', source: entry.changeSource };
  }
  if (entry.status !== 'cancelled' && entry.replaces?.length) {
    const races = byIds(entry.replaces);
    if (races.length > 0) return { kind: 'replaces', races, relocated, source: entry.changeSource };
  }
  return null;
}

const byStart = (a: Race, b: Race) => raceStartDate(a).getTime() - raceStartDate(b).getTime();
// Mesma folga de upcomingRaces (season.ts): uma etapa so "ja passou" um dia e meio depois da largada.
const AHEAD_GRACE_MS = 36 * 3600_000;

/**
 * O calendario em uso mais as etapas canceladas do catalogo que a fonte ao vivo nao lista, em ordem de data.
 * As canceladas so aparecem aqui: contagem, numero de rodada e "proxima etapa" continuam ignorando-as.
 */
export function calendarWithCancelled(calendar: Race[], catalog: Race[]): Race[] {
  const missing = catalog.filter(
    (base) =>
      base.status === 'cancelled' &&
      !calendar.some((race) => race.id === base.id || (race.status === 'cancelled' && sameEventAndPlace(race, base))),
  );
  return [...calendar, ...missing].sort(byStart);
}

/**
 * As duas listas da pagina de calendario: "a disputar" (em ordem de data) e "ja disputadas" (da mais recente para a
 * mais antiga). Cada etapa cancelada entra na lista e na posicao da sua data.
 */
export function calendarSections(calendar: Race[], catalog: Race[], now = Date.now()): { toCome: Race[]; played: Race[] } {
  const all = calendarWithCancelled(calendar, catalog);
  const ahead = (race: Race) => raceStartDate(race).getTime() + AHEAD_GRACE_MS > now;
  return {
    toCome: all.filter((race) => (race.status === 'upcoming' || race.status === 'cancelled') && ahead(race)),
    played: all.filter((race) => race.status === 'completed' || (race.status === 'cancelled' && !ahead(race))).reverse(),
  };
}

/** "A e B", "A, B e C". */
export function joinNames(names: string[], and: string): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}
