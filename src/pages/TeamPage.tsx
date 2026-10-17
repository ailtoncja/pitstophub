import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { paths } from '../app/paths';
import { Avatar } from '../components/Avatar';
import { BioCard, ReelBackdrop } from '../components/pit';
import { Sparkline } from '../components/Sparkline';
import { useToast } from '../components/Toast';
import { BackBar, Button, EmptyState, FactList, SectionTitle, Skeleton } from '../components/ui';
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
  const toast = useToast();
  const tributes = useTributes();
  const settings = useSettings();
  const category = useCategory(categoryId);
  const team = category?.teams.find((x) => x.id === teamId);
  const points = useTeamPoints(category, team?.id);

  const evolution = useMemo(() => (points.data ? cumulativePoints(points.data) : []), [points.data]);

  if (!category || !team) {
    return (
      <div className="px-margin lg:px-0 pt-6">
        <EmptyState title={t('team.notFound')} action={<Button to={categoryId ? paths.category(categoryId) : paths.categories}>{t('common.back')}</Button>} />
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
    <div className="px-margin lg:px-0 pb-12 page-in">
      <BackBar
        fallback={paths.category(category.id)}
        label={`${category.name} ${year}`}
        right={
          <Button variant={following ? 'primary' : 'secondary'} onClick={toggleFollow} aria-pressed={following} className={cn(following && 'bg-racing-red text-white hover:bg-racing-red/90')}>
            <Star className={cn('w-[18px] h-[18px]', following && 'fill-current')} />
            {following ? t('common.following') : t('team.follow')}
          </Button>
        }
      />

      <div className="mt-2 lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 lg:self-start">
          {/* Carro da equipe, brasao e nome: campo neutro, a cor da equipe nao tinge a pagina */}
          <div className="relative h-[19rem] rounded-3xl overflow-hidden border border-hairline">
            <ReelBackdrop categoryId={category.id} hue="#6f6f78" bare />
            {art && <img src={art} alt="" className="absolute top-4 inset-x-6 mx-auto h-[11.5rem] max-w-[calc(100%-3rem)] object-contain" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.85) 30%, transparent 62%)' }} aria-hidden />
            <div className="absolute bottom-0 inset-x-0 p-5 flex items-center gap-3">
              <span onClick={isFerrariWec ? tributes.onFerrariWecTap : undefined} className={cn('shrink-0 rounded-full', isFerrariWec && 'cursor-pointer select-none')}>
                <Avatar src={team.badge ?? team.logo} name={team.name} size={48} fit="contain" className="bg-surface-container-highest border border-hairline" />
              </span>
              <div className="min-w-0">
                <h1 className="type-headline-md text-[1.5rem] text-white line-clamp-2">{team.name}</h1>
                <p className="type-body-sm text-silver truncate">{[team.car, team.class, team.principal].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
          </div>

          <FactList
            items={[
              { label: t('team.pos'), value: standing ? `P${standing.item.position}` : '—' },
              { label: t('team.pointsAccrued'), value: standing ? formatPoints(standing.item.points) : formatPoints(teamPoints) },
              { label: t('team.wins'), value: wins.length === 0 ? t('team.noWins') : `${wins.length} · ${wins.slice(0, 2).map(shortGp).join(', ')}` },
              { label: t('team.gapLabel'), value: gap != null && standing?.next ? `${signed(gap)} · ${t('team.vs', { name: standing.next.name })}` : '—' },
            ]}
          />
        </div>

        <div className="lg:col-span-7 mt-10 lg:mt-0 space-y-10 min-w-0">
          {driverRows.length > 0 && (
            <section className="space-y-3">
              <SectionTitle right={t('team.currentSeason')}>{t('team.duo')}</SectionTitle>
              <ul className="space-y-3">
                {driverRows.map(({ driver, item, wins: driverWins }) => {
                  const share = driverTotal > 0 ? percent(item?.points ?? 0, driverTotal) : 0;
                  return (
                    <li key={driver.id}>
                      <Link to={paths.driver(category.id, driver.id)} className="block rounded-2xl bg-asphalt border border-hairline overflow-hidden hover:border-white/40 transition-colors">
                        <div className="flex items-center gap-4 pl-5 pr-2">
                          <div className="flex-1 min-w-0 py-4">
                            <p className="type-headline-md text-white line-clamp-2">
                              {driver.number && <span className="text-silver tabular mr-2">{driver.number}</span>}
                              {driver.name}
                            </p>
                            <p className="type-body-sm text-silver mt-0.5 truncate">
                              {item ? t('team.driverLine', { pos: item.position, wins: driverWins }) : t('team.noStanding')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="type-headline-sm text-white tabular">{item ? formatPoints(item.points) : '—'}</p>
                            {item && driverTotal > 0 && <p className="type-label-telemetry text-silver">{t('team.share', { n: share.toFixed(1) })}</p>}
                          </div>
                          <Avatar src={driver.cutout ?? driver.image} name={driver.name} size={80} className="bg-transparent rounded-none shrink-0" />
                        </div>
                        <div className="w-full h-1 bg-white/10">
                          <div className="h-full bg-white transition-[width] duration-700" style={{ width: `${share}%` }} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {points.status === 'loading' && <Skeleton className="h-44" />}
          {evolution.length > 1 && firstLabel && lastLabel && (
            <section className="space-y-3">
              <SectionTitle right={perStage != null ? `${formatPoints(Math.round(perStage * 10) / 10)} ${t('team.ptsPerStage')}` : undefined}>{t('team.evolution')}</SectionTitle>
              <div className="rounded-2xl bg-asphalt border border-hairline p-4">
                <div className="flex justify-between type-label-telemetry mb-2 gap-2 tabular">
                  <span className="text-silver">R{pad2(firstLabel.round)} · {formatPoints(firstLabel.total)} {t('st.pts').toLowerCase()}</span>
                  <span className="text-white font-bold">R{pad2(lastLabel.round)} · {formatPoints(lastLabel.total)} {t('st.pts').toLowerCase()}</span>
                </div>
                <Sparkline values={evolution.map((e) => e.total)} className="w-full h-24" />
                <div className="flex justify-between type-label-telemetry text-silver mt-2 tabular">
                  {pickTicks(evolution).map((tick, i, all) => (
                    <span key={tick.round} className={cn(i === all.length - 1 && 'text-white font-bold')}>R{pad2(tick.round)}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {bio && (
            <section className="space-y-4">
              <SectionTitle>{t('team.about')}</SectionTitle>
              <BioCard text={lang === 'en' ? bio.en : bio.pt} />
            </section>
          )}

          <Link to={paths.standingsOf(category.id)} className="flex items-center justify-between gap-3 rounded-2xl bg-asphalt border border-hairline p-4 hover:border-white/40 transition-colors">
            <span className="type-body-md text-white">{t('team.fullStandings', { name: category.name })}</span>
            <span className="type-label-badge text-white">{t('common.open')} →</span>
          </Link>
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
