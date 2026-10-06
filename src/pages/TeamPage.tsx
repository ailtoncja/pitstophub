import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Medal, Star, TrendingUp, Trophy } from 'lucide-react';
import { paths } from '../app/paths';
import { Avatar } from '../components/Avatar';
import { teamColor } from '../components/cards';
import { Sparkline } from '../components/Sparkline';
import { useToast } from '../components/Toast';
import { EmptyState, LiveDot, SectionTitle, Skeleton } from '../components/ui';
import { useTributes } from '../features/tributes/Tributes';
import { driversOfTeam, findCategoryDriver, findCategoryTeam, splitName } from '../lib/entities';
import { useTeamPoints } from '../lib/f1-hooks';
import { formatPoints, pad2, signed } from '../lib/format';
import { useScrollTopOn } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { cumulativePoints, percent, teamWins } from '../lib/season';
import { cn } from '../lib/utils';
import { getTeamBio } from '../team-bios';
import { useCategory } from '../state/live-data';
import { useSettings } from '../state/settings';
import type { Category, StandingItem, Team } from '../types';

function teamStanding(category: Category, team: Team): { item: StandingItem; next?: StandingItem; leader?: StandingItem } | null {
  const list = category.standings?.constructors ?? category.standings?.teams ?? [];
  const index = list.findIndex((item) => findCategoryTeam(category, item.name)?.id === team.id);
  if (index < 0) return null;
  return { item: list[index], next: list[index - 1] ?? list[index + 1], leader: list[0] };
}

