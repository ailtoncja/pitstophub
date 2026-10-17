import type { Category, Race } from '../types';
import { hasStartTime } from './format';
import { completedRacesDesc, nextRace, roundNumber } from './season';
import { totalRounds } from './categories-meta';
import { raceStartDate } from '../race-time';

/** Uma corrida e considerada "ao vivo" por esta janela depois da largada (a fonte nao informa o fim). */
export const LIVE_WINDOW_MS = 3 * 3600_000;

export type ReelPhase = 'live' | 'countdown' | 'awaiting' | 'wrapped';

export type ReelItem = {
  category: Category;
  race: Race;
  phase: ReelPhase;
  /** Largada em ms (so confiavel para ordenar quando a fonte informa o horario; senao, meia-noite do dia). */
  startMs: number;
  round: number | null;
  rounds: number;
};

export function phaseOf(race: Race, now: number): Exclude<ReelPhase, 'wrapped'> {
  if (!hasStartTime(race)) return 'countdown';
  const start = raceStartDate(race).getTime();
  if (now >= start && now < start + LIVE_WINDOW_MS) return 'live';
  if (now >= start + LIVE_WINDOW_MS) return 'awaiting';
  return 'countdown';
}

/**
 * Itens do reel da Inicio: a proxima largada de cada categoria (ou o ultimo resultado quando a temporada acabou).
 * Ordem: ao vivo primeiro; depois as categorias que a pessoa segue; depois as demais, sempre pela largada mais proxima;
 * temporadas encerradas por ultimo.
 */
export function buildReel(categories: Category[], followed: Set<string>, now: number, max = 8): ReelItem[] {
  const items: ReelItem[] = [];
  for (const category of categories) {
    const next = nextRace(category.calendar, now);
    const race = next ?? completedRacesDesc(category.calendar)[0];
    if (!race) continue;
    const round = roundNumber(category.calendar, race);
    items.push({
      category,
      race,
      phase: next ? phaseOf(next, now) : 'wrapped',
      startMs: raceStartDate(race).getTime(),
      round: round > 0 ? round : null,
      rounds: totalRounds(category),
    });
  }

  const rank = (item: ReelItem) => {
    if (item.phase === 'wrapped') return followed.has(item.category.id) ? 3 : 4;
    if (item.phase === 'live') return 0;
    return followed.has(item.category.id) ? 1 : 2;
  };
  return items
    .sort((a, b) => rank(a) - rank(b) || a.startMs - b.startMs)
    .slice(0, max);
}
