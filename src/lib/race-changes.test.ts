import { describe, expect, it } from 'vitest';
import { buildCalendar, type JolpicaRace } from '../jolpica';
import { mergeCategoryWithSyncedCalendar } from '../synced-races';
import { MOTORSPORT_DATA, type Race } from '../types';
import { totalRounds } from './categories-meta';
import { calendarSections, calendarWithCancelled, joinNames, raceChange } from './race-changes';
import { resolveRaceRoute } from './race-route';
import { nextRace, roundNumber, upcomingRaces } from './season';

const category = (id: string) => {
  const found = MOTORSPORT_DATA.find((c) => c.id === id);
  if (!found) throw new Error(`categoria ${id} nao encontrada`);
  return found;
};
const catalog = (id: string) => category(id).calendar;
const synced = (id: string, name: string, date: string, status: Race['status'] = 'completed', circuit = ''): Race => ({ id, name, location: name, circuit, date, status });
const ids = (races: Race[]) => races.map((race) => race.id);

describe('dados dos pares cancelada <-> substituta (types.ts)', () => {
  const all = MOTORSPORT_DATA.flatMap((c) => c.calendar.map((race) => ({ categoryId: c.id, calendar: c.calendar, race })));

  it('todo replacedBy/replaces aponta para uma etapa existente da mesma categoria, e nunca para si mesma', () => {
    for (const { categoryId, calendar, race } of all) {
      for (const id of [...(race.replacedBy ?? []), ...(race.replaces ?? [])]) {
        expect(calendar.some((item) => item.id === id), `${categoryId}/${race.id} -> ${id}`).toBe(true);
        expect(id, `${categoryId}/${race.id}`).not.toBe(race.id);
      }
    }
  });

  it('os links sao simetricos (A.replacedBy tem B <=> B.replaces tem A) e "transferida" vale nos dois lados', () => {
    for (const { categoryId, calendar, race } of all) {
      for (const id of race.replacedBy ?? []) {
        const target = calendar.find((item) => item.id === id)!;
        expect(target.replaces, `${categoryId}/${id} deveria citar ${race.id}`).toContain(race.id);
        expect(Boolean(target.relocated), `${categoryId}/${race.id} <-> ${id}`).toBe(Boolean(race.relocated));
      }
      for (const id of race.replaces ?? []) {
        expect(calendar.find((item) => item.id === id)!.replacedBy, `${categoryId}/${id} deveria citar ${race.id}`).toContain(race.id);
      }
    }
  });

  it('so etapa cancelada tem replacedBy, so etapa nao cancelada tem replaces', () => {
    for (const { categoryId, race } of all) {
      if (race.replacedBy) expect(race.status, `${categoryId}/${race.id}`).toBe('cancelled');
      if (race.replaces) expect(race.status, `${categoryId}/${race.id}`).not.toBe('cancelled');
    }
  });

  it('toda etapa cancelada do catalogo diz se teve substituta e cita a fonte; todo par tem fonte', () => {
    for (const { categoryId, race } of all) {
      if (race.status === 'cancelled') expect(race.replacedBy, `${categoryId}/${race.id}`).toBeDefined();
      if (race.status === 'cancelled' || race.replaces || race.replacedBy || race.relocated) {
        expect(race.changeSource, `${categoryId}/${race.id}`).toMatch(/^https:\/\/\S+$/);
      }
    }
  });

  it('os pares confirmados nas fontes oficiais', () => {
    const pick = (categoryId: string, id: string) => catalog(categoryId).find((race) => race.id === id)!;
    expect(pick('f1', 'bahrain-sakhir')).toMatchObject({ status: 'cancelled', replacedBy: ['bahrain'], relocated: true });
    expect(pick('f1', 'bahrain')).toMatchObject({ circuit: 'Sepang International Circuit', replaces: ['bahrain-sakhir'], relocated: true });
    expect(pick('f1', 'saudi')).toMatchObject({ status: 'cancelled', replacedBy: [] });
    for (const id of ['sakhir-f2', 'jeddah-f2']) expect(pick('f2', id).replacedBy).toEqual(['miami-f2', 'montreal-f2']);
    expect(pick('f3', 'sakhir-f3')).toMatchObject({ status: 'cancelled', date: '2026-04-12', replacedBy: [] });
    expect(pick('f1-academy', 'jeddah-academy')).toMatchObject({ status: 'cancelled', date: '2026-04-19', replacedBy: [] });
    for (const id of ['qatar', 'bahrain']) expect(pick('wec', id).replacedBy).toEqual(['barcelona-wec', 'monza-wec']);
    expect(pick('wrc', 'saudi')).toMatchObject({ status: 'cancelled', replacedBy: [] });
  });
});

