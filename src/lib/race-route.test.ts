import { describe, expect, it } from 'vitest';
import { getRaceCircuitInfo } from '../circuit-info';
import { buildCalendar, type JolpicaRace } from '../jolpica';
import { mergeCategoryWithSyncedCalendar } from '../synced-races';
import { MOTORSPORT_DATA, type Race } from '../types';
import { findLiveTwin, resolveRaceRoute } from './race-route';

const category = (id: string) => {
  const found = MOTORSPORT_DATA.find((c) => c.id === id);
  if (!found) throw new Error(`categoria ${id} nao encontrada`);
  return found;
};
// Linha de synced_races como a rotina diaria grava (id "rNN-local", nome = local).
const synced = (id: string, name: string, date: string, status: Race['status'] = 'completed', circuit = ''): Race => ({
  id,
  name,
  location: name,
  circuit,
  date,
  status,
});
const route = (categoryId: string, calendar: Race[], raceId: string) =>
  resolveRaceRoute(calendar, category(categoryId).calendar, raceId);

describe('pagina da etapa depois da sincronizacao da F2', () => {
  // O calendario oficial da F2 2026 nao tem Sakhir nem Jeddah (canceladas) e a fonte usa ids proprios.
  const f2 = mergeCategoryWithSyncedCalendar(category('f2'), [
    synced('r01-melbourne', 'Melbourne', '2026-03-08'),
    synced('r02-miami-gardens', 'Miami', '2026-05-03'),
    synced('r13-lusail', 'Lusail', '2026-11-29', 'upcoming'),
  ]);

  it('a fonte ao vivo nao lista a rodada cancelada de Sakhir', () => {
    expect(f2.calendar.some((r) => r.id === 'sakhir-f2')).toBe(false);
  });

  it('/circuito/f2/sakhir-f2 mostra a etapa cancelada do catalogo, com a ficha de Sakhir', () => {
    const result = route('f2', f2.calendar, 'sakhir-f2');
    expect(result.kind).toBe('found');
    if (result.kind !== 'found') return;
    expect(result.race).toMatchObject({ id: 'sakhir-f2', status: 'cancelled', circuit: 'Bahrain International Circuit' });
    expect(getRaceCircuitInfo(result.race)?.trackImage).toBe('/circuits/sakhir.png');
  });

  it('a rodada cancelada de Jeddah tambem abre', () => {
    expect(route('f2', f2.calendar, 'jeddah-f2')).toMatchObject({ kind: 'found', race: { id: 'jeddah-f2', status: 'cancelled' } });
  });

  it('o id do catalogo de uma etapa que a fonte tem com outro id redireciona para o id ao vivo', () => {
    expect(route('f2', f2.calendar, 'melbourne-f2')).toEqual({ kind: 'redirect', raceId: 'r01-melbourne' });
    expect(route('f2', f2.calendar, 'lusail-f2')).toEqual({ kind: 'redirect', raceId: 'r13-lusail' });
  });

  it('o id ao vivo abre direto e um id inexistente continua "nao encontrada"', () => {
    expect(route('f2', f2.calendar, 'r02-miami-gardens')).toMatchObject({ kind: 'found', race: { id: 'r02-miami-gardens' } });
    expect(route('f2', f2.calendar, 'nao-existe')).toEqual({ kind: 'missing' });
  });

  it('antes da sincronizacao (catalogo puro) tudo abre pelo id do catalogo', () => {
    expect(route('f2', category('f2').calendar, 'sakhir-f2')).toMatchObject({ kind: 'found', race: { id: 'sakhir-f2' } });
    expect(route('f2', category('f2').calendar, 'melbourne-f2')).toMatchObject({ kind: 'found', race: { id: 'melbourne-f2' } });
  });
});

