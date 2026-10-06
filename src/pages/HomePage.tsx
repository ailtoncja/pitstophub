import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Download, Share, Users, X } from 'lucide-react';
import { paths } from '../app/paths';
import { Skeleton, ListGroup, LiveDot, PillStrip, SectionTitle, CountdownInline } from '../components/ui';
import { useTributes } from '../features/tributes/Tributes';
import { CATEGORY_GROUPS, categorySummary, type GroupId } from '../lib/categories-meta';
import { findCategoryDriver, findCategoryTeam } from '../lib/entities';
import { dayMonthNumeric, formatPoints, hasStartTime, pad2, raceTitle, raceWhen, racePlace, timeOf } from '../lib/format';
import { followedCategorySet, pickHero } from '../lib/hero';
import { useT } from '../lib/i18n';
import { completedRacesDesc, roundNumber, upcomingRaces } from '../lib/season';
import { useNow } from '../lib/useNow';
import { raceStartDate } from '../race-time';
import { useLiveData } from '../state/live-data';
import { useInstall } from '../state/install';
import { useSettings } from '../state/settings';
import type { Category, Race, StandingItem } from '../types';
import { cn } from '../lib/utils';

const LIVE_WINDOW_MS = 3 * 3600_000;

type LeaderEntry = { entry: StandingItem; kind: 'driver' | 'team' };

function leaderOf(category: Category): LeaderEntry | null {
  const s = category.standings;
  const driver = s?.drivers?.[0] ?? s?.driverClasses?.[0]?.entries?.[0];
  if (driver) return { entry: driver, kind: 'driver' };
  const team = s?.constructors?.[0] ?? s?.teams?.[0];
  return team ? { entry: team, kind: 'team' } : null;
}

function topThree(category: Category): StandingItem[] {
  const s = category.standings;
  return (s?.drivers ?? s?.driverClasses?.[0]?.entries ?? s?.constructors ?? s?.teams ?? []).slice(0, 3);
}

