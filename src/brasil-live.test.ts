import { describe, expect, it } from 'vitest';
import type { Category, Race } from './types';
import { MOTORSPORT_DATA } from './types';
import {
  getBrasilCategoryIds,
  isBrasilCategory,
  mergeCategoryWithBrasilCalendar,
  mergeCategoryWithBrasilDrivers,
  mergeCategoryWithBrasilStandings,
} from './brasil-live';
import { getRaceCircuitInfo } from './circuit-info';

const category = (id: string) => MOTORSPORT_DATA.find((c) => c.id === id) as Category;
const race = (over: Partial<Race>): Race => ({
  id: 'r', name: 'Interlagos', location: 'Interlagos', circuit: 'Interlagos', date: '2026-03-01', status: 'completed', ...over,
});

describe('categorias brasileiras novas', () => {
  it('estao no catalogo e sao servidas pela api-motorsports', () => {
    expect(getBrasilCategoryIds()).toEqual(['nascar-brasil', 'porsche-cup']);
    for (const id of getBrasilCategoryIds()) {
      expect(isBrasilCategory(id)).toBe(true);
      expect(category(id)).toBeDefined();
      expect(category(id).rulesFormat?.length).toBeGreaterThan(0);
    }
    expect(isBrasilCategory('nascar')).toBe(false);
  });

  it('o merge so mexe na propria categoria', () => {
    const nascar = category('nascar');
    expect(mergeCategoryWithBrasilCalendar(nascar, [race({})])).toBe(nascar);
    expect(mergeCategoryWithBrasilDrivers(nascar, [{ id: 'x', name: 'X', number: '', nationality: 'Brasil', teamId: '' }])).toBe(nascar);
    expect(mergeCategoryWithBrasilStandings(nascar, { drivers: [] })).toBe(nascar);
  });

  it('uma divisao vira a lista de pilotos; varias viram divisoes separadas', () => {
    const nb = mergeCategoryWithBrasilStandings(category('nascar-brasil'), {
      drivers: [{ position: 1, name: 'Thiago Camilo', points: 226 }],
    });
    expect(nb.standings?.drivers?.[0].name).toBe('Thiago Camilo');
    expect(nb.standings?.driverClasses).toBeUndefined();

    const pc = mergeCategoryWithBrasilStandings(category('porsche-cup'), {
      driverClasses: [
        { classLabel: 'Sprint Carrera', entries: [{ position: 1, name: 'Marçal Muller', points: 180 }] },
        { classLabel: 'Endurance Challenge', entries: [{ position: 1, name: 'Fabio Carbone', points: 105 }] },
      ],
    });
    expect(pc.standings?.driverClasses?.map((c) => c.classLabel)).toEqual(['Sprint Carrera', 'Endurance Challenge']);
    expect(pc.standings?.drivers).toBeUndefined();
  });
});

describe('circuitos das categorias brasileiras', () => {
  // So as pistas que ja tem desenho conferido em public/circuits; as outras
  // ficam sem mapa, em vez de pegar o desenho de outro lugar.
  const withMap: [string, string, string][] = [
    ['porsche-cup', 'Interlagos', '/circuits/interlagos.png'],
    ['porsche-cup', 'Le Mans', '/circuits/le-mans.png'],
    ['porsche-cup', 'Algarve', '/circuits/portimao.png'],
    ['nascar-brasil', 'Interlagos', '/circuits/interlagos.png'],
    ['nascar-brasil', 'Londrina', '/circuits/londrina.png'],
  ];

  it.each(withMap)('%s em %s usa o desenho que ja temos', (categoryId, name, image) => {
    const info = getRaceCircuitInfo(race({ name, location: name, circuit: name }), categoryId);
    expect(info?.trackImage).toBe(image);
  });

  it.each(['Velocitta', 'Brasília', 'Santa Cruz', 'Cascavel', 'Cuiaba', 'Curvelo', 'Chapeco'])(
    '%s fica sem mapa enquanto nao houver desenho conferido',
    (name) => {
      expect(getRaceCircuitInfo(race({ name, location: name, circuit: name }), 'nascar-brasil')).toBeNull();
    },
  );

  it('fora da F1, a ficha nao leva voltas nem recorde do GP', () => {
    const info = getRaceCircuitInfo(race({ name: 'Interlagos' }), 'porsche-cup');
    expect(info?.trackImage).toBe('/circuits/interlagos.png');
    expect(info?.laps).toBeUndefined();
    expect(info?.lapRecord).toBeUndefined();
    expect(info?.lengthKm).toBe(4.309);
  });
});
