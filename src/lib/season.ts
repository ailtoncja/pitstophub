import type { Category, Race, StandingItem } from '../types';
import type { DriverResultRow, RaceResultRow, TeamRoundPoints } from '../jolpica';
import { raceStartDate } from '../race-time';
import { findCategoryDriver, raceWonByDriver, winnerNameParts } from './entities';

// ─── Calendario ───────────────────────────────────────────────────────────────

const byStart = (a: Race, b: Race) => raceStartDate(a).getTime() - raceStartDate(b).getTime();

/** Proxima etapa ainda por vir (ou em andamento). */
export function nextRace(calendar: Race[], now = Date.now()): Race | null {
  const pending = calendar.filter((race) => race.status === 'upcoming').sort(byStart);
  // Uma etapa "upcoming" cuja data ja passou ha mais de um dia e dado desatualizado, nao a proxima.
  return pending.find((race) => raceStartDate(race).getTime() + 36 * 3600_000 > now) ?? null;
}

export function upcomingRaces(calendar: Race[], now = Date.now()): Race[] {
  return calendar
    .filter((race) => race.status === 'upcoming' && raceStartDate(race).getTime() + 36 * 3600_000 > now)
    .sort(byStart);
}

export function completedRacesDesc(calendar: Race[]): Race[] {
  return calendar.filter((race) => race.status === 'completed').sort((a, b) => byStart(b, a));
}

/** Numero da rodada: o da fonte, ou a posicao no calendario sem etapas canceladas. */
export function roundNumber(calendar: Race[], race: Race): number {
  if (race.round) return race.round;
  const valid = calendar.filter((r) => r.status !== 'cancelled');
  const index = valid.findIndex((r) => r.id === race.id);
  return index >= 0 ? index + 1 : 0;
}

export function monthKey(race: Race): string {
  return race.date.slice(0, 7); // "2026-10"
}

// ─── Classificacao ────────────────────────────────────────────────────────────

export type StandingRow = StandingItem & {
  /** Pontos a menos que o lider (0 para o lider). */
  gap: number;
  /** Fracao dos pontos do lider (0..1), para a barra de desempenho. */
  share: number;
  /** Posicoes ganhas (+) ou perdidas (-) desde a rodada anterior; null quando nao ha dado. */
  delta: number | null;
  /** Pontos feitos na ultima etapa; null quando nao ha dado. */
  lastRacePoints: number | null;
};

export function buildStandingRows(
  items: StandingItem[],
  previous?: StandingItem[] | null,
  lastRacePoints?: Map<string, number> | null,
): StandingRow[] {
  const sorted = [...items].sort((a, b) => a.position - b.position || b.points - a.points);
  const leaderPoints = sorted[0]?.points ?? 0;
  const previousPosition = new Map((previous ?? []).map((item) => [item.name, item.position]));
  return sorted.map((item) => {
    const before = previousPosition.get(item.name);
    return {
      ...item,
      gap: Math.max(0, leaderPoints - item.points),
      share: leaderPoints > 0 ? item.points / leaderPoints : 0,
      delta: before == null ? null : before - item.position,
      lastRacePoints: lastRacePoints ? lastRacePoints.get(item.name) ?? 0 : null,
    };
  });
}

/** Vitorias de um piloto contadas no calendario (qualquer categoria). */
export function winsOf(category: Category, driverName: string): Race[] {
  return category.calendar.filter((race) => raceWonByDriver(race, driverName));
}

/** Vitorias de uma equipe: etapas ganhas por qualquer um dos seus pilotos. */
export function teamWins(category: Category, teamId: string): Race[] {
  const names = category.drivers.filter((driver) => driver.teamId === teamId).map((driver) => driver.name);
  return category.calendar.filter((race) => race.winner && winnerNameParts(race.winner).some((part) => names.includes(part)));
}

export function standingFor(items: StandingItem[] | undefined, name: string): StandingItem | undefined {
  return items?.find((item) => item.name === name);
}

// ─── Piloto: temporada e duelo ────────────────────────────────────────────────

