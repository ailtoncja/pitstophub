import type { Race } from '../types';

// Datas das fichas de rali do WRC 2026 (sem os mapas): a pagina da etapa decide por aqui se ha ficha
// e so entao carrega os dados pesados (src/rally/rallies-2026.ts). O teste confere com as fichas.
export const RALLY_DATES_2026: readonly { id: string; start: string; end: string }[] = [
  { id: 'montecarlo', start: '2026-01-21', end: '2026-01-25' },
  { id: 'sweden', start: '2026-02-12', end: '2026-02-15' },
  { id: 'safari', start: '2026-03-12', end: '2026-03-15' },
  { id: 'croatia', start: '2026-04-09', end: '2026-04-12' },
  { id: 'canarias', start: '2026-04-23', end: '2026-04-26' },
  { id: 'portugal', start: '2026-05-06', end: '2026-05-10' },
  { id: 'japan', start: '2026-05-28', end: '2026-05-31' },
  { id: 'greece', start: '2026-06-25', end: '2026-06-28' },
  { id: 'estonia', start: '2026-07-16', end: '2026-07-19' },
  { id: 'finland', start: '2026-07-30', end: '2026-08-02' },
  { id: 'paraguay', start: '2026-08-27', end: '2026-08-30' },
  { id: 'chile', start: '2026-09-10', end: '2026-09-13' },
  { id: 'sardegna', start: '2026-10-01', end: '2026-10-04' },
];

const DAY_MS = 86_400_000;
const dayOf = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);

/**
 * Id da ficha do rali da etapa, pela data (os ralis do WRC nao se sobrepoem). O catalogo guarda o
 * ultimo dia e a fonte ao vivo pode guardar outro dia do mesmo fim de semana, por isso a folga.
 */
export function rallyIdFor(race: Race): string | null {
  const day = dayOf(race.date);
  if (!Number.isFinite(day)) return null;
  return RALLY_DATES_2026.find((rally) => day >= dayOf(rally.start) - DAY_MS && day <= dayOf(rally.end) + 2 * DAY_MS)?.id ?? null;
}