export default function HomePage() {
  const { t, lang } = useT();
  const { categories, ready } = useLiveData();
  const { prefs } = useSettings();
  const install = useInstall();
  const tributes = useTributes();
  const now = useNow(30_000);
  const [group, setGroup] = useState<GroupId | 'all'>('all');

  const followed = useMemo(
    () => followedCategorySet({ followedCategoryIds: prefs.followedCategoryIds, followedTeamIds: prefs.followedTeamIds, followedDriverIds: prefs.followedDriverIds }),
    [prefs.followedCategoryIds, prefs.followedTeamIds, prefs.followedDriverIds],
  );
  const { hero, sameDay } = useMemo(() => pickHero({ categories, group, followed, now }), [categories, group, followed, now]);

  const groupDef = CATEGORY_GROUPS.find((g) => g.id === group);
  // Sem etapa pela frente, os blocos seguintes usam a categoria do grupo/seguida mais relevante.
  const focus: Category | undefined =
    hero?.category ??
    categories.find((c) => (group === 'all' ? followed.has(c.id) : groupDef?.ids.includes(c.id))) ??
    categories.find((c) => c.id === 'f1');

  const options = [
    { value: 'all' as const, label: t('home.all') },
    ...CATEGORY_GROUPS.map((g) => ({ value: g.id, label: g.label[lang] })),
  ];

  const upcoming = focus ? upcomingRaces(focus.calendar, now) : [];
  const lastWinnerRace = focus ? completedRacesDesc(focus.calendar).find((race) => race.winner) : undefined;
  const nextAfter = hero ? upcoming.find((race) => race.id !== hero.race.id) : upcoming[0];
  const leader = focus ? leaderOf(focus) : null;
  const top = focus ? topThree(focus) : [];

  const quickCategories = useMemo(() => {
    const pool = categories.filter((c) => group === 'all' || groupDef?.ids.includes(c.id));
    const preferred = pool.filter((c) => followed.has(c.id));
    return [...preferred, ...pool.filter((c) => !followed.has(c.id))].slice(0, 4);
  }, [categories, group, groupDef, followed]);

  return (
    <div className="flex flex-col w-full px-margin pb-8 space-y-space-lg page-in">
      <h1 className="sr-only">{t('nav.home')}</h1>
      <PillStrip options={options} value={group} onChange={setGroup} className="pt-space-xs" />

      {(install.canInstall || install.iosHint) && (
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low border border-surface-border px-3.5 py-3">
          {install.canInstall ? <Download className="w-5 h-5 text-racing-red shrink-0" /> : <Share className="w-5 h-5 text-racing-red shrink-0" />}
          <p className="type-body-sm text-text-secondary flex-1">{install.canInstall ? t('home.installBody') : t('home.installIos')}</p>
          {install.canInstall ? (
            <button type="button" disabled={install.installing} onClick={() => void install.install()} className="px-3 py-1.5 rounded-lg bg-racing-red text-white type-label-badge uppercase tracking-wider active:scale-95 disabled:opacity-60">
              {t('home.install')}
            </button>
          ) : (
            <button type="button" onClick={install.dismissIosHint} aria-label={t('common.close')} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-lg lg:space-y-0">
        <div className="lg:col-span-7 space-y-space-lg">
          {/* PROXIMA LARGADA */}
          {hero ? (
            <HeroCard hero={hero} sameDay={sameDay} now={now} />
          ) : !ready ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="rounded-xl bg-surface-container-low p-space-md">
              <p className="type-label-telemetry uppercase text-text-muted">{focus?.fullName}</p>
              <h2 className="type-headline-lg uppercase text-text-primary mt-1">{t('home.noUpcoming')}</h2>
              <p className="type-body-sm text-text-muted mt-1">{t('home.noUpcomingHint')}</p>
            </div>
          )}

          {/* DESTAQUES */}
          {focus && (
            <section className="flex flex-col space-y-2">
              <SectionTitle right={t('home.season', { year: focus.calendar[0]?.date.slice(0, 4) ?? new Date().getFullYear() })}>{t('home.highlights')}</SectionTitle>
              <ListGroup>
                {leader && (
                  <Highlight
                    to={leaderLink(focus, leader)}
                    label={t('home.leader')}
                    labelClass="text-telemetry-amber"
                    title={leader.entry.name}
                    sub={`${leader.entry.team ?? focus.name} • ${formatPoints(leader.entry.points)} pts`}
                    right={<span className="type-telemetry-counter font-bold text-telemetry-amber">P{leader.entry.position}</span>}
                  />
                )}
                {lastWinnerRace && (
                  <Highlight
                    to={paths.race(focus.id, lastWinnerRace.id)}
                    label={t('home.lastWinner')}
                    title={lastWinnerRace.winner ?? ''}
                    sub={`${t('home.round', { n: roundNumber(focus.calendar, lastWinnerRace) })} • ${raceTitle(lastWinnerRace, lang)}`}
                    right={<CheckCircle2 className="w-5 h-5 text-text-muted" />}
                  />
                )}
                {nextAfter && (
                  <Highlight
                    to={paths.race(focus.id, nextAfter.id)}
                    label={t('home.upNext')}
                    labelClass="text-secondary"
                    title={raceTitle(nextAfter, lang)}
                    sub={`${t('home.round', { n: roundNumber(focus.calendar, nextAfter) })} • ${raceWhen(nextAfter, lang)} • ${racePlace(nextAfter, lang)}`}
                    right={<span className="type-label-telemetry uppercase tracking-wider text-text-muted">{focus.name}</span>}
                  />
                )}
              </ListGroup>
            </section>
          )}
        </div>

        <div className="lg:col-span-5 space-y-space-lg">
          {/* CORRIDAS FUTURAS */}
          {focus && upcoming.length > 0 && (
            <section className="flex flex-col space-y-2">
              <SectionTitle right={<Link to={paths.calendarOf(focus.id)} className="text-racing-red font-semibold hover:underline">{t('common.seeAll')}</Link>}>
                {t('home.futureRaces')}
              </SectionTitle>
              <ListGroup>
                {upcoming.slice(0, 4).map((race, index) => (
                  <Link key={race.id} to={paths.race(focus.id, race.id)} className="flex items-center justify-between p-space-md hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-space-sm min-w-0">
                      <span className={cn('w-1 h-6 rounded-full shrink-0', index === 0 ? 'bg-racing-red' : 'bg-surface-container')} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="type-body-md uppercase font-bold text-text-primary truncate">{raceTitle(race, lang)}</span>
                          {index === 0 && <span className="type-label-telemetry text-racing-red font-semibold uppercase">{t('home.next')}</span>}
                        </div>
                        <span className="type-body-sm text-text-muted truncate">{race.circuit || racePlace(race, lang)}</span>
                      </div>
                    </div>
                    <span className="type-label-telemetry text-text-muted font-semibold shrink-0 pl-2">{shortWhen(race, lang)}</span>
                  </Link>
                ))}
              </ListGroup>
            </section>
          )}

          {/* LIDERES */}
          {focus && top.length > 0 && (
            <section className="flex flex-col space-y-2">
              <SectionTitle right={t('home.top3')}>{t('home.leaders')}</SectionTitle>
              <ListGroup>
                {top.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between p-space-md">
                    <div className="flex items-center gap-space-md min-w-0">
                      <span className={cn('type-label-telemetry font-bold w-4', index === 0 ? 'text-racing-red' : 'text-text-muted')}>{pad2(index + 1)}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="type-body-md uppercase font-bold text-text-primary truncate">{entry.name}</span>
                        {entry.team && <span className="type-body-sm text-text-muted truncate">{entry.team}</span>}
                      </div>
                    </div>
                    <span className="type-telemetry-counter font-bold text-text-primary shrink-0 pl-2">
                      {formatPoints(entry.points)} <span className="type-label-telemetry font-normal text-text-muted">PTS</span>
                    </span>
                  </div>
                ))}
              </ListGroup>
              <Link to={paths.standingsOf(focus.id)} className="w-full py-2.5 rounded-lg text-center text-text-muted hover:text-text-primary type-label-badge uppercase tracking-wider transition-all">
                {t('home.fullStandings')}
              </Link>
            </section>
          )}

          {/* CATEGORIAS */}
          {quickCategories.length > 0 && (
            <section className="flex flex-col space-y-2">
              <SectionTitle right={t('home.quickAccess')}>{t('nav.categories')}</SectionTitle>
              <div className="grid grid-cols-2 gap-space-sm">
                {quickCategories.map((category) => (
                  <Link key={category.id} to={paths.category(category.id)} className="flex flex-col p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all">
                    <span className="type-headline-sm uppercase text-text-primary truncate">{category.name}</span>
                    <span className="type-label-telemetry text-text-muted mt-1 truncate">{categorySummary(category, lang)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* RODAPE */}
      <footer className="flex flex-col items-center justify-center pt-space-md pb-space-lg space-y-space-sm text-center">
        <button type="button" onClick={tributes.onFooterLogoTap} className="flex items-center gap-2 select-none" aria-label="PitStopHub">
          <span className="w-2 h-2 rounded-full bg-racing-red" />
          <span className="type-headline-sm uppercase text-text-primary">PitStopHub</span>
        </button>
        <p className="type-label-telemetry text-text-muted">
          {t('home.footerCopy', { year: new Date().getFullYear() })}
          <br />
          {t('home.footerSub')}
        </p>
      </footer>
    </div>
  );
}

function leaderLink(category: Category, leader: LeaderEntry): string {
  if (leader.kind === 'driver') {
    const driver = findCategoryDriver(category, leader.entry.name);
    if (driver) return paths.driver(category.id, driver.id);
  } else {
    const team = findCategoryTeam(category, leader.entry.name);
    if (team) return paths.team(category.id, team.id);
  }
  return paths.standingsOf(category.id);
}

function shortWhen(race: Race, lang: 'pt' | 'en'): string {
  const date = raceStartDate(race);
  return hasStartTime(race) ? `${dayMonthNumeric(date)} • ${timeOf(date, lang)}` : dayMonthNumeric(date);
}

function Highlight({ to, label, labelClass, title, sub, right }: {
  to: string;
  label: string;
  labelClass?: string;
  title: string;
  sub: string;
  right: React.ReactNode;
}) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 p-space-md hover:bg-surface-container transition-colors">
      <div className="flex flex-col min-w-0">
        <span className={cn('type-label-telemetry uppercase tracking-wider font-semibold', labelClass ?? 'text-text-muted')}>{label}</span>
        <span className="type-body-lg uppercase font-bold text-text-primary mt-0.5 truncate">{title}</span>
        <span className="type-body-sm text-text-muted truncate">{sub}</span>
      </div>
      <div className="shrink-0">{right}</div>
    </Link>
  );
}

function HeroCard({ hero, sameDay, now }: { hero: { category: Category; race: Race }; sameDay: { category: Category; race: Race }[]; now: number }) {
  const { t, lang } = useT();
  const { category, race } = hero;
  const start = raceStartDate(race).getTime();
  const timed = hasStartTime(race);
  const live = timed && now >= start && now < start + LIVE_WINDOW_MS;
  const round = roundNumber(category.calendar, race);
  const total = category.calendar.filter((r) => r.status !== 'cancelled').length;
  const others = sameDay.filter((item) => item.race.id !== race.id || item.category.id !== category.id);

  return (
    <div className="relative w-full rounded-xl bg-surface-overlay p-space-md border border-racing-red/70 glow-red flex flex-col space-y-space-md overflow-hidden">
      <div className="absolute inset-0 carbon-mesh opacity-60 pointer-events-none" aria-hidden />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <LiveDot />
          <span className="type-label-telemetry uppercase text-racing-red tracking-wider font-semibold truncate">
            {live ? t('home.liveNow') : t('home.nextStart')} • {category.fullName}
          </span>
        </div>
        {round > 0 && <span className="type-label-telemetry text-text-muted shrink-0">{t('home.stage', { n: round, total })}</span>}
      </div>

      <div className="relative flex flex-col space-y-1">
        <Link to={paths.race(category.id, race.id)} className="type-headline-lg uppercase text-text-primary tracking-tight hover:text-white">
          {raceTitle(race, lang)}
        </Link>
        <p className="type-body-sm text-text-muted">
          {[race.circuit, raceWhen(race, lang)].filter(Boolean).join(' • ')}
        </p>
      </div>

      <div className="relative">
        {live ? (
          <div className="flex items-center gap-2 py-3">
            <LiveDot className="w-2 h-2" />
            <span className="type-telemetry-counter text-racing-red uppercase">{t('home.liveNow')}</span>
          </div>
        ) : timed || start > now ? (
          <CountdownInline target={start} labels={{ d: 'd', h: 'h', m: 'm', s: 's' }} />
        ) : null}
      </div>

      <div className="relative grid grid-cols-2 gap-space-sm pt-1">
        <Link to={paths.calendarOf(category.id)} className="h-10 flex items-center justify-center gap-2 rounded-lg bg-surface-container text-text-primary type-label-badge uppercase tracking-wider hover:bg-surface-variant transition-all">
          <CalendarDays className="w-4 h-4" />
          {t('nav.calendar')}
        </Link>
        <Link to={paths.category(category.id)} className="h-10 flex items-center justify-center gap-2 rounded-lg bg-surface-container text-text-primary type-label-badge uppercase tracking-wider hover:bg-surface-variant transition-all">
          <Users className="w-4 h-4" />
          {t('home.teams')}
        </Link>
      </div>

      {others.length > 0 && (
        <div className="relative border-t border-surface-border pt-3">
          <p className="type-label-telemetry uppercase text-text-muted mb-2">{t('home.alsoToday', { n: others.length })}</p>
          <div className="flex flex-wrap gap-2">
            {others.map((item) => (
              <Link key={`${item.category.id}-${item.race.id}`} to={paths.race(item.category.id, item.race.id)} className="px-2.5 py-1 rounded-lg bg-surface-container type-label-badge uppercase text-text-secondary hover:text-white">
                {item.category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