describe('etapas canceladas da F1 (calendario da Jolpica)', () => {
  const jolpica = (round: string, raceName: string, circuitId: string, circuitName: string, locality: string, country: string, date: string): JolpicaRace => ({
    round,
    raceName,
    Circuit: { circuitId, circuitName, Location: { locality, country, lat: '0', long: '0' } },
    date,
    time: '13:00:00Z',
  });
  const live = buildCalendar(
    category('f1'),
    [
      jolpica('1', 'Australian Grand Prix', 'albert_park', 'Albert Park Grand Prix Circuit', 'Melbourne', 'Australia', '2026-03-08'),
      jolpica('16', 'Bahrain Grand Prix in Malaysia', 'sepang', 'Sepang International Circuit', 'Kuala Lumpur', 'Malaysia', '2026-10-04'),
    ],
    new Map(),
  );

  it('o GP do Bahrein cancelado em Sakhir abre como cancelado, sem virar a etapa de Sepang', () => {
    expect(live.some((r) => r.id === 'bahrain-sakhir')).toBe(false);
    expect(route('f1', live, 'bahrain-sakhir')).toMatchObject({ kind: 'found', race: { id: 'bahrain-sakhir', status: 'cancelled', location: 'Sakhir' } });
    expect(route('f1', live, 'saudi')).toMatchObject({ kind: 'found', race: { id: 'saudi', status: 'cancelled' } });
  });

  it('a etapa de Sepang continua com o id "bahrain"', () => {
    expect(route('f1', live, 'bahrain')).toMatchObject({ kind: 'found', race: { id: 'bahrain', circuit: 'Sepang International Circuit' } });
  });
});

describe('outras categorias sincronizadas', () => {
  it('WEC: as canceladas que a mescla recoloca abrem pelo proprio id', () => {
    const wec = mergeCategoryWithSyncedCalendar(category('wec'), [synced('r01-imola', 'Imola', '2026-04-19')]);
    expect(route('wec', wec.calendar, 'qatar')).toMatchObject({ kind: 'found', race: { id: 'qatar', status: 'cancelled' } });
  });

  it('DTM: o catalogo no sabado e a fonte no domingo ainda sao a mesma etapa', () => {
    const dtm = mergeCategoryWithSyncedCalendar(category('dtm'), [synced('r07-sachsenring', 'Sachsenring', '2026-09-13', 'completed', 'Sachsenring')]);
    expect(route('dtm', dtm.calendar, 'sachsenring')).toEqual({ kind: 'redirect', raceId: 'r07-sachsenring' });
  });

  it('IndyCar: rodada dupla de Milwaukee vai para a corrida certa', () => {
    const indy = mergeCategoryWithSyncedCalendar(category('indy'), [
      synced('r16-milwaukee-1', 'Milwaukee 1', '2026-08-30', 'completed', 'Milwaukee Mile'),
      synced('r17-milwaukee-2', 'Milwaukee 2', '2026-08-30', 'completed', 'Milwaukee Mile'),
    ]);
    expect(route('indy', indy.calendar, 'milwaukee-1')).toEqual({ kind: 'redirect', raceId: 'r16-milwaukee-1' });
    expect(route('indy', indy.calendar, 'milwaukee-2')).toEqual({ kind: 'redirect', raceId: 'r17-milwaukee-2' });
  });

  it('etapa so do catalogo, sem par na fonte, abre com os dados do catalogo', () => {
    const wrc = mergeCategoryWithSyncedCalendar(category('wrc'), [synced('r13-sardenha', 'Sardenha', '2026-10-04')]);
    expect(route('wrc', wrc.calendar, 'saudi')).toMatchObject({ kind: 'found', race: { id: 'saudi', name: 'Rally Saudi Arabia' } });
  });
});

describe('findLiveTwin', () => {
  const base: Race = { id: 'monza-x', name: 'Rodada de Monza', location: 'Monza', circuit: 'Autodromo Nazionale Monza', date: '2026-09-06', status: 'upcoming' };

  it('outra pista no fim de semana seguinte nao e a mesma etapa', () => {
    expect(findLiveTwin([synced('r12-baku', 'Baku', '2026-09-07', 'upcoming')], base)).toBeNull();
  });

  it('etapas canceladas da fonte nao servem de par', () => {
    expect(findLiveTwin([synced('r10-monza', 'Monza', '2026-09-06', 'cancelled')], base)).toBeNull();
  });
});
