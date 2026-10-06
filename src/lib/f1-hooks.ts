import { useMemo } from 'react';
import {
  fetchDriverSeasonResults,
  fetchRaceResults,
  fetchStandingsAfterRound,
  fetchTeamSeasonPoints,
  type DriverResultRow,
  type RaceResultRow,
  type TeamRoundPoints,
} from '../jolpica';
import type { Category, CategoryStandings, Race } from '../types';
import { useAsync, type AsyncState } from './hooks';
import { completedRacesDesc } from './season';

// Dados extras que so a Jolpica entrega (F1). Para as outras categorias os hooks ficam em "idle".

const yearOf = (category: Category) => category.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());

export function useRaceResults(category: Category | undefined, race: Race | undefined): AsyncState<RaceResultRow[]> {
  const enabled = category?.id === 'f1' && race?.status === 'completed' && Boolean(race.round);
  return useAsync(() => fetchRaceResults(race!.date.slice(0, 4), race!.round!), [category?.id, race?.id, race?.round], enabled);
}

export function useDriverSeason(category: Category | undefined, driverId: string | undefined): AsyncState<DriverResultRow[]> {
  const enabled = category?.id === 'f1' && Boolean(driverId);
  return useAsync(() => fetchDriverSeasonResults(driverId!, yearOf(category!)), [category?.id, driverId], enabled);
}

export function useTeamPoints(category: Category | undefined, teamId: string | undefined): AsyncState<TeamRoundPoints[]> {
  const enabled = category?.id === 'f1' && Boolean(teamId);
  return useAsync(() => fetchTeamSeasonPoints(yearOf(category!), teamId!), [category?.id, teamId], enabled);
}

/**
 * Para as setas de subida/queda e o "+14 pos <etapa>" da tabela: classificacao na rodada anterior e
 * pontos feitos na ultima etapa concluida.
 */
export function useStandingsMovement(category: Category | undefined): {
  previous: AsyncState<CategoryStandings>;
  lastRace: AsyncState<RaceResultRow[]>;
  lastRaceName: string | null;
  lastRound: number | null;
} {
  const isF1 = category?.id === 'f1';
  const last = useMemo(() => (category ? completedRacesDesc(category.calendar).find((race) => race.round) : undefined), [category]);
  const lastRound = last?.round ?? null;
  const year = category ? yearOf(category) : '';

  const previous = useAsync(
    () => fetchStandingsAfterRound(category!, year, lastRound! - 1),
    [category?.id, year, lastRound],
    isF1 && lastRound != null && lastRound > 1,
  );
  const lastRace = useAsync(() => fetchRaceResults(year, lastRound!), [category?.id, year, lastRound], isF1 && lastRound != null);

  return { previous, lastRace, lastRaceName: last ? (last.enName ?? last.name) : null, lastRound };
}
