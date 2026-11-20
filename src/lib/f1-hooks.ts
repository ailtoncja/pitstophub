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
import { fetchEngineRaceResults } from '../api-motorsports';
import { isBrasilCategory } from '../brasil-live';
import { isCategorySynced } from '../synced-races';
import type { Category, CategoryStandings, Race } from '../types';
import { useAsync, type AsyncState } from './hooks';
import { completedRacesDesc } from './season';

// F1 vem da Jolpica; resultados de etapa das 11 categorias do motor vem da api-motorsports.

const yearOf = (category: Category) => category.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());

export function useRaceResults(category: Category | undefined, race: Race | undefined): AsyncState<RaceResultRow[]> {
  const isF1 = category?.id === 'f1';
  const isEngine = Boolean(category && (isCategorySynced(category.id) || isBrasilCategory(category.id)));
  const enabled =
    race?.status === 'completed' &&
    ((isF1 && Boolean(race.round)) || (isEngine && Boolean(race.id)));

  return useAsync(
    () => (isF1 ? fetchRaceResults(race!.date.slice(0, 4), race!.round!) : fetchEngineRaceResults(category!.id, race!.id)),
    [category?.id, race?.id, race?.round],
    enabled,
  );
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