export default function TeamPage() {
  const { categoryId, teamId } = useParams();
  useScrollTopOn(`${categoryId}/${teamId}`);
  const { t, lang } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const tributes = useTributes();
  const settings = useSettings();
  const category = useCategory(categoryId);
  const team = category?.teams.find((x) => x.id === teamId);
  const points = useTeamPoints(category, team?.id);

  const evolution = useMemo(() => (points.data ? cumulativePoints(points.data) : []), [points.data]);

  if (!category || !team) {
    return (
      <div className="px-margin pt-6">
        <EmptyState title={t('team.notFound')} action={<Link to={categoryId ? paths.category(categoryId) : paths.categories} className="px-4 py-1.5 rounded-lg bg-surface-raised text-text-primary type-label-badge uppercase tracking-wider">{t('common.back')}</Link>} />
      </div>
    );
  }

  const color = teamColor(team);
  const standing = teamStanding(category, team);
  const roster = driversOfTeam(category, team);
  const wins = teamWins(category, team.id);
  const bio = getTeamBio(category.id, team);
  const following = settings.isFollowingTeam(category.id, team.id);
  const isLeader = standing?.item.position === 1;
  const isFerrariWec = team.id === 'af-corse-wec';
  const nameParts = splitName(team.name);
  const teamPoints = standing?.item.points ?? roster.reduce((sum, d) => sum + (category.standings?.drivers?.find((s) => findCategoryDriver(category, s.name)?.id === d.id)?.points ?? 0), 0);
  const gap = standing?.next ? teamPoints - standing.next.points : null;
  const driverRows = roster.map((driver) => {
    const item = category.standings?.drivers?.find((s) => findCategoryDriver(category, s.name)?.id === driver.id);
    return { driver, item, wins: category.calendar.filter((race) => race.winner && race.winner.split(/\s*\/\s*/).includes(driver.name)).length };
  });
  const driverTotal = driverRows.reduce((sum, row) => sum + (row.item?.points ?? 0), 0);
  const year = category.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
  const lastLabel = evolution.at(-1);
  const firstLabel = evolution[0];
  const perStage = evolution.length > 1 ? (evolution.at(-1)!.total - evolution[0].total) / (evolution.length - 1) : null;

  const toggleFollow = () => {
    if (settings.toggleTeam(category.id, team.id)) {
      toast.show(following ? t('toast.unfollowed', { name: team.name }) : t('toast.followed', { name: team.name }), { kind: 'ok' });
    }
  };

  return (
    <div className="flex flex-col w-full pb-10 page-in">
      <div className="px-margin pt-space-sm pb-space-xs flex items-center justify-between">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.category(category.id)))} aria-label={t('common.back')} className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-space-xs">
          <span className="type-label-badge px-2 py-0.5 rounded bg-surface-container-high text-secondary uppercase tracking-wider">{category.name} {year}</span>
          {standing && <span className="type-label-telemetry uppercase text-text-muted">P{standing.item.position}</span>}
        </div>
        <button type="button" onClick={toggleFollow} aria-pressed={following} aria-label={t('team.follow')} className={cn('w-10 h-10 -mr-2 rounded-xl flex items-center justify-center active:scale-90 transition-all', following ? 'text-racing-red' : 'text-text-secondary hover:text-racing-red')}>
          <Star className={cn('w-5 h-5', following && 'fill-current')} />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg">
        <div className="lg:col-span-5 space-y-space-lg">
          {/* CABECALHO */}
          <section className="px-margin">
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md carbon-mesh" style={{ backgroundImage: `linear-gradient(135deg, ${color}26, transparent 60%)` }}>
              <span className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: color }} aria-hidden />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {isLeader ? (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <LiveDot />
                      <span className="type-label-telemetry uppercase tracking-widest text-text-secondary">{t('team.leader')}</span>
                    </div>
                  ) : (
                    <span className="type-label-telemetry uppercase tracking-widest text-text-muted block mb-1.5">{[team.class, category.name].filter(Boolean).join(' • ')}</span>
                  )}
                  <h1 className="type-headline-lg uppercase italic font-black text-text-primary leading-[0.95] tracking-tight break-words">
                    {nameParts.first && <>{nameParts.first} </>}
                    <span style={{ color: isLeader ? undefined : color }}>{nameParts.last}</span>
                  </h1>
                  <p className="type-body-sm text-text-muted mt-1">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</p>
                </div>
                <span
                  onClick={isFerrariWec ? tributes.onFerrariWecTap : undefined}
                  className={cn('shrink-0 rounded-xl bg-surface-container-lowest p-1.5', isFerrariWec && 'cursor-pointer select-none')}
                >
                  <Avatar src={team.badge ?? team.logo} name={team.name} size={56} square fit="contain" className="bg-transparent" />
                </span>
              </div>
              {(team.principal || team.car || team.class) && (
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-surface-container-lowest/80 p-3">
                  {team.principal && <Fact label={t('team.principal')} value={team.principal} />}
                  {team.car && <Fact label={t('team.car')} value={team.car} />}
                  {team.class && <Fact label={t('team.class')} value={team.class} />}
                </dl>
              )}
            </div>
          </section>

          {/* CLASSIFICACAO */}
          {standing && (
            <section className="px-margin">
              <div className="flex items-center justify-between pb-1.5">
                <h2 className="type-label-telemetry uppercase tracking-widest text-text-muted">{t('team.standing')}</h2>
                {gap != null && gap !== 0 && (
                  <span className={cn('type-label-telemetry uppercase flex items-center gap-1', gap > 0 ? 'text-tertiary' : 'text-text-muted')}>
                    <TrendingUp className="w-3.5 h-3.5" />{gap > 0 ? t('team.ahead') : t('team.behind')}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-space-md">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex flex-col items-center justify-center shrink-0">
                    <span className="type-headline-md font-black italic text-racing-red leading-none">P{standing.item.position}</span>
                    <span className="type-label-telemetry uppercase text-text-muted">{t('team.pos')}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="type-headline-lg font-black text-text-primary leading-none">{formatPoints(standing.item.points)}</p>
                    <p className="type-label-telemetry uppercase text-text-muted mt-1">{t('team.pointsAccrued')}</p>
                  </div>
                </div>
                {gap != null && standing.next && (
                  <div className="text-right min-w-0">
                    <p className={cn('type-headline-sm font-black', gap >= 0 ? 'text-tertiary' : 'text-text-secondary')}>{signed(gap)} <span className="type-label-telemetry">PTS</span></p>
                    <p className="type-label-telemetry uppercase text-text-muted truncate">{t('team.vs', { name: standing.next.name })}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* VITORIAS */}
          <section className="px-margin grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-container-low p-space-md">
              <div className="flex items-center justify-between">
                <span className="type-label-telemetry uppercase tracking-widest text-text-muted">{t('team.wins')}</span>
                <Trophy className="w-[18px] h-[18px] text-text-muted" />
              </div>
              <p className="type-headline-lg font-black text-text-primary mt-2 leading-none">{wins.length}<span className="type-body-sm text-text-muted font-normal ml-1">GP</span></p>
              <p className="type-label-telemetry text-text-muted uppercase mt-2 leading-snug">
                {wins.slice(0, 4).map((race) => (lang === 'en' ? race.enName ?? race.name : race.name).replace(/\s*(Grand Prix|GP)\s*$/i, '').replace(/^GP (de|da|do|dos|das) /i, '')).join(', ') || t('team.noWins')}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-space-md">
              <div className="flex items-center justify-between">
                <span className="type-label-telemetry uppercase tracking-widest text-text-muted">{t('team.drivers')}</span>
                <Medal className="w-[18px] h-[18px] text-text-muted" />
              </div>
              <p className="type-headline-lg font-black text-text-primary mt-2 leading-none">{roster.length}</p>
              <p className="type-label-telemetry text-text-muted uppercase mt-2 leading-snug">{t('team.rosterHint')}</p>
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-space-lg mt-space-lg lg:mt-0">
          {/* DUPLA DE PILOTOS */}
          {driverRows.length > 0 && (
            <section className="px-margin">
              <SectionTitle right={t('team.currentSeason')}>{t('team.duo')}</SectionTitle>
              <div className="space-y-3 mt-2">
                {driverRows.map(({ driver, item, wins: driverWins }, index) => {
                  const share = driverTotal > 0 ? percent(item?.points ?? 0, driverTotal) : 0;
                  const barColor = index === 0 ? '#E10600' : index === 1 ? '#00b4ff' : color;
                  return (
                    <Link key={driver.id} to={paths.driver(category.id, driver.id)} className="block rounded-xl bg-surface-container-low p-space-md hover:bg-surface-container transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={driver.cutout ?? driver.image} name={driver.name} size={48} />
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              {driver.number && <span className="type-label-badge font-bold" style={{ color: barColor }}>#{driver.number}</span>}
                              <span className="type-headline-sm italic uppercase font-black text-text-primary line-clamp-2 leading-tight">{driver.name}</span>
                            </div>
                            <p className="type-body-sm text-text-muted line-clamp-2">
                              {item ? t('team.driverLine', { pos: item.position, wins: driverWins }) : t('team.noStanding')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="type-headline-md font-black text-text-primary leading-none">{item ? formatPoints(item.points) : '—'}</p>
                          {item && driverTotal > 0 && <p className="type-label-telemetry uppercase text-text-muted mt-1">{t('team.share', { n: share.toFixed(1) })}</p>}
                        </div>
                      </div>
                      <div className="mt-3 w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${share}%`, backgroundColor: barColor }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* EVOLUCAO */}
          {points.status === 'loading' && <div className="px-margin"><Skeleton className="h-44" /></div>}
          {evolution.length > 1 && firstLabel && lastLabel && (
            <section className="px-margin">
              <div className="flex items-center justify-between pb-1.5 gap-2">
                <h2 className="type-label-telemetry uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-racing-red" />{t('team.evolution')} (R{firstLabel.round} - R{lastLabel.round})
                </h2>
                {perStage != null && <span className="type-label-telemetry text-text-secondary uppercase shrink-0">Δ {formatPoints(Math.round(perStage * 10) / 10)} {t('team.ptsPerStage')}</span>}
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-md">
                <div className="flex justify-between type-label-telemetry uppercase mb-2 gap-2">
                  <span className="text-text-muted">R{pad2(firstLabel.round)} · {formatPoints(firstLabel.total)} PTS</span>
                  <span className="text-text-primary font-bold">R{pad2(lastLabel.round)} · {formatPoints(lastLabel.total)} PTS</span>
                </div>
                <Sparkline values={evolution.map((e) => e.total)} className="w-full h-24" />
                <div className="flex justify-between type-label-telemetry uppercase text-text-muted mt-2">
                  {pickTicks(evolution).map((tick, i, all) => (
                    <span key={tick.round} className={cn(i === all.length - 1 && 'text-racing-red font-bold')}>R{pad2(tick.round)}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SOBRE */}
          {bio && (
            <section className="px-margin">
              <SectionTitle bar>{t('team.about')}</SectionTitle>
              <p className="type-body-md text-text-secondary mt-2 max-w-2xl">{lang === 'en' ? bio.en : bio.pt}</p>
            </section>
          )}

          {/* OUTRAS EQUIPES DA CATEGORIA */}
          <section className="px-margin">
            <Link to={paths.standingsOf(category.id)} className="flex items-center justify-between rounded-xl bg-surface-raised border border-surface-border p-space-md hover:bg-surface-overlay transition-colors">
              <span className="type-label-badge uppercase tracking-wider text-text-secondary">{t('team.fullStandings', { name: category.name })}</span>
              <span className="type-label-badge text-racing-red uppercase">{t('common.open')} →</span>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-label-telemetry uppercase text-text-muted tracking-wider">{label}</dt>
      <dd className="type-body-md font-semibold text-text-primary truncate">{value}</dd>
    </div>
  );
}

/** Marcas do eixo do grafico: primeira, ultima e ate 3 intermediarias. */
function pickTicks<T extends { round: number }>(entries: T[]): T[] {
  if (entries.length <= 5) return entries;
  const last = entries.length - 1;
  return [0, 0.25, 0.5, 0.75, 1].map((p) => entries[Math.round(p * last)]);
}
