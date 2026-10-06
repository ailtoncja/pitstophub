import { describe, expect, it } from 'vitest';
import type { Category, Race } from '../types';
import { allUpcoming, followedCategorySet, pickHero } from './hero';

const race = (id: string, date: string, startsAt?: string): Race => ({ id, name: id, location: id, date, circuit: id, status: 'upcoming', startsAt });
const category = (id: string, calendar: Race[]) => ({ id, name: id, calendar, teams: [], drivers: [] }) as unknown as Category;

const f1 = category('f1', [race('f1-a', '2026-10-11', '2026-10-11T12:00:00Z')]);
const wrc = category('wrc', [race('wrc-a', '2026-10-04', '2026-10-04T08:00:00Z')]);
const nascar = category('nascar', [race('nascar-a', '2026-10-04', '2026-10-04T19:00:00Z'), race('nascar-b', '2026-10-18', '2026-10-18T19:00:00Z')]);
const NOW = new Date('2026-10-04T06:00:00Z').getTime();

describe('hero da Home', () => {
  it('junta as categorias de interesse: seguidas, times e pilotos', () => {
    const set = followedCategorySet({ followedCategoryIds: ['f1'], followedTeamIds: ['wec::ferrari'], followedDriverIds: ['indy::palou'] });
    expect([...set].sort()).toEqual(['f1', 'indy', 'wec']);
  });

  it('ordena todas as proximas etapas por horario', () => {
    expect(allUpcoming([f1, wrc, nascar], NOW).map((item) => item.race.id)).toEqual(['wrc-a', 'nascar-a', 'f1-a', 'nascar-b']);
  });

  it('em "Todas" sem favoritos, escolhe a mais proxima e lista as do mesmo dia', () => {
    const { hero, sameDay } = pickHero({ categories: [f1, wrc, nascar], group: 'all', followed: new Set(), now: NOW });
    expect(hero?.race.id).toBe('wrc-a');
    expect(sameDay.map((item) => item.race.id)).toEqual(['wrc-a', 'nascar-a']);
  });

  it('prefere o que a pessoa segue e limita as do mesmo dia as categorias seguidas', () => {
    const { hero, sameDay } = pickHero({ categories: [f1, wrc, nascar], group: 'all', followed: new Set(['f1', 'nascar']), now: NOW });
    expect(hero?.race.id).toBe('nascar-a');
    expect(sameDay.map((item) => item.race.id)).toEqual(['nascar-a']);
  });

  it('cai em qualquer categoria quando nada seguido tem etapa pela frente', () => {
    const { hero } = pickHero({ categories: [f1, wrc], group: 'all', followed: new Set(['indy']), now: NOW });
    expect(hero?.race.id).toBe('wrc-a');
  });

  it('respeita o grupo escolhido', () => {
    const { hero } = pickHero({ categories: [f1, wrc, nascar], group: 'formulas', followed: new Set(), now: NOW });
    expect(hero?.race.id).toBe('f1-a');
    expect(pickHero({ categories: [f1], group: 'rally', followed: new Set(), now: NOW }).hero).toBeNull();
  });
});
