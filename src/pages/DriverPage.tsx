import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Trophy } from 'lucide-react';
import { BioCard, ReelBackdrop } from '../components/pit';
import { paths } from '../app/paths';
import { teamColor } from '../components/cards';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';
import { BackBar, Button, EmptyState, FactList, ListGroup, SectionTitle, Skeleton } from '../components/ui';
import { getDriverBio } from '../driver-bios';
import { countDriverTitles, formatDriverTitleYears, getDriverTitles, type DriverTitle } from '../driver-titles';
import { useTributes } from '../features/tributes/Tributes';
import { findF1Champion } from '../f1-champions';
import { flagForNationality } from '../nationality-flags';
import { driversOfTeam, findCategoryDriver, shortName, splitName, teamOfDriver } from '../lib/entities';
import { useDriverSeason } from '../lib/f1-hooks';
import { dayMonth, formatPoints } from '../lib/format';
import { useScrollTopOn } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { percent, seasonStats, teammateDuel, winsOf } from '../lib/season';
import { cn } from '../lib/utils';
import { useCategory } from '../state/live-data';
import { useSettings } from '../state/settings';
import type { Category, Driver, StandingItem } from '../types';

function standingOf(category: Category, driver: Driver): { item: StandingItem; classLabel?: string } | null {
  const s = category.standings;
  const direct = s?.drivers?.find((item) => findCategoryDriver(category, item.name)?.id === driver.id);
  if (direct) return { item: direct };
  for (const group of s?.driverClasses ?? []) {
    const hit = group.entries.find((item) => findCategoryDriver(category, item.name)?.id === driver.id);
    if (hit) return { item: hit, classLabel: group.classLabel };
  }
  return null;
}

