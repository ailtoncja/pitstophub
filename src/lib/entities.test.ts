import { describe, expect, it } from 'vitest';
import type { Category } from '../types';
import { driverCode, driversOfTeam, findCategoryDriver, findCategoryTeam, followKey, normalize, shortName, splitName, winnerNameParts } from './entities';

const category = {
  id: 'f1',
  name: 'F1',
  teams: [
    { id: 'mclaren', name: 'McLaren', color: '#ff8000' },
    { id: 'ferrari', name: 'Scuderia Ferrari', color: '#dc0000' },
  ],
  drivers: [
    { id: 'piastri', name: 'Oscar Piastri', number: '81', nationality: 'Austrália', teamId: 'mclaren' },
    { id: 'norris', name: 'Lando Norris', number: '1', nationality: 'Reino Unido', teamId: 'mclaren' },
    { id: 'leclerc', name: 'Charles Leclerc', number: '16', nationality: 'Mônaco', teamId: 'ferrari' },
  ],
  calendar: [],
} as unknown as Category;

describe('entities', () => {
  it('normaliza acentos, pontuacao e caixa', () => {
    expect(normalize('  São Paulo — GP! ')).toBe('sao paulo gp');
  });

  it('separa duplas de vencedores', () => {
    expect(winnerNameParts('Lucas Auer / Maro Engel')).toEqual(['Lucas Auer', 'Maro Engel']);
    expect(winnerNameParts('Lando Norris')).toEqual(['Lando Norris']);
  });

  it('acha o piloto pelo nome completo, abreviado ou dentro de uma dupla', () => {
    expect(findCategoryDriver(category, 'Lando Norris')?.id).toBe('norris');
    expect(findCategoryDriver(category, 'L. Norris')?.id).toBe('norris');
    expect(findCategoryDriver(category, 'Oscar Piastri / Fulano')?.id).toBe('piastri');
    expect(findCategoryDriver(category, 'Ninguem')).toBeUndefined();
    expect(findCategoryDriver(category, undefined)).toBeUndefined();
  });

  it('acha a equipe por nome parcial', () => {
    expect(findCategoryTeam(category, 'Ferrari')?.id).toBe('ferrari');
    expect(findCategoryTeam(category, 'McLaren')?.id).toBe('mclaren');
    expect(findCategoryTeam(category, 'Williams')).toBeUndefined();
  });

  it('lista os pilotos da equipe pelo numero do carro', () => {
    const mclaren = category.teams[0];
    expect(driversOfTeam(category, mclaren).map((d) => d.id)).toEqual(['norris', 'piastri']);
  });

  it('gera codigo, nome curto e partes do nome', () => {
    expect(driverCode('Max Verstappen')).toBe('VER');
    expect(shortName('Max Verstappen')).toBe('M. Verstappen');
    expect(shortName('Pele')).toBe('Pele');
    expect(splitName('Lewis Carl Davidson Hamilton')).toEqual({ first: 'Lewis Carl Davidson', last: 'Hamilton' });
    expect(splitName('Pele')).toEqual({ first: '', last: 'Pele' });
  });

  it('monta a chave de quem a pessoa segue', () => {
    expect(followKey('f1', 'norris')).toBe('f1::norris');
  });
});
