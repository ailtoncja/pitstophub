import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { paths } from '../app/paths';
import { Avatar } from '../components/Avatar';
import { BioCard } from '../components/pit';
import { Sparkline } from '../components/Sparkline';
import { useToast } from '../components/Toast';
import { EmptyState, SectionTitle, Skeleton, StatTile } from '../components/ui';
import { useTributes } from '../features/tributes/Tributes';
import { driversOfTeam, findCategoryDriver, findCategoryTeam } from '../lib/entities';
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

  const standing = teamStanding(category, team);
  const roster = driversOfTeam(category, team);
  const wins = teamWins(category, team.id);
  const bio = getTeamBio(category.id, team);
  const following = settings.isFollowingTeam(category.id, team.id);
  const isFerrariWec = team.id === 'af-corse-wec';
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

  const art = team.clearart ?? team.badge ?? team.logo;
  const shortGp = (race: { name: string; enName?: string }) =>
    (lang === 'en' ? race.enName ?? race.name : race.name).replace(/\s*(Grand Prix|GP)\s*$/i, '').replace(/^GP (de|da|do|dos|das) /i, '');

  return (
    <div className="flex flex-col w-full pb-10 page-in">
      <div className="px-margin pt-space-sm pb-space-xs flex items-center justify-between">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.category(category.id)))} aria-label={t('common.back')} className="w-10 h-10 -ml-2 rounded-sm flex items-center justify-center text-primary hover:text-white active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="type-label-badge uppercase tracking-wider text-on-surface-variant">{category.name} {year}</span>
        <button type="button" onClick={toggleFollow} aria-pressed={following} aria-label={t('team.follow')} className={cn('w-10 h-10 -mr-2 rounded-sm flex items-center justify-center active:scale-90 transition-all', following ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary')}>
          <Star className={cn('w-5 h-5', following && 'fill-current')} />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg">
        <div className="lg:col-span-5 space-y-space-lg">
          {/* HERO: carro da equipe, brasao e nome (monocromatico, como no app) */}
          <section className="px-margin">
            <div className="relative h-60 rounded-lg overflow-hidden border border-hairline" style={{ background: 'linear-gradient(135deg, #2e2e33 0%, #15151e 55%, #000 100%)' }}>
              <div className="absolute inset-0 carbon-lines" aria-hidden />
              {art && <img src={art} alt="" className="absolute top-3 inset-x-6 mx-auto h-[170px] max-w-[calc(100%-3rem)] object-contain" />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.9) 100%)' }} aria-hidden />
              <div className="absolute bottom-0 inset-x-0 p-5 flex items-center gap-3">
                <span
                  onClick={isFerrariWec ? tributes.onFerrariWecTap : undefined}
                  className={cn('shrink-0 rounded-full', isFerrariWec && 'cursor-pointer select-none')}
                >
                  <Avatar src={team.badge ?? team.logo} name={team.name} size={44} fit="contain" className="bg-surface-container-highest border border-hairline" />
                </span>
                <div className="min-w-0">
                  <h1 className="type-headline-md text-[22px] leading-[26px] uppercase text-white line-clamp-2">{team.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {team.car && <span className="type-label-badge uppercase text-on-surface-variant">{team.car}</span>}
                    {team.class && <span className="type-label-telemetry uppercase bg-surface-container-highest text-on-surface-variant rounded-sm px-2 py-0.5">{team.class}</span>}
                  </div>
                  {team.principal && <p className="type-label-telemetry uppercase text-on-surface-variant mt-0.5 truncate">{team.principal}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* NUMEROS */}
          <section className="px-margin grid grid-cols-2 gap-3">
            <StatTile label={t('team.pos')} value={standing ? `P${standing.item.position}` : '—'} accent={standing?.item.position === 1} />
            <StatTile label={t('team.pointsAccrued')} value={standing ? formatPoints(standing.item.points) : formatPoints(teamPoints)} />
            <StatTile label={t('team.wins')} value={wins.length} accent={wins.length > 0} sub={wins.length === 0 ? t('team.noWins') : wins.slice(0, 2).map(shortGp).join(', ')} />
            <StatTile label={t('team.gapLabel')} value={gap != null && standing?.next ? signed(gap) : '—'} sub={standing?.next ? t('team.vs', { name: standing.next.name }) : undefined} />
          </section>
        </div>

        <div className="lg:col-span-7 space-y-space-lg mt-space-lg lg:mt-0">
          {/* DUPLA DE PILOTOS */}
          {driverRows.length > 0 && (
            <section className="px-margin">
              <SectionTitle right={t('team.currentSeason')}>{t('team.duo')}</SectionTitle>
              <div className="space-y-3 mt-3">
                {driverRows.map(({ driver, item, wins: driverWins }) => {
                  const share = driverTotal > 0 ? percent(item?.points ?? 0, driverTotal) : 0;
                  return (
                    <Link key={driver.id} to={paths.driver(category.id, driver.id)} className="block rounded-lg bg-asphalt border border-hairline overflow-hidden hover:bg-asphalt-alt transition-colors">
                      <div className="flex items-center gap-3 pr-2">
                        <span className="w-1 self-stretch bg-outline-variant" aria-hidden />
                        <div className="flex-1 min-w-0 py-3">
                          {driver.number && <p className="type-telemetry-counter text-[26px] leading-[28px] text-white">{driver.number}</p>}
                          <p className="type-headline-md text-[18px] leading-[22px] uppercase text-white line-clamp-2">{driver.name}</p>
                          <p className="type-label-telemetry uppercase text-on-surface-variant mt-0.5 truncate">
                            {item ? t('team.driverLine', { pos: item.position, wins: driverWins }) : t('team.noStanding')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="type-telemetry-counter text-[18px] text-white">{item ? formatPoints(item.points) : '—'}</p>
                          {item && driverTotal > 0 && <p className="type-label-telemetry uppercase text-on-surface-variant">{t('team.share', { n: share.toFixed(1) })}</p>}
                        </div>
                        <Avatar src={driver.cutout ?? driver.image} name={driver.name} size={80} className="bg-transparent rounded-none shrink-0" />
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest">
                        <div className="h-full bg-on-surface-variant transition-[width] duration-700" style={{ width: `${share}%` }} />
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
              <SectionTitle right={perStage != null ? `Δ ${formatPoints(Math.round(perStage * 10) / 10)} ${t('team.ptsPerStage')}` : undefined}>{t('team.evolution')}</SectionTitle>
              <div className="rounded-lg bg-asphalt border border-hairline p-space-md mt-3">
                <div className="flex justify-between type-label-telemetry uppercase mb-2 gap-2">
                  <span className="text-on-surface-variant">R{pad2(firstLabel.round)} · {formatPoints(firstLabel.total)} PTS</span>
                  <span className="text-white font-bold">R{pad2(lastLabel.round)} · {formatPoints(lastLabel.total)} PTS</span>
                </div>
                <Sparkline values={evolution.map((e) => e.total)} className="w-full h-24" />
                <div className="flex justify-between type-label-telemetry uppercase text-on-surface-variant mt-2">
                  {pickTicks(evolution).map((tick, i, all) => (
                    <span key={tick.round} className={cn(i === all.length - 1 && 'text-primary font-bold')}>R{pad2(tick.round)}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SOBRE */}
          {bio && (
            <section className="px-margin space-y-3">
              <SectionTitle>{t('team.about')}</SectionTitle>
              <BioCard text={lang === 'en' ? bio.en : bio.pt} />
            </section>
          )}

          {/* CLASSIFICACAO COMPLETA */}
          <section className="px-margin">
            <Link to={paths.standingsOf(category.id)} className="flex items-center justify-between rounded-lg bg-asphalt border border-hairline p-space-md hover:bg-asphalt-alt transition-colors">
              <span className="type-label-badge uppercase tracking-wider text-on-surface-variant">{t('team.fullStandings', { name: category.name })}</span>
              <span className="type-label-badge text-primary uppercase">{t('common.open')} →</span>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Marcas do eixo do grafico: primeira, ultima e ate 3 intermediarias. */
function pickTicks<T extends { round: number }>(entries: T[]): T[] {
  if (entries.length <= 5) return entries;
  const last = entries.length - 1;
  return [0, 0.25, 0.5, 0.75, 1].map((p) => entries[Math.round(p * last)]);
}