describe('raceChange', () => {
  it('etapa cancelada com substituta, transferida e sem substituta', () => {
    const f1 = catalog('f1');
    expect(raceChange(f1, f1.find((r) => r.id === 'bahrain-sakhir')!)).toMatchObject({ kind: 'replacedBy', relocated: true, races: [{ id: 'bahrain' }] });
    expect(raceChange(f1, f1.find((r) => r.id === 'saudi')!)).toMatchObject({ kind: 'noReplacement' });
    expect(raceChange(f1, f1.find((r) => r.id === 'australia')!)).toBeNull();
  });

  it('a substituta vinda da fonte ao vivo (id proprio) ainda acha as canceladas do catalogo', () => {
    // F2: synced_races usa "r02-miami-gardens"/"r03-montreal".
    expect(raceChange(catalog('f2'), synced('r02-miami-gardens', 'Miami', '2026-05-03', 'completed', 'Miami International Autodrome'))).toMatchObject({
      kind: 'replaces',
      relocated: false,
      races: [{ id: 'sakhir-f2' }, { id: 'jeddah-f2' }],
    });
    expect(raceChange(catalog('f2'), synced('r03-montreal', 'Montreal', '2026-05-24'))).toMatchObject({ kind: 'replaces' });
    // WEC: "r08-monza" sem circuito.
    expect(raceChange(catalog('wec'), synced('r08-monza', 'Monza', '2026-11-08', 'upcoming'))).toMatchObject({ kind: 'replaces', races: [{ id: 'qatar' }, { id: 'bahrain' }] });
    // Outra etapa da mesma fonte nao vira substituta.
    expect(raceChange(catalog('f2'), synced('r04-monte-carlo', 'MÃ´naco', '2026-06-07'))).toBeNull();
  });

  it('F1 (Jolpica): a etapa de Sepang mantem o id e aponta para Sakhir', () => {
    const jolpica: JolpicaRace = {
      round: '16',
      raceName: 'Bahrain Grand Prix in Malaysia',
      Circuit: { circuitId: 'sepang', circuitName: 'Sepang International Circuit', Location: { locality: 'Kuala Lumpur', country: 'Malaysia', lat: '0', long: '0' } },
      date: '2026-10-04',
      time: '07:00:00Z',
    };
    const [sepang] = buildCalendar(category('f1'), [jolpica], new Map());
    expect(raceChange(catalog('f1'), sepang)).toMatchObject({ kind: 'replaces', relocated: true, races: [{ id: 'bahrain-sakhir' }] });
  });

  it('todo link de substituta abre uma pagina (id do catalogo redireciona para o id ao vivo)', () => {
    const f2 = mergeCategoryWithSyncedCalendar(category('f2'), [
      synced('r01-melbourne', 'Melbourne', '2026-03-08'),
      synced('r02-miami-gardens', 'Miami', '2026-05-03', 'completed', 'Miami International Autodrome'),
      synced('r03-montreal', 'Montreal', '2026-05-24', 'completed', 'Circuit Gilles-Villeneuve'),
    ]);
    expect(resolveRaceRoute(f2.calendar, catalog('f2'), 'miami-f2')).toEqual({ kind: 'redirect', raceId: 'r02-miami-gardens' });
    expect(resolveRaceRoute(f2.calendar, catalog('f2'), 'montreal-f2')).toEqual({ kind: 'redirect', raceId: 'r03-montreal' });
    expect(resolveRaceRoute(f2.calendar, catalog('f2'), 'jeddah-f2')).toMatchObject({ kind: 'found', race: { status: 'cancelled' } });
  });
});

