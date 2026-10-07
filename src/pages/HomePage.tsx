import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, MapPin, Share, X } from 'lucide-react';
import { paths } from '../app/paths';
import { HeroBackdrop, HowItWorksCard, SkewBadge } from '../components/pit';
import { CountdownPanel, PillStrip, SectionTitle, Skeleton } from '../components/ui';
import { useTributes } from '../features/tributes/Tributes';
import { accentOf, CATEGORY_GROUPS } from '../lib/categories-meta';
import { iconOfCategory } from '../lib/category-icons';
import { findCategoryDriver, findCategoryTeam } from '../lib/entities';
import { formatPoints, hasStartTime, pad2, raceTitle, racePlace } from '../lib/format';
import { useT } from '../lib/i18n';
import { completedRacesDesc, nextRace } from '../lib/season';
import { useNow } from '../lib/useNow';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useInstall } from '../state/install';
import { useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import type { Category, Race, StandingItem } from '../types';

const LIVE_WINDOW_MS = 3 * 3600_000;

type Phase = 'countdown' | 'live' | 'awaiting' | 'wrapped';

function topThree(category: Category): { items: StandingItem[]; kind: 'driver' | 'team' } {
  const s = category.standings;
  const drivers = s?.drivers?.length ? s.drivers : s?.driverClasses?.[0]?.entries;
  if (drivers?.length) return { items: [...drivers].sort((a, b) => a.position - b.position).slice(0, 3), kind: 'driver' };
  const teams = s?.constructors?.length ? s.constructors : s?.teams;
  return { items: [...(teams ?? [])].sort((a, b) => a.position - b.position).slice(0, 3), kind: 'team' };
}

export default function HomePage() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { categories, ready } = useLiveData();
  const { selectedId, select } = useSelectedCategory();
  const install = useInstall();
  const tributes = useTributes();
  const now = useNow(1000);

  const category = categories.find((c) => c.id === selectedId) ?? categories[0];

  // Mesma ordem do menu lateral: por grupo.
  const chips = useMemo(
    () =>
      CATEGORY_GROUPS.flatMap((group) => group.ids)
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is Category => Boolean(c))
        .map((c) => ({ value: c.id, label: c.name, icon: iconOfCategory(c.id), accent: accentOf(c.id) })),
    [categories],
  );

  const next = category ? nextRace(category.calendar, now) : null;
  const last = category ? completedRacesDesc(category.calendar)[0] : undefined;
  const race: Race | null = next ?? last ?? null;
  const phase: Phase = !next ? 'wrapped' : phaseOf(next, now);

  const leaders = category ? topThree(category) : { items: [], kind: 'driver' as const };
  const hasRules = (category?.rulesFormat?.length ?? 0) > 0;

  return (
    <div className="flex flex-col w-full px-margin pt-4 pb-8 space-y-space-lg page-in">
      <h1 className="sr-only">{t('nav.home')}</h1>

      {(install.canInstall || install.iosHint) && (
        <div className="flex items-center gap-3 rounded-lg bg-asphalt border border-hairline px-3.5 py-3">
          {install.canInstall ? <Download className="w-5 h-5 text-primary shrink-0" /> : <Share className="w-5 h-5 text-primary shrink-0" />}
          <p className="type-body-sm text-on-surface-variant flex-1">{install.canInstall ? t('home.installBody') : t('home.installIos')}</p>
          {install.canInstall ? (
            <button type="button" disabled={install.installing} onClick={() => void install.install()} className="px-3 py-1.5 rounded-sm bg-primary-container text-white type-label-badge uppercase tracking-wider active:scale-95 disabled:opacity-60">
              {t('home.install')}
            </button>
          ) : (
            <button type="button" onClick={install.dismissIosHint} aria-label={t('common.close')} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-lg lg:space-y-0">
        <div className="lg:col-span-7 space-y-space-lg">
          {/* HERO: proxima corrida da categoria escolhida */}
          {category && race ? (
            <div
              className="relative h-[400px] sm:h-[440px] overflow-hidden rounded-lg border border-hairline cursor-pointer"
              onClick={() => navigate(paths.race(category.id, race.id))}
              role="link"
              tabIndex={0}
              onKeyDown={(event) => event.key === 'Enter' && navigate(paths.race(category.id, race.id))}
              aria-label={raceTitle(race, lang)}
            >
              <HeroBackdrop race={race} categoryName={category.name} />
              <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
                <SkewBadge live={phase === 'live'}>
                  {phase === 'live' ? t('home.liveNow') : phase === 'awaiting' ? t('home.awaiting') : phase === 'wrapped' ? t('home.seasonWrapped') : t('home.nextRace')}
                </SkewBadge>
                <h2 className="type-headline-lg text-[28px] leading-[34px] uppercase text-white line-clamp-3">{raceTitle(race, lang)}</h2>
                {(race.circuit || racePlace(race, lang)) && (
                  <p className="flex items-center gap-2 type-label-badge text-on-surface-variant">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-2">{race.circuit && race.circuit !== racePlace(race, lang) ? race.circuit : racePlace(race, lang)}</span>
                  </p>
                )}
                <div className="pt-1">
                  {phase === 'countdown' && next && (hasStartTime(next) || raceStartDate(next).getTime() > now) ? (
                    <CountdownPanel target={raceStartDate(next).getTime()} labels={{ d: t('unit.days'), h: t('unit.hours'), m: t('unit.minutes') }} />
                  ) : phase === 'wrapped' && race.winner ? (
                    <div className="inline-flex rounded-sm bg-black/55 backdrop-blur-sm border border-hairline overflow-hidden max-w-full">
                      <span className="w-1 bg-primary shrink-0" aria-hidden />
                      <div className="px-4 py-3 min-w-0">
                        <p className="type-label-badge uppercase text-tertiary">{t('home.winner')}</p>
                        <p className="type-telemetry-counter text-[20px] text-white leading-6 truncate">{race.winner}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : !ready ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <div className="rounded-lg bg-asphalt border border-hairline p-space-md">
              <h2 className="type-headline-lg uppercase text-on-surface">{t('home.noUpcoming')}</h2>
              <p className="type-body-sm text-on-surface-variant mt-1">{t('home.noUpcomingHint')}</p>
            </div>
          )}

          {/* CHIPS DAS CATEGORIAS */}
          <PillStrip
            options={chips}
            value={selectedId}
            onChange={(id) => (id === selectedId ? navigate(paths.category(id)) : select(id))}
          />
        </div>

        <div className="lg:col-span-5 space-y-space-lg">
          {category && hasRules && (
            <HowItWorksCard to={paths.rules(category.id)} title={t('rules.entryTitle')} subtitle={t('rules.entrySubtitle', { name: category.name })} />
          )}

          {category && leaders.items.length > 0 && (
            <section className="space-y-4">
              <SectionTitle right={<Link to={paths.standingsOf(category.id)} className="hover:text-white">{t('nav.standings')} →</Link>}>{t('home.leaders')}</SectionTitle>
              <div className="rounded-lg bg-asphalt border border-hairline divide-y divide-hairline-soft overflow-hidden">
                {leaders.items.map((entry, index) => {
                  const driver = leaders.kind === 'driver' ? findCategoryDriver(category, entry.name) : undefined;
                  const team = leaders.kind === 'team' ? findCategoryTeam(category, entry.name) : undefined;
                  const to = driver ? paths.driver(category.id, driver.id) : team ? paths.team(category.id, team.id) : paths.standingsOf(category.id);
                  return (
                    <Link key={entry.name} to={to} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-asphalt-alt transition-colors">
                      <span className={cn('type-telemetry-counter w-7 shrink-0', index === 0 ? 'text-primary' : 'text-on-surface-variant')}>{pad2(entry.position)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="type-headline-md text-[18px] leading-[22px] uppercase text-on-surface block truncate">{entry.name}</span>
                        {(entry.team ?? team?.car) && <span className="type-label-telemetry uppercase text-on-surface-variant block truncate">{entry.team ?? team?.car}</span>}
                      </span>
                      <span className="type-telemetry-counter text-[22px] text-white">{formatPoints(entry.points)}</span>
                      <span className="type-label-telemetry uppercase text-on-surface-variant">{t('st.pts')}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* RODAPE */}
      <footer className="flex flex-col items-center justify-center pt-space-md pb-space-lg space-y-space-sm text-center">
        <button type="button" onClick={tributes.onFooterLogoTap} className="flex items-center gap-2 select-none" aria-label="PitStopHub">
          <span className="w-2 h-2 rounded-full bg-primary-container" />
          <span className="type-headline-sm uppercase text-on-surface">PitStopHub</span>
        </button>
        <p className="type-label-telemetry text-on-surface-variant">
          {t('home.footerCopy', { year: new Date().getFullYear() })}
          <br />
          {t('home.footerSub')}
        </p>
      </footer>
    </div>
  );
}

function phaseOf(race: Race, now: number): Phase {
  if (!hasStartTime(race)) return 'countdown';
  const start = raceStartDate(race).getTime();
  if (now >= start && now < start + LIVE_WINDOW_MS) return 'live';
  if (now >= start + LIVE_WINDOW_MS) return 'awaiting';
  return 'countdown';
}
