import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { DriverCard, TeamCard } from '../components/cards';
import { EmptyState, Segmented, Skeleton } from '../components/ui';
import { findCategoryDriver, findCategoryTeam, teamOfDriver } from '../lib/entities';
import { useT } from '../lib/i18n';
import { useCategory, useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import type { Category, Driver, StandingItem, Team } from '../types';

type View = 'drivers' | 'teams';

/** Pilotos na ordem do campeonato (quem nao pontuou ainda vai depois, na ordem do catalogo). */
function orderedDrivers(category: Category): { driver: Driver; standing?: StandingItem }[] {
  const items = category.standings?.drivers ?? category.standings?.driverClasses?.[0]?.entries ?? [];
  const standingOf = new Map<string, StandingItem>();
  for (const item of items) {
    const driver = findCategoryDriver(category, item.name);
    if (driver && !standingOf.has(driver.id)) standingOf.set(driver.id, item);
  }
  return category.drivers
    .map((driver, index) => ({ driver, standing: standingOf.get(driver.id), index }))
    .sort((a, b) => (a.standing?.position ?? 9999) - (b.standing?.position ?? 9999) || a.index - b.index)
    .map(({ driver, standing }) => ({ driver, standing }));
}

/** Equipes na ordem do campeonato de construtores/equipes, quando houver. */
function orderedTeams(category: Category): Team[] {
  const items = category.standings?.constructors ?? category.standings?.teams ?? [];
  const position = new Map<string, number>();
  for (const item of items) {
    const team = findCategoryTeam(category, item.name);
    if (team && !position.has(team.id)) position.set(team.id, item.position);
  }
  return category.teams
    .map((team, index) => ({ team, pos: position.get(team.id) ?? 9999, index }))
    .sort((a, b) => a.pos - b.pos || a.index - b.index)
    .map(({ team }) => team);
}

export default function GridPage() {
  const { t } = useT();
  const { ready } = useLiveData();
  const { selectedId } = useSelectedCategory();
  const category = useCategory(selectedId);
  const [view, setView] = useState<View>('drivers');

  const drivers = useMemo(() => (category ? orderedDrivers(category) : []), [category]);
  const teams = useMemo(() => (category ? orderedTeams(category) : []), [category]);
  const season = category?.calendar[0]?.date.slice(0, 4);

  if (!category) {
    return <div className="px-margin pt-6 space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;
  }

  const empty = drivers.length === 0 && teams.length === 0;

  return (
    <div className="flex flex-col w-full px-margin pt-6 pb-8 gap-space-lg page-in">
      <header className="border-l-4 border-primary-container pl-4 space-y-1.5">
        <h1 className="type-headline-lg text-[34px] leading-9 uppercase text-on-surface">{t('grid.title')}</h1>
        <p className="type-label-badge uppercase tracking-widest text-on-surface-variant">{[category.name, season].filter(Boolean).join(' • ')}</p>
      </header>

      {empty ? (
        !ready ? (
          <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : (
          <EmptyState icon={Users} title={t('grid.title')} hint={t('grid.empty')} />
        )
      ) : (
        <>
          <Segmented
            className="self-start"
            options={[
              { value: 'drivers' as const, label: t('grid.drivers', { n: drivers.length }) },
              { value: 'teams' as const, label: t('grid.teams', { n: teams.length }) },
            ]}
            value={view}
            onChange={setView}
          />
          {view === 'drivers' ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {drivers.map(({ driver, standing }) => (
                <DriverCard key={driver.id} category={category} driver={driver} team={teamOfDriver(category, driver)} standing={standing} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
              {teams.map((team) => (
                <TeamCard key={team.id} category={category} team={team} drivers={category.drivers.filter((driver) => driver.teamId === team.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