export default function DriverPage() {
  const { categoryId, driverId } = useParams();
  useScrollTopOn(`${categoryId}/${driverId}`);
  const { t, lang } = useT();
  const toast = useToast();
  const tributes = useTributes();
  const settings = useSettings();
  const category = useCategory(categoryId);

  const fromGrid = category?.drivers.find((d) => d.id === driverId);
  const champion = categoryId === 'f1' ? findF1Champion(driverId) : undefined;
  const driver: Driver | undefined = fromGrid ?? champion;
  const championOnly = Boolean(champion) && !fromGrid;

  // Campeoes historicos (Senna, Piquet...) nao tem equipe/numero do grid atual: so o perfil de carreira.
  const team = category && driver && !championOnly ? teamOfDriver(category, driver) : undefined;
  const mate = category && team && driver ? driversOfTeam(category, team).find((d) => d.id !== driver.id) : undefined;
  const season = useDriverSeason(category, fromGrid?.id);
  const mateSeason = useDriverSeason(category, mate?.id);

  const rows = season.data ?? [];
  const stats = useMemo(() => (season.data ? seasonStats(season.data) : null), [season.data]);
  const duel = useMemo(() => (season.data && mateSeason.data ? teammateDuel(season.data, mateSeason.data) : null), [season.data, mateSeason.data]);
  const lastStages = useMemo(() => [...rows].sort((a, b) => Number(b.round) - Number(a.round)).slice(0, 3), [rows]);

  if (!category || !driver) {
    return (
      <div className="px-margin lg:px-0 pt-6">
        <EmptyState title={t('drv.notFound')} action={<Button to={categoryId ? paths.category(categoryId) : paths.categories}>{t('common.back')}</Button>} />
      </div>
    );
  }

  const color = teamColor(team);
  const standing = standingOf(category, driver);
  const wins = stats ? stats.wins : winsOf(category, driver.name).length;
  const winsList = stats ? stats.winRounds : winsOf(category, driver.name).map((r) => r.enName ?? r.name);
  const bio = getDriverBio(category.id, driver.id);
  const titles = getDriverTitles(category.id, driver.id);
  const following = settings.isFollowingDriver(category.id, driver.id);
  const { first, last } = splitName(driver.name);
  const photo = driver.cutout ?? driver.image;
  const isHamilton = driver.id === 'hamilton' && !championOnly;
  const year = category.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
  const share = standing ? percent(standing.item.points, category.standings?.drivers?.[0]?.points ?? standing.item.points) : 0;

  const toggleFollow = () => {
    if (championOnly) return;
    if (settings.toggleDriver(category.id, driver.id)) {
      toast.show(following ? t('toast.unfollowed', { name: driver.name }) : t('toast.followed', { name: driver.name }), { kind: 'ok' });
    }
  };

  return (
    <div className="px-margin lg:px-0 pb-12 page-in">
      <BackBar
        fallback={paths.category(category.id)}
        label={`${category.name} · ${championOnly ? t('drv.champion') : t('drv.season', { year })}`}
        right={
          championOnly ? null : (
            <Button variant={following ? 'primary' : 'secondary'} onClick={toggleFollow} aria-pressed={following} className={cn(following && 'bg-racing-red text-white hover:bg-racing-red/90')}>
              {following ? <BookmarkCheck className="w-[18px] h-[18px]" /> : <Bookmark className="w-[18px] h-[18px]" />}
              {following ? t('common.following') : t('drv.follow')}
            </Button>
          )
        }
      />

      <div className="mt-2 lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 lg:sticky lg:top-8 lg:self-start">
          <div
            className="relative h-[26rem] lg:h-[34rem] rounded-3xl overflow-hidden border border-hairline select-none"
            onClick={isHamilton ? tributes.onHamiltonTap : undefined}
            onMouseDown={isHamilton ? tributes.onHamiltonHoldStart : undefined}
            onMouseUp={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
            onMouseLeave={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
            onTouchStart={isHamilton ? tributes.onHamiltonHoldStart : undefined}
            onTouchEnd={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
            onTouchCancel={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
          >
            <ReelBackdrop categoryId={category.id} hue={championOnly ? '#6f6f78' : color} bare />
            {photo ? (
              <img
                src={photo}
                alt={driver.name}
                referrerPolicy="no-referrer"
                className={cn(
                  'absolute top-0 inset-x-0 w-full',
                  championOnly ? 'h-[72%] object-contain p-2' : driver.cutout ? 'h-[80%] object-contain object-bottom' : 'h-[80%] object-cover object-top',
                )}
              />
            ) : (
              <div className="absolute top-0 inset-x-0 h-[70%] flex items-center justify-center"><Avatar name={driver.name} size={96} /></div>
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.85) 28%, transparent 62%)' }} aria-hidden />

            <div className="absolute bottom-0 inset-x-0 px-5 pb-6 space-y-1.5 pointer-events-none">
              <h1 className="text-[2.25rem] lg:text-[2.75rem] leading-[1] font-extrabold tracking-[-0.035em] text-white text-balance">
                {first && <span className="block text-[1.25rem] lg:text-[1.5rem] font-bold tracking-[-0.02em] text-silver">{first}</span>}
                {last}
              </h1>
              <p className="type-body-md text-silver flex items-center gap-x-3 gap-y-1 flex-wrap">
                {championOnly ? (
                  <span className="text-white font-semibold">{t('drv.champion')}</span>
                ) : (
                  team && (
                    <Link to={paths.team(category.id, team.id)} className="pointer-events-auto inline-flex items-center gap-2 text-white font-semibold hover:underline underline-offset-4">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {team.name}
                    </Link>
                  )
                )}
                {driver.nationality && <span>{flagForNationality(driver.nationality)} {driver.nationality}</span>}
                {driver.number && !championOnly && <span className="tabular">#{driver.number}</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 mt-8 lg:mt-0 space-y-10 min-w-0">
          <section>
            {championOnly && champion ? (
              <FactList
                items={[
                  { label: t('drv.titles'), value: `${champion.championYears.length} · ${champion.championYears.join(', ')}` },
                  { label: t('drv.wins'), value: champion.careerWins },
                  { label: t('drv.podiums'), value: champion.careerPodiums },
                  { label: t('drv.poles'), value: champion.careerPoles },
                ]}
              />
            ) : (
              <FactList
                items={[
                  { label: t('drv.position'), value: standing ? `P${standing.item.position}${standing.classLabel ? ` · ${standing.classLabel}` : ''}` : '—' },
                  { label: t('drv.points'), value: standing ? `${formatPoints(standing.item.points)} · ${Math.round(share)}% ${t('drv.ofLeader')}` : '—' },
                  { label: t('drv.wins'), value: wins > 0 ? `${wins} · ${winsList.slice(0, 2).map(shortGp).join(', ')}` : wins },
                  { label: t('drv.podiums'), value: stats ? `${stats.podiums} · ${t('drv.rate', { n: Math.round(stats.podiumRate * 100) })}` : '—' },
                ]}
              />
            )}
          </section>

          {duel && mate && (duel.grid.total > 0 || duel.race.total > 0) && (
            <section className="space-y-3">
              <SectionTitle right={t('drv.vs', { name: shortName(mate.name) })}>{t('drv.duel')}</SectionTitle>
              <div className="bg-asphalt border border-hairline rounded-2xl p-4 flex flex-col gap-5">
                <DuelBar title={t('drv.duelGrid')} mineName={driver.name} mateName={mate.name} mine={duel.grid.mine} theirs={duel.grid.theirs} total={duel.grid.total} />
                <DuelBar title={t('drv.duelRace')} mineName={driver.name} mateName={mate.name} mine={duel.race.mine} theirs={duel.race.theirs} total={duel.race.total} />
              </div>
            </section>
          )}

          {season.status === 'loading' && !season.data && <Skeleton className="h-40" />}
          {lastStages.length > 0 && (
            <section className="space-y-3">
              <SectionTitle right={`R${lastStages.at(-1)?.round} - R${lastStages[0].round}`}>{t('drv.lastStages')}</SectionTitle>
              <ListGroup>
                {lastStages.map((row) => {
                  const race = category.calendar.find((r) => String(r.round) === row.round);
                  const finish = row.finishPosition;
                  return (
                    <Link key={row.round} to={race ? paths.race(category.id, race.id) : paths.category(category.id)} className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="type-body-md font-semibold text-white truncate">
                          {race ? (lang === 'en' ? race.enName ?? race.name : race.name) : row.raceName}
                          {row.grid === 1 && <span className="ml-2 type-label-badge text-silver font-medium">{t('drv.pole')}</span>}
                        </span>
                        <span className="type-body-sm text-silver truncate">{dayMonth(new Date(`${row.date}T12:00:00`), lang)}{race?.circuit ? ` · ${race.circuit}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-5 text-right shrink-0">
                        <Cell label={t('drv.grid')} value={row.grid ? `P${row.grid}` : '—'} />
                        <Cell label={t('drv.finish')} value={finish ? `P${finish}` : 'DNF'} strong tone={finish != null && finish <= 3 ? 'text-tertiary' : undefined} />
                        <Cell label={t('drv.pts')} value={`+${formatPoints(row.points)}`} strong />
                      </div>
                    </Link>
                  );
                })}
              </ListGroup>
            </section>
          )}

          {stats && stats.races > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('drv.telemetry')}</SectionTitle>
              <FactList
                items={[
                  { label: t('drv.fastLaps'), value: stats.fastestLaps },
                  { label: t('drv.poles'), value: stats.poles },
                  { label: t('drv.avgFinish'), value: stats.averageFinish ? stats.averageFinish.toFixed(1) : '—' },
                  { label: t('drv.dnf'), value: stats.dnfs },
                ]}
              />
            </section>
          )}

          {championOnly && champion && (
            <section className="space-y-3">
              <SectionTitle>{t('drv.careerTeams')}</SectionTitle>
              <ListGroup>
                {champion.teams.map((stint) => (
                  <div key={`${stint.name}-${stint.years}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="type-body-md font-semibold text-white truncate">{stint.name}</p>
                      {stint.series && <p className="type-body-sm text-silver">{stint.series[lang]}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="type-label-badge text-silver tabular">{stint.years}</p>
                      {stint.championYears && <p className="type-label-badge text-white tabular">{stint.championYears.join(', ')}</p>}
                    </div>
                  </div>
                ))}
              </ListGroup>
              <Button to={paths.champions} variant="ghost">{t('cat.champions')} →</Button>
            </section>
          )}

          {(bio || titles.length > 0) && (
            <section className="space-y-4">
              <SectionTitle>{t('drv.bio')}</SectionTitle>
              {titles.length > 0 && <TitlesBlock titles={titles} lang={lang} />}
              {bio && <BioCard text={lang === 'en' ? bio.en : bio.pt} />}
            </section>
          )}

          {team && !championOnly && (
            <Link to={paths.team(category.id, team.id)} className="flex items-center gap-4 rounded-2xl bg-asphalt border border-hairline p-4 hover:border-white/40 transition-colors">
              <Avatar src={team.badge} name={team.name} size={44} square fit="contain" />
              <div className="min-w-0 flex-1">
                <p className="type-body-sm text-silver">{t('drv.team')}</p>
                <p className="type-headline-sm text-white truncate">{team.name}</p>
              </div>
              <span className="type-label-badge text-white">{t('common.open')} →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Titulos: a contagem aparece no titulo do bloco e cada campeonato vem em uma linha, com os anos. */
function TitlesBlock({ titles, lang }: { titles: DriverTitle[]; lang: 'pt' | 'en' }) {
  const { t } = useT();
  return (
    <div className="space-y-2">
      <h3 className="type-headline-sm text-white flex items-center gap-2">
        <Trophy className="w-[18px] h-[18px]" aria-hidden />
        {countDriverTitles(titles)} {t('drv.titles').toLowerCase()}
      </h3>
      <ListGroup>
        {titles.map((title) => (
          <div key={`${title.pt}-${title.years.join()}`} className="px-4 py-3">
            <p className="type-body-md font-semibold text-white">{lang === 'en' ? title.en : title.pt}</p>
            {formatDriverTitleYears(title.years) && <p className="type-body-sm text-silver tabular">{formatDriverTitleYears(title.years)}</p>}
          </div>
        ))}
      </ListGroup>
    </div>
  );
}

const shortGp = (name: string) => name.replace(/\s*(Grand Prix|GP)\s*$/i, '').replace(/^GP (de|da|do|dos|das) /i, '');

function Cell({ label, value, strong = false, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.25rem]">
      <span className="type-label-telemetry text-silver">{label}</span>
      <span className={cn('tabular', strong ? 'type-headline-sm' : 'type-body-sm font-semibold', tone ?? (strong ? 'text-white' : 'text-silver'))}>{value}</span>
    </div>
  );
}

function DuelBar({ title, mineName, mateName, mine, theirs, total }: { title: string; mineName: string; mateName: string; mine: number; theirs: number; total: number }) {
  if (total === 0) return null;
  const myShare = percent(mine, total);
  return (
    <div>
      <div className="flex justify-between items-center mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="type-headline-sm text-white tabular">{mine}</span>
          <span className="type-body-sm text-white font-medium truncate">{shortName(mineName)}</span>
        </div>
        <span className="type-label-badge text-silver text-center">{title}</span>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="type-body-sm text-silver font-medium truncate">{mateName.split(' ').at(-1)}</span>
          <span className="type-headline-sm text-silver tabular">{theirs}</span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden flex" role="img" aria-label={`${myShare.toFixed(0)}%`}>
        <div className="h-full bg-white transition-[width] duration-700" style={{ width: `${myShare}%` }} />
      </div>
    </div>
  );
}
