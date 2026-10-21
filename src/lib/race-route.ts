import type { Race } from '../types';
import { raceKey } from './entities';

/**
 * O que a pagina /circuito/:categoria/:etapa deve mostrar.
 *
 * As fontes ao vivo (Jolpica na F1, synced_races nas categorias sincronizadas, api-motorsports) substituem o
 * calendario do catalogo estatico (types.ts) com ids proprios (ex.: "r01-melbourne" no lugar de "melbourne-f2") e
 * sem as etapas canceladas, que essas fontes simplesmente nao listam. Mas os links com o id do catalogo continuam
 * existindo: a interface usa o catalogo enquanto a sincronizacao nao termina (busca, agenda, calendario) e esses
 * enderecos ficam salvos/compartilhados. Sem isto, "/circuito/f2/sakhir-f2" virava "Etapa nao encontrada".
 */
export type RaceRoute =
  | { kind: 'found'; race: Race }
  | { kind: 'redirect'; raceId: string }
  | { kind: 'missing' };

const DAY_MS = 86_400_000;
// Um fim de semana de corrida: o catalogo as vezes guarda o sabado e a fonte, o domingo (ou o contrario).
const SAME_WEEKEND_DAYS = 2;

/**
 * 1. id presente no calendario em uso (ao vivo ou catalogo) -> essa etapa;
 * 2. etapa cancelada do catalogo -> a propria etapa do catalogo (a fonte ao vivo nao a lista);
 * 3. etapa do catalogo que a fonte ao vivo tem com outro id -> redireciona para o id ao vivo;
 * 4. etapa so do catalogo -> a etapa do catalogo.
 */
export function resolveRaceRoute(calendar: Race[], catalog: Race[], raceId: string): RaceRoute {
  const live = calendar.find((race) => raceKey(race) === raceId);
  if (live) return { kind: 'found', race: live };

  const base = catalog.find((race) => raceKey(race) === raceId);
  if (!base) return { kind: 'missing' };
  if (base.status === 'cancelled') return { kind: 'found', race: base };

  const twin = findLiveTwin(calendar, base);
  return twin ? { kind: 'redirect', raceId: raceKey(twin) } : { kind: 'found', race: base };
}

/** A mesma etapa no calendario ao vivo: mesma data, ou o mesmo lugar no mesmo fim de semana. */
export function findLiveTwin(calendar: Race[], base: Race): Race | null {
  const baseDay = dayOf(base.date);
  const baseTokens = tokensOf(base);
  let best: Race | null = null;
  let bestScore = -1;
  for (const race of calendar) {
    if (race.status === 'cancelled') continue;
    const gap = Math.abs(dayOf(race.date) - baseDay);
    if (!Number.isFinite(gap) || gap > SAME_WEEKEND_DAYS) continue;
    const shared = [...tokensOf(race)].filter((token) => baseTokens.has(token)).length;
    // Fora da mesma data, so vale se citar o mesmo lugar.
    if (gap > 0 && shared === 0) continue;
    // Data mais proxima primeiro; no empate (rodada dupla), quem cita mais do mesmo nome/lugar.
    const score = (SAME_WEEKEND_DAYS - gap) * 100 + shared;
    if (score > bestScore) {
      bestScore = score;
      best = race;
    }
  }
  return best;
}

function dayOf(date: string): number {
  return Math.round(Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / DAY_MS);
}

// Palavras que todo nome de etapa tem e nao dizem onde ela acontece.
const GENERIC_WORDS = new Set(['rodada', 'round', 'grand', 'prix', 'race', 'corrida', 'circuit', 'circuito', 'international', 'the', 'and', 'das', 'dos']);

function tokensOf(race: Race): Set<string> {
  const text = [race.id, race.name, race.enName, race.location, race.enLocation, race.circuit].filter(Boolean).join(' ');
  return new Set(
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      // Numeros soltos ficam ("Corrida 1"/"milwaukee-2"); prefixos de rodada ("r07") e palavras curtas, nao.
      .filter((token) => token && !GENERIC_WORDS.has(token) && !/^r\d+$/.test(token) && (token.length > 2 || /^\d+$/.test(token))),
  );
}
