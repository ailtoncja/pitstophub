import { describe, expect, it } from 'vitest';
import type { Category, Race } from '../types';
import { buildReel, phaseOf } from './reel';

const race = (id: string, date: string, startsAt?: string, status: Race['status'] = 'upcoming', extra: Partial<Race> = {}): Race => ({
  id,
  name: id,
  location: id,
  date,
  circuit: id,
  status,
  startsAt,
  ...extra,
});
const category = (id: string, calendar: Race[]) => ({ id, name: id, calendar, teams: [], drivers: [] }) as unknown as Category;

const NOW = new Date('2026-10-04T06:00:00Z').getTime();

const f1 = category('f1', [race('f1-a', '2026-10-11', '2026-10-11T12:00:00Z')]);
const wrc = category('wrc', [race('wrc-a', '2026-10-04', '2026-10-04T08:00:00Z')]);
const nascar = category('nascar', [race('nascar-a', '2026-10-04', '2026-10-04T19:00:00Z')]);
const wec = category('wec', [race('wec-done', '2026-09-01', '2026-09-01T10:00:00Z', 'completed', { winner: 'Ferrari' })]);
const empty = category('indy', []);

describe('reel da Inicio', () => {
  it('ordena pela largada mais proxima quando nada e seguido', () => {
    expect(buildReel([f1, nascar, wrc], new Set(), NOW).map((item) => item.category.id)).toEqual(['wrc', 'nascar', 'f1']);
  });

  it('poe as categorias seguidas na frente, cada uma pela sua largada', () => {
    expect(buildReel([f1, nascar, wrc], new Set(['f1', 'nascar']), NOW).map((item) => item.category.id)).toEqual(['nascar', 'f1', 'wrc']);
  });

  it('coloca o que esta ao vivo antes de tudo e marca a fase', () => {
    const live = category('gt', [race('gt-a', '2026-10-04', '2026-10-04T05:00:00Z')]);
    const items = buildReel([f1, live], new Set(['f1']), NOW);
    expect(items[0]).toMatchObject({ phase: 'live' });
    expect(items[0].category.id).toBe('gt');
  });

  it('mostra o ultimo resultado quando a temporada acabou e deixa essas categorias por ultimo', () => {
    const items = buildReel([wec, f1], new Set(['wec']), NOW);
    expect(items.map((item) => [item.category.id, item.phase])).toEqual([['f1', 'countdown'], ['wec', 'wrapped']]);
  });

  it('ignora categorias sem nenhuma corrida e respeita o limite', () => {
    expect(buildReel([empty, f1, nascar, wrc], new Set(), NOW, 2).map((item) => item.category.id)).toEqual(['wrc', 'nascar']);
  });

  it('sem horario informado a fase e contagem, nunca ao vivo', () => {
    expect(phaseOf(race('x', '2026-10-04'), NOW)).toBe('countdown');
  });

  it('depois da janela de 3 horas a etapa fica aguardando o resultado', () => {
    expect(phaseOf(race('x', '2026-10-04', '2026-10-04T01:00:00Z'), NOW)).toBe('awaiting');
  });
});
