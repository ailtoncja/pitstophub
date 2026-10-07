import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Gauge, Timer, TriangleAlert, Trophy } from 'lucide-react';
import { BioCard } from '../components/pit';
import { paths } from '../app/paths';
import { teamColor } from '../components/cards';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';
import { EmptyState, ListGroup, LiveDot, SectionTitle, Skeleton, StatTile } from '../components/ui';
import { getDriverBio } from '../driver-bios';
import { countDriverTitles, formatDriverTitleYears, getDriverTitles, type DriverTitle } from '../driver-titles';
import { useTributes } from '../features/tributes/Tributes';
import { findF1Champion } from '../f1-champions';
import { flagForNationality } from '../nationality-flags';
import { driversOfTeam, findCategoryDriver, shortName, splitName, teamOfDriver } from '../lib/entities';
import { useDriverSeason } from '../lib/f1-hooks';
import { dayMonth, formatPoints, ordinal } from '../lib/format';
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
  const navigate = useNavigate();
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
      <div className="px-margin pt-6">
        <EmptyState title={t('drv.notFound')} action={<Link to={categoryId ? paths.category(categoryId) : paths.categories} className="px-4 py-1.5 rounded-lg bg-surface-raised text-text-primary type-label-badge uppercase tracking-wider">{t('common.back')}</Link>} />
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
    <div className="flex flex-col w-full pb-10 page-in">
      <div className="px-margin pt-space-sm pb-space-xs flex items-center justify-between">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.category(category.id)))} aria-label={t('common.back')} className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-space-xs">
          <LiveDot />
          <span className="type-label-telemetry uppercase tracking-widest text-text-muted">{championOnly ? t('drv.champion') : t('drv.season', { year })}</span>
        </div>
        {championOnly ? (
          <span className="w-10 h-10" />
        ) : (
          <button type="button" onClick={toggleFollow} aria-pressed={following} aria-label={t('drv.follow')} className={cn('w-10 h-10 -mr-2 rounded-xl flex items-center justify-center active:scale-90 transition-all', following ? 'text-racing-red' : 'text-text-secondary hover:text-racing-red')}>
            {following ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg">
        <div className="lg:col-span-5">
          <div className="px-margin mb-space-md">
            <div
              className="relative h-[400px] lg:h-[470px] rounded-lg overflow-hidden border border-hairline select-none"
              style={{ background: `linear-gradient(135deg, ${color}80 0%, #15151e 55%, #000 100%)` }}
              onClick={isHamilton ? tributes.onHamiltonTap : undefined}
              onMouseDown={isHamilton ? tributes.onHamiltonHoldStart : undefined}
              onMouseUp={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
              onMouseLeave={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
              onTouchStart={isHamilton ? tributes.onHamiltonHoldStart : undefined}
              onTouchEnd={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
              onTouchCancel={isHamilton ? tributes.onHamiltonHoldEnd : undefined}
            >
              <div className="absolute inset-0 carbon-lines pointer-events-none" aria-hidden />
              {driver.number && driver.number !== '--' && !championOnly && (
                <span className="absolute top-2 right-3 type-display-hero text-[120px] leading-[120px] text-white/[0.07] pointer-events-none" aria-hidden>{driver.number}</span>
              )}
              {photo ? (
                <img
                  src={photo}
                  alt={driver.name}
                  referrerPolicy="no-referrer"
                  className={cn(
                    'absolute top-0 inset-x-0 w-full opacity-95',
                    championOnly ? 'h-[72%] object-contain p-2' : driver.cutout ? 'h-[78%] object-contain object-bottom' : 'h-[78%] object-cover object-top',
                  )}
                />
              ) : (
                <div className="absolute top-0 inset-x-0 h-[70%] flex items-center justify-center"><Avatar name={driver.name} size={96} /></div>
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 85%, #000 100%)' }} aria-hidden />
              <span className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: championOnly ? '#e10600' : color }} aria-hidden />

              <div className="absolute bottom-0 inset-x-0 pl-[22px] pr-5 pb-5 space-y-1.5 pointer-events-none">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {championOnly ? (
                    <span className="type-label-badge uppercase tracking-wider text-primary">{t('drv.champion')}</span>
                  ) : (
                    team && (
                      <Link to={paths.team(category.id, team.id)} className="pointer-events-auto flex items-center gap-2 type-label-badge uppercase tracking-wider text-on-surface hover:text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {team.name}
                      </Link>
                    )
                  )}
                  {driver.nationality && (
                    <span className="type-label-telemetry uppercase text-on-surface-variant">{flagForNationality(driver.nationality)} {driver.nationality}</span>
                  )}
                </div>
                {first && <p className="type-headline-md text-[20px] uppercase text-white leading-6">{first}</p>}
                <div className="flex items-end gap-2">
                  <h1 className="type-display-hero text-[44px] leading-[46px] uppercase text-primary-container min-w-0 break-words">{last}</h1>
                  {driver.number && !championOnly && <span className="type-telemetry-counter text-[22px] text-on-surface-variant pb-0.5">#{driver.number}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 lg:pt-space-md">
          {/* NUMEROS */}
          <section className="px-margin mb-space-lg">
            {championOnly && champion ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label={t('drv.titles')} value={champion.championYears.length} accent sub={champion.championYears.join(', ')} />
                <StatTile label={t('drv.wins')} value={champion.careerWins} sub={t('drv.career')} />
                <StatTile label={t('drv.podiums')} value={champion.careerPodiums} sub={t('drv.career')} />
                <StatTile label={t('drv.poles')} value={champion.careerPoles} sub={t('drv.career')} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label={t('drv.position')} value={standing ? `P${standing.item.position}` : '—'} accent={standing?.item.position === 1} sub={standing?.classLabel ?? t('drv.world')} />
                <StatTile label={t('drv.points')} value={standing ? formatPoints(standing.item.points) : '—'} sub={standing ? `${Math.round(share)}% ${t('drv.ofLeader')}` : undefined} />
                <StatTile label={t('drv.wins')} value={wins} accent={wins > 0} sub={winsList.slice(0, 2).map(shortGp).join(', ') || undefined} />
                <StatTile label={t('drv.podiums')} value={stats ? stats.podiums : '—'} sub={stats ? t('drv.rate', { n: Math.round(stats.podiumRate * 100) }) : undefined} />
              </div>
            )}
          </section>

          {/* DUELO INTERNO */}
          {duel && mate && (duel.grid.total > 0 || duel.race.total > 0) && (
            <section className="px-margin mb-space-lg">
              <SectionTitle bar right={t('drv.vs', { name: shortName(mate.name) })}>{t('drv.duel')}</SectionTitle>
              <div className="bg-asphalt border border-hairline rounded-lg p-space-md flex flex-col gap-4 mt-2">
                <DuelBar title={t('drv.duelGrid')} mineName={driver.name} mateName={mate.name} mine={duel.grid.mine} theirs={duel.grid.theirs} total={duel.grid.total} />
                <DuelBar title={t('drv.duelRace')} mineName={driver.name} mateName={mate.name} mine={duel.race.mine} theirs={duel.race.theirs} total={duel.race.total} />
              </div>
            </section>
          )}

          {/* ULTIMAS ETAPAS */}
          {season.status === 'loading' && !season.data && <div className="px-margin mb-space-lg"><Skeleton className="h-40" /></div>}
          {lastStages.length > 0 && (
            <section className="px-margin mb-space-lg">
              <SectionTitle bar right={`R${lastStages.at(-1)?.round} - R${lastStages[0].round}`}>{t('drv.lastStages')}</SectionTitle>
              <ListGroup className="mt-2">
                {lastStages.map((row) => {
                  const race = category.calendar.find((r) => String(r.round) === row.round);
                  const finish = row.finishPosition;
                  const tone = finish != null && finish <= 3 ? 'bg-tertiary' : row.points > 0 ? 'bg-racing-red' : 'bg-surface-bright';
                  return (
                    <Link key={row.round} to={race ? paths.race(category.id, race.id) : paths.category(category.id)} className="p-3 flex items-center justify-between gap-3 hover:bg-surface-container/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('w-1.5 h-8 rounded-full shrink-0', tone)} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="type-body-md font-bold text-text-primary truncate">{race ? (lang === 'en' ? race.enName ?? race.name : race.name) : row.raceName}</span>
                            {row.grid === 1 && <span className="type-label-telemetry text-racing-red px-1 rounded bg-racing-red/10 uppercase">{t('drv.pole')}</span>}
                          </div>
                          <span className="type-label-telemetry text-text-muted mt-0.5 truncate uppercase">{dayMonth(new Date(`${row.date}T12:00:00`), lang)} • {race?.circuit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <Cell label={t('drv.grid')} value={row.grid ? `P${row.grid}` : '—'} />
                        <Cell label={t('drv.finish')} value={finish ? `P${finish}` : 'DNF'} strong />
                        <Cell label={t('drv.pts')} value={`+${formatPoints(row.points)}`} tone="text-racing-red" strong />
                      </div>
                    </Link>
                  );
                })}
              </ListGroup>
            </section>
          )}

          {/* TELEMETRIA DE TEMPORADA */}
          {stats && stats.races > 0 && (
            <section className="px-margin mb-space-lg">
              <SectionTitle bar>{t('drv.telemetry')}</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <Tile icon={<Timer className="w-[18px] h-[18px]" />} tag="FL" value={stats.fastestLaps} label={t('drv.fastLaps')} />
                <Tile icon={<Trophy className="w-[18px] h-[18px]" />} tag="P1" value={stats.poles} label={t('drv.poles')} />
                <Tile icon={<Gauge className="w-[18px] h-[18px]" />} tag="AVG" value={stats.averageFinish ? stats.averageFinish.toFixed(1) : '—'} label={t('drv.avgFinish')} />
                <Tile icon={<TriangleAlert className="w-[18px] h-[18px]" />} tag="DNF" value={stats.dnfs} label={t('drv.dnf')} red />
              </div>
            </section>
          )}

          {/* CARREIRA DE CAMPEAO */}
          {championOnly && champion && (
            <section className="px-margin mb-space-lg">
              <SectionTitle bar>{t('drv.careerTeams')}</SectionTitle>
              <ListGroup className="mt-2">
                {champion.teams.map((stint) => (
                  <div key={`${stint.name}-${stint.years}`} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="type-body-md font-semibold text-text-primary truncate">{stint.name}</p>
                      {stint.series && <p className="type-label-telemetry text-text-muted uppercase">{stint.series[lang]}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="type-label-badge text-text-secondary">{stint.years}</p>
                      {stint.championYears && <p className="type-label-telemetry text-racing-red font-bold">{stint.championYears.join(', ')}</p>}
                    </div>
                  </div>
                ))}
              </ListGroup>
              <Link to={paths.champions} className="block mt-3 text-center py-2.5 rounded-lg text-text-muted hover:text-text-primary type-label-badge uppercase tracking-wider">
                {t('cat.champions')} →
              </Link>
            </section>
          )}

          {/* BIOGRAFIA E TITULOS */}
          {(bio || titles.length > 0) && (
            <section className="px-margin mb-space-lg space-y-4">
              <SectionTitle>{t('drv.bio')}</SectionTitle>
              {titles.length > 0 && <TitlesBlock titles={titles} lang={lang} />}
              {bio && <BioCard text={lang === 'en' ? bio.en : bio.pt} />}
            </section>
          )}

          {/* EQUIPE */}
          {team && !championOnly && (
            <section className="px-margin mb-space-md">
              <Link to={paths.team(category.id, team.id)} className="flex items-center gap-3 rounded-lg bg-asphalt border border-hairline p-space-md hover:bg-asphalt-alt transition-colors">
                <Avatar src={team.badge} name={team.name} size={44} square fit="contain" />
                <div className="min-w-0 flex-1">
                  <p className="type-label-telemetry uppercase text-text-muted">{t('drv.team')}</p>
                  <p className="type-headline-sm uppercase text-text-primary truncate">{team.name}</p>
                </div>
                <span className="type-label-badge text-racing-red uppercase">{t('common.open')} →</span>
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Placar de titulos: contador em destaque ao lado da lista de campeonatos com os anos (como no app). */
function TitlesBlock({ titles, lang }: { titles: DriverTitle[]; lang: 'pt' | 'en' }) {
  const { t } = useT();
  return (
    <div className="flex gap-3 items-stretch">
      <div className="w-[104px] shrink-0 rounded-sm bg-primary-container flex flex-col items-center justify-center py-3 text-white">
        <Trophy className="w-[26px] h-[26px]" />
        <span className="type-display-hero text-[44px] leading-[48px]">{countDriverTitles(titles)}</span>
        <span className="type-label-telemetry uppercase text-white/85">{t('drv.titles')}</span>
      </div>
      <div className="flex-1 min-w-0 rounded-lg bg-asphalt border border-hairline divide-y divide-hairline-soft overflow-hidden">
        {titles.map((title) => (
          <div key={`${title.pt}-${title.years.join()}`} className="px-3.5 py-2.5">
            <p className="font-inter text-[16px] font-semibold text-on-surface">{lang === 'en' ? title.en : title.pt}</p>
            {formatDriverTitleYears(title.years) && <p className="type-label-badge text-primary">{formatDriverTitleYears(title.years)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const shortGp = (name: string) => name.replace(/\s*(Grand Prix|GP)\s*$/i, '').replace(/^GP (de|da|do|dos|das) /i, '');

function Cell({ label, value, strong = false, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <div className="flex flex-col items-center min-w-[34px]">
      <span className="type-label-telemetry text-text-muted uppercase">{label}</span>
      <span className={cn(strong ? 'type-body-md font-black' : 'type-label-telemetry font-bold text-text-secondary', tone ?? (strong ? 'text-text-primary' : undefined))}>{value}</span>
    </div>
  );
}

function Tile({ icon, tag, value, label, red = false }: { icon: React.ReactNode; tag: string; value: string | number; label: string; red?: boolean }) {
  return (
    <div className="bg-asphalt border border-hairline rounded-lg p-3 flex flex-col justify-between min-h-[96px]">
      <div className="flex items-center justify-between text-text-muted">
        {icon}
        <span className="type-label-telemetry uppercase">{tag}</span>
      </div>
      <div className="mt-2">
        <span className={cn('type-telemetry-counter leading-none', red ? 'text-racing-red' : 'text-text-primary')}>{typeof value === 'number' ? String(value).padStart(2, '0') : value}</span>
        <p className="type-label-telemetry uppercase text-text-muted mt-1 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function DuelBar({ title, mineName, mateName, mine, theirs, total }: { title: string; mineName: string; mateName: string; mine: number; theirs: number; total: number }) {
  if (total === 0) return null;
  const myShare = percent(mine, total);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="type-label-telemetry text-racing-red font-bold">{mine}</span>
          <span className="type-body-sm text-text-primary font-medium truncate">{shortName(mineName)}</span>
        </div>
        <span className="type-label-telemetry uppercase text-text-muted tracking-wider text-center">{title}</span>
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <span className="type-body-sm text-text-secondary font-medium truncate">{mateName.split(' ').at(-1)}</span>
          <span className="type-label-telemetry text-text-muted font-bold">{theirs}</span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden flex">
        <div className="h-full bg-racing-red transition-all duration-700" style={{ width: `${myShare}%` }} />
        <div className="h-full bg-surface-bright flex-1" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="type-label-telemetry text-racing-red">{myShare.toFixed(1)}%</span>
        <span className="type-label-telemetry text-text-muted">{(100 - myShare).toFixed(1)}%</span>
      </div>
    </div>
  );
}