describe('ordem do calendario com as canceladas', () => {
  const NOW = Date.parse('2026-10-21T12:00:00Z');

  it('F2 ao vivo: Sakhir e Jeddah voltam na posicao da data, entre Melbourne e Miami', () => {
    const f2 = mergeCategoryWithSyncedCalendar(category('f2'), [
      synced('r01-melbourne', 'Melbourne', '2026-03-08'),
      synced('r02-miami-gardens', 'Miami', '2026-05-03'),
      synced('r03-montreal', 'Montreal', '2026-05-24'),
      synced('r13-lusail', 'Lusail', '2026-11-29', 'upcoming'),
    ]);
    expect(ids(calendarWithCancelled(f2.calendar, catalog('f2')))).toEqual(['r01-melbourne', 'sakhir-f2', 'jeddah-f2', 'r02-miami-gardens', 'r03-montreal', 'r13-lusail']);
    const { toCome, played } = calendarSections(f2.calendar, catalog('f2'), NOW);
    expect(ids(toCome)).toEqual(['r13-lusail']);
    expect(ids(played)).toEqual(['r03-montreal', 'r02-miami-gardens', 'jeddah-f2', 'sakhir-f2', 'r01-melbourne']);
  });

  it('WEC: Catar e Bahrein (futuras) ficam em "a disputar", na data, mas nao viram a proxima etapa nem contam', () => {
    const wec = mergeCategoryWithSyncedCalendar(category('wec'), [
      synced('r07-barcelona', 'Barcelona', '2026-10-18'),
      synced('r08-monza', 'Monza', '2026-11-08', 'upcoming'),
    ]);
    const { toCome, played } = calendarSections(wec.calendar, catalog('wec'), NOW);
    expect(ids(toCome)).toEqual(['qatar', 'bahrain', 'r08-monza']);
    expect(ids(played)[0]).toBe('r07-barcelona');
    // Sem duplicar: a mescla do WEC ja recoloca as canceladas do catalogo.
    expect(ids(calendarWithCancelled(wec.calendar, catalog('wec'))).filter((id) => id === 'qatar')).toHaveLength(1);
    expect(nextRace(wec.calendar, NOW)?.id).toBe('r08-monza');
    expect(ids(upcomingRaces(wec.calendar, NOW))).toEqual(['r08-monza']);
  });

  it('F1 (catalogo): as canceladas nao entram na numeracao nem na contagem', () => {
    const f1 = category('f1');
    expect(roundNumber(f1.calendar, f1.calendar.find((r) => r.id === 'miami')!)).toBe(4);
    expect(roundNumber(f1.calendar, f1.calendar.find((r) => r.id === 'saudi')!)).toBe(0);
    expect(totalRounds(f1)).toBe(f1.calendar.length - 2);
    const all = calendarWithCancelled(f1.calendar, catalog('f1'));
    expect(ids(all).indexOf('bahrain-sakhir')).toBe(ids(all).indexOf('japan') + 1);
    expect(ids(all).indexOf('saudi')).toBe(ids(all).indexOf('bahrain-sakhir') + 1);
  });

  it('WRC: o Rally Saudi Arabia cancelado nao e mais a proxima etapa', () => {
    const wrc = category('wrc');
    expect(nextRace(wrc.calendar, NOW)?.id).not.toBe('saudi');
    expect(totalRounds(wrc)).toBe(13);
    expect(ids(calendarSections(wrc.calendar, catalog('wrc'), NOW).toCome)).toContain('saudi');
  });
});

describe('joinNames', () => {
  it('junta com virgulas e "e"', () => {
    expect(joinNames(['A'], 'e')).toBe('A');
    expect(joinNames(['A', 'B'], 'e')).toBe('A e B');
    expect(joinNames(['A', 'B', 'C'], 'and')).toBe('A, B and C');
  });
});
