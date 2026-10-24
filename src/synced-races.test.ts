import { describe, expect, it } from 'vitest';
import type { Category, Race } from './types';
import { mergeCategoryWithSyncedCalendar, mergeCategoryWithSyncedStandings, nameFromCatalog } from './synced-races';

const race = (over: Partial<Race>): Race => ({ id: 'r', name: 'Rodada 1', location: '', circuit: '', date: '2026-10-18', status: 'upcoming', ...over });
const category = (calendar: Race[]) => ({ id: 'nascar', name: 'NASCAR', calendar, teams: [], drivers: [] }) as unknown as Category;

describe('virada de temporada', () => {
  const old = { position: 1, name: 'Piloto', points: 100, season: 2026 };
  it('remove pontuacao de reserva e rejeita a classificacao anterior', () => {
    const base = { ...category([race({})]), standings: { drivers: [old], constructors: [old] } };
    const next = mergeCategoryWithSyncedCalendar(base, [race({ date: '2027-04-01' })]);
    expect(next.standings).toBeUndefined();
    expect(mergeCategoryWithSyncedStandings(next, [old]).standings).toBeUndefined();
    expect(mergeCategoryWithSyncedStandings(next, null).standings).toBeUndefined();
    expect(mergeCategoryWithSyncedStandings(next, [{ ...old, season: 2027 }]).standings?.drivers).toHaveLength(1);
    expect(mergeCategoryWithSyncedStandings(next, [{ ...old, season: null }]).standings).toBeUndefined();
  });
  it('nao injeta etapas ou vencedores de 2026 no WEC de 2027', () => {
    const base = { ...category([race({ name: 'Spa', winner: 'Antigo' }), race({ id: 'lemans', name: 'Le Mans' })]), id: 'wec' };
    const next = mergeCategoryWithSyncedCalendar(base, [race({ name: 'Spa', date: '2027-05-01', winner: 'Novo' })]);
    expect(next.calendar).toHaveLength(1);
    expect(next.calendar[0].winner).toBe('Novo');
  });
});

describe('nomes de etapas sincronizadas', () => {
  it('troca "Rodada N" pelo nome do catalogo na mesma data', () => {
    const base = race({ id: 'phoenix', name: 'Phoenix', enName: 'Phoenix', location: 'Avondale' });
    expect(nameFromCatalog(category([base]), race({ location: '' }))).toMatchObject({ name: 'Phoenix', enName: 'Phoenix', location: 'Avondale' });
  });

  it('sem catalogo, usa o local da etapa', () => {
    expect(nameFromCatalog(category([]), race({ location: 'Talladega' }))).toMatchObject({ name: 'Talladega' });
  });

  it('nao mexe em nomes de verdade nem quando nao ha de onde tirar um nome', () => {
    const named = race({ name: '6 Horas de Monza' });
    expect(nameFromCatalog(category([]), named)).toBe(named);
    const bare = race({});
    expect(nameFromCatalog(category([]), bare)).toBe(bare);
  });

  it('o calendario mesclado passa a mostrar o nome do catalogo', () => {
    const base = race({ id: 'phoenix', name: 'Phoenix', date: '2026-10-18' });
    const merged = mergeCategoryWithSyncedCalendar(category([base]), [race({ id: 'x', date: '2026-10-18' })]);
    expect(merged.calendar[0].name).toBe('Phoenix');
  });
});