export type SeasonStats = {
  races: number;
  wins: number;
  podiums: number;
  podiumRate: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  points: number;
  bestFinish: number | null;
  averageFinish: number | null;
  winRounds: string[];
};

const isClassified = (status: string) => /^(finished|\+\d+ laps?|lapped)$/i.test(status.trim());

export function seasonStats(rows: DriverResultRow[]): SeasonStats {
  const finishes = rows.map((row) => row.finishPosition).filter((n): n is number => n != null && n > 0);
  const wins = rows.filter((row) => row.finishPosition === 1);
  const podiums = rows.filter((row) => row.finishPosition != null && row.finishPosition >= 1 && row.finishPosition <= 3).length;
  return {
    races: rows.length,
    wins: wins.length,
    podiums,
    podiumRate: rows.length ? podiums / rows.length : 0,
    poles: rows.filter((row) => row.grid === 1).length,
    fastestLaps: rows.filter((row) => row.fastestLapRank === 1).length,
    dnfs: rows.filter((row) => row.status !== '' && !isClassified(row.status)).length,
    points: rows.reduce((sum, row) => sum + row.points, 0),
    bestFinish: finishes.length ? Math.min(...finishes) : null,
    averageFinish: finishes.length ? finishes.reduce((a, b) => a + b, 0) / finishes.length : null,
    winRounds: wins.map((row) => row.raceName),
  };
}

export type Duel = { mine: number; theirs: number; total: number };

/**
 * Confronto direto com o companheiro de equipe nas etapas em que os dois largaram/terminaram.
 * Grid = quem largou na frente (reflete a classificacao); corrida = quem chegou na frente.
 */
export function teammateDuel(mine: DriverResultRow[], mate: DriverResultRow[]): { grid: Duel; race: Duel } {
  const mateByRound = new Map(mate.map((row) => [row.round, row]));
  const grid: Duel = { mine: 0, theirs: 0, total: 0 };
  const race: Duel = { mine: 0, theirs: 0, total: 0 };
  for (const row of mine) {
    const other = mateByRound.get(row.round);
    if (!other) continue;
    if (row.grid && other.grid) {
      grid.total += 1;
      if (row.grid < other.grid) grid.mine += 1;
      else if (other.grid < row.grid) grid.theirs += 1;
    }
    if (row.finishPosition && other.finishPosition) {
      race.total += 1;
      if (row.finishPosition < other.finishPosition) race.mine += 1;
      else if (other.finishPosition < row.finishPosition) race.theirs += 1;
    }
  }
  return { grid, race };
}

export function percent(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

// ─── Equipe: evolucao do campeonato ───────────────────────────────────────────

export function cumulativePoints(rounds: TeamRoundPoints[]): { round: number; raceName: string; total: number }[] {
  let total = 0;
  return rounds.map((entry) => {
    total += entry.points;
    return { round: entry.round, raceName: entry.raceName, total };
  });
}

// ─── Resultado de corrida ─────────────────────────────────────────────────────

export type RaceHighlights = {
  pole: RaceResultRow | null;
  fastestLap: RaceResultRow | null;
  winner: RaceResultRow | null;
};

export function raceHighlights(rows: RaceResultRow[]): RaceHighlights {
  return {
    pole: rows.find((row) => row.grid === 1) ?? null,
    fastestLap: rows.find((row) => row.fastestLapRank === 1) ?? null,
    winner: rows.find((row) => row.position === '1') ?? null,
  };
}

/** Mapa nome -> pontos da ultima etapa, para o "+14 pos X" da tabela. */
export function pointsByDriver(rows: RaceResultRow[]): Map<string, number> {
  return new Map(rows.map((row) => [row.driverName, row.points]));
}

export function pointsByTeam(rows: RaceResultRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.teamName, (map.get(row.teamName) ?? 0) + row.points);
  return map;
}

/** Piloto da categoria que venceu a etapa (para foto e cor na lista de concluidas). */
export function raceWinnerDriver(category: Category, race: Race) {
  return findCategoryDriver(category, race.winner);
}
