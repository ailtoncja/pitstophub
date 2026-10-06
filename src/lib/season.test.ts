import { describe, expect, it } from 'vitest';
import type { DriverResultRow } from '../jolpica';
import type { Race, StandingItem } from '../types';
import { buildStandingRows, completedRacesDesc, cumulativePoints, nextRace, percent, roundNumber, seasonStats, teammateDuel, upcomingRaces } from './season';

const race = (id: string, date: string, status: Race['status'], extra: Partial<Race> = {}): Race => ({
  id,
  name: id,
  location: id,
  date,
  circuit: id,
  status,
  ...extra,
});

const calendar: Race[] = [
  race('a', '2026-03-08', 'completed'),
  race('b', '2026-09-27', 'completed'),
  race('c', '2026-10-11', 'upcoming'),
  race('d', '2026-10-25', 'upcoming'),
  race('e', '2026-11-01', 'cancelled'),
];

const NOW = new Date('2026-10-04T12:00:00').getTime();

describe('calendario', () => {
  it('acha a proxima etapa e lista as futuras em ordem', () => {
    expect(nextRace(calendar, NOW)?.id).toBe('c');
    expect(upcomingRaces(calendar, NOW).map((r) => r.id)).toEqual(['c', 'd']);
  });

  it('ignora etapa marcada como futura que ja passou ha mais de um dia', () => {
    const stale = [race('x', '2026-09-01', 'upcoming'), race('y', '2026-10-20', 'upcoming')];
    expect(nextRace(stale, NOW)?.id).toBe('y');
  });

  it('mantem uma etapa de hoje ainda como proxima', () => {
    expect(nextRace([race('hoje', '2026-10-04', 'upcoming')], NOW)?.id).toBe('hoje');
  });

  it('devolve as concluidas da mais recente para a mais antiga', () => {
    expect(completedRacesDesc(calendar).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('numera a rodada pela fonte ou pela posicao sem contar canceladas', () => {
    expect(roundNumber(calendar, calendar[2])).toBe(3);
    expect(roundNumber(calendar, race('z', '2026-12-01', 'upcoming', { round: 17 }))).toBe(17);
  });
});

describe('classificacao', () => {
  const items: StandingItem[] = [
    { position: 1, name: 'Kimi Antonelli', points: 320 },
    { position: 3, name: 'Lewis Hamilton', points: 214 },
    { position: 2, name: 'George Russell', points: 236 },
  ];

  it('ordena, calcula diferenca para o lider e fracao de pontos', () => {
    const rows = buildStandingRows(items);
    expect(rows.map((r) => r.name)).toEqual(['Kimi Antonelli', 'George Russell', 'Lewis Hamilton']);
    expect(rows[0]).toMatchObject({ gap: 0, share: 1, delta: null, lastRacePoints: null });
    expect(rows[1].gap).toBe(84);
    expect(rows[1].share).toBeCloseTo(236 / 320);
  });

  it('mostra quantas posicoes subiu ou caiu desde a rodada anterior', () => {
    const previous: StandingItem[] = [
      { position: 1, name: 'Kimi Antonelli', points: 295 },
      { position: 2, name: 'Lewis Hamilton', points: 199 },
      { position: 3, name: 'George Russell', points: 218 },
    ];
    const rows = buildStandingRows(items, previous, new Map([['Lewis Hamilton', 15]]));
    expect(rows.find((r) => r.name === 'George Russell')?.delta).toBe(1);
    expect(rows.find((r) => r.name === 'Lewis Hamilton')?.delta).toBe(-1);
    expect(rows.find((r) => r.name === 'Lewis Hamilton')?.lastRacePoints).toBe(15);
    expect(rows.find((r) => r.name === 'George Russell')?.lastRacePoints).toBe(0);
  });
});

const row = (round: string, grid: number | null, finishPosition: number | null, points: number, status = 'Finished', fastestLapRank: number | null = null): DriverResultRow => ({
  round,
  raceName: `GP ${round}`,
  date: '2026-01-01',
  grid,
  finishPosition,
  points,
  status,
  fastestLapRank,
});

describe('piloto', () => {
  const mine = [row('1', 1, 1, 25, 'Finished', 1), row('2', 3, 2, 18), row('3', 5, null, 0, 'Engine'), row('4', 2, 6, 8, '+1 Lap')];

  it('resume a temporada', () => {
    const stats = seasonStats(mine);
    expect(stats).toMatchObject({ races: 4, wins: 1, podiums: 2, poles: 1, fastestLaps: 1, dnfs: 1, points: 51, bestFinish: 1 });
    expect(stats.podiumRate).toBeCloseTo(0.5);
    expect(stats.averageFinish).toBeCloseTo((1 + 2 + 6) / 3);
    expect(stats.winRounds).toEqual(['GP 1']);
  });

  it('nao quebra sem corridas', () => {
    expect(seasonStats([])).toMatchObject({ races: 0, podiumRate: 0, bestFinish: null, averageFinish: null });
  });

  it('compara com o companheiro de equipe so nas etapas em comum', () => {
    const mate = [row('1', 2, 3, 15), row('2', 1, 1, 25), row('3', 6, 5, 10), row('9', 4, 4, 12)];
    const duel = teammateDuel(mine, mate);
    expect(duel.grid).toEqual({ mine: 2, theirs: 1, total: 3 });
    expect(duel.race).toEqual({ mine: 1, theirs: 1, total: 2 });
  });
});

describe('equipe e util', () => {
  it('acumula os pontos por etapa', () => {
    expect(
      cumulativePoints([
        { round: 1, raceName: 'A', points: 28 },
        { round: 2, raceName: 'B', points: 10 },
      ]).map((p) => p.total),
    ).toEqual([28, 38]);
  });

  it('calcula porcentagem sem dividir por zero', () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(3, 0)).toBe(0);
  });
});
