import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getRaceCircuitInfo, hasCircuitPage } from './circuit-info';
import { buildCalendar, type JolpicaRace } from './jolpica';
import { MOTORSPORT_DATA, type Race } from './types';

const category = (id: string) => {
  const found = MOTORSPORT_DATA.find((c) => c.id === id);
  if (!found) throw new Error(`categoria ${id} nao encontrada`);
  return found;
};
const staticRace = (categoryId: string, raceId: string): Race => {
  const found = category(categoryId).calendar.find((r) => r.id === raceId);
  if (!found) throw new Error(`etapa ${categoryId}/${raceId} nao encontrada`);
  return found;
};
const race = (over: Partial<Race>): Race => ({ id: 'r', name: '', location: '', circuit: '', date: '2026-10-04', status: 'upcoming', ...over });
const image = (r: Race) => getRaceCircuitInfo(r)?.trackImage;

// Como a Jolpica descreve a etapa de 2026 que trocou Sakhir por Sepang.
const jolpicaSepang: JolpicaRace = {
  round: '16',
  raceName: 'Bahrain Grand Prix in Malaysia',
  Circuit: {
    circuitId: 'sepang',
    circuitName: 'Sepang International Circuit',
    Location: { locality: 'Kuala Lumpur', country: 'Malaysia', lat: '2.76083', long: '101.738' },
  },
  date: '2026-10-04',
  time: '07:00:00Z',
};

describe('GP do Bahrein de 2026 em Sepang', () => {
  it('a etapa da F1 em Sepang usa a ficha e o mapa de Sepang', () => {
    const info = getRaceCircuitInfo(staticRace('f1', 'bahrain'));
    expect(info?.trackImage).toBe('/circuits/sepang.png');
    expect(info?.lengthKm).toBe(5.543);
    expect(info?.raceDistanceKm).toBe(310.417);
    expect(info?.laps).toBe(56);
    expect(info?.firstGrandPrix).toBe(1999);
  });

  it('o calendario ao vivo (Jolpica) leva a etapa para Sepang, nao para Sakhir', () => {
    const [live] = buildCalendar(category('f1'), [jolpicaSepang], new Map());
    expect(live.id).toBe('bahrain');
    expect(live.circuit).toBe('Sepang International Circuit');
    expect(image(live)).toBe('/circuits/sepang.png');
  });

  it('mesmo casada so pelo nome com o GP de Sakhir, a etapa fica com o local da Jolpica', () => {
    const onlySakhir = { ...category('f1'), calendar: [staticRace('f1', 'bahrain-sakhir')] };
    const [live] = buildCalendar(onlySakhir, [jolpicaSepang], new Map());
    expect(live.circuit).toBe('Sepang International Circuit');
    expect(live.location).toBe('Kuala Lumpur');
    expect(image(live)).toBe('/circuits/sepang.png');
  });

  it('o local decide antes do nome do evento', () => {
    expect(image(race({ name: 'GP do Bahrein', enName: 'Bahrain GP', country: 'Malaysia' }))).toBe('/circuits/sepang.png');
    expect(image(race({ name: 'Bahrain Grand Prix in Malaysia', location: 'Kuala Lumpur' }))).toBe('/circuits/sepang.png');
    expect(image(race({ name: 'GP do Bahrein', circuit: 'Sepang International Circuit' }))).toBe('/circuits/sepang.png');
  });
});

describe('provas disputadas em Sakhir', () => {
  it('usam a ficha e o mapa de Sakhir', () => {
    for (const r of [staticRace('f1', 'bahrain-sakhir'), staticRace('f2', 'sakhir-f2'), staticRace('wec', 'bahrain')]) {
      const info = getRaceCircuitInfo(r);
      expect(info?.trackImage, r.id).toBe('/circuits/sakhir.png');
      expect(info?.lengthKm, r.id).toBe(5.412);
    }
  });

  it('o nome "Bahrein" sem outro local continua indo para Sakhir', () => {
    expect(image(race({ name: '8 Horas do Bahrein' }))).toBe('/circuits/sakhir.png');
  });
});

describe('outras pistas', () => {
  it('o Madring vence o nome "Spanish Grand Prix" da Jolpica', () => {
    expect(image(race({ name: 'Spanish Grand Prix', circuit: 'Madring', location: 'Madrid' }))).toBe('/circuits/madrid.png');
    expect(image(staticRace('f1', 'spain'))).toBe('/circuits/spain.png');
  });

  it('dados do Madring conferem com a pagina da F1 de 2026', () => {
    const info = getRaceCircuitInfo(staticRace('f1', 'madrid'));
    expect(info?.lengthKm).toBe(5.414);
    expect(info?.raceDistanceKm).toBe(308.399);
    expect(info?.lapRecord).toEqual({ time: '1:35.587', driver: 'G. Russell (Mercedes)', year: 2026 });
  });

  it('toda etapa da F1 2026 tem ficha com mapa', () => {
    const f1 = category('f1');
    for (const r of f1.calendar) {
      expect(hasCircuitPage(f1, r), r.id).toBe(true);
      const img = getRaceCircuitInfo(r)?.trackImage ?? '';
      expect(img, r.id).toMatch(/^\/circuits\/[\w-]+\.png$/);
      expect(existsSync(`public${img}`), img).toBe(true);
    }
  });
});
