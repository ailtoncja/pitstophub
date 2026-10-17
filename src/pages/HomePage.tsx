import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Share, X } from 'lucide-react';
import { paths } from '../app/paths';
import { HowItWorksCard } from '../components/pit';
import { CategoryDataState, ListGroup, SectionTitle, Skeleton } from '../components/ui';
import { Reel } from '../features/reel/Reel';
import { useTributes } from '../features/tributes/Tributes';
import { dataStateOf } from '../lib/categories-meta';
import { findCategoryDriver, findCategoryTeam } from '../lib/entities';
import { dayMonth, formatPoints, hasStartTime, raceTitle, timeOf } from '../lib/format';
import { allUpcoming, followedCategorySet } from '../lib/hero';
import { useT } from '../lib/i18n';
import { buildReel } from '../lib/reel';
import { useNow } from '../lib/useNow';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useInstall } from '../state/install';
import { useLiveData } from '../state/live-data';
import { useSettings } from '../state/settings';
import type { Category, StandingItem } from '../types';

const REEL_MAX = 8;
const LEADERS = 5;

function leadersOf(category: Category, n: number): { items: StandingItem[]; kind: 'driver' | 'team' } {
  const s = category.standings;
  const drivers = s?.drivers?.length ? s.drivers : s?.driverClasses?.[0]?.entries;
  if (drivers?.length) return { items: [...drivers].sort((a, b) => a.position - b.position).slice(0, n), kind: 'driver' };
  const teams = s?.constructors?.length ? s.constructors : s?.teams;
  return { items: [...(teams ?? [])].sort((a, b) => a.position - b.position).slice(0, n), kind: 'team' };
}

export default function HomePage() {
  const { t } = useT();
  const { categories, ready } = useLiveData();
  const { prefs } = useSettings();
  const now = useNow(30_000);
  const [activeIndex, setActiveIndex] = useState(0);

  // No celular a propria pagina encaixa nos itens do reel (ver .reel em index.css).
  useEffect(() => {
    document.documentElement.classList.add('reel-page');
    return () => document.documentElement.classList.remove('reel-page');
  }, []);

  const followed = useMemo(() => followedCategorySet(prefs), [prefs]);
  const items = useMemo(() => buildReel(categories, followed, now, REEL_MAX), [categories, followed, now]);
  const onActive = useCallback((index: number) => setActiveIndex(index), []);
  const active = items[Math.min(activeIndex, Math.max(0, items.length - 1))];

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px] page-in">
      <h1 className="sr-only">{t('nav.home')}</h1>

      <section aria-label={t('reel.label')} className="xl:sticky xl:top-0 xl:h-dvh">
        {items.length > 0 ? (
          <Reel items={items} activeIndex={activeIndex} onActive={onActive} className="xl:h-dvh" />
        ) : !ready ? (
          <Skeleton className="h-[calc(100dvh-8rem)] lg:h-dvh rounded-none" />
        ) : (
          <div className="h-[60dvh] flex flex-col items-center justify-center text-center px-6">
            <h2 className="type-headline-lg text-white">{t('home.noUpcoming')}</h2>
            <p className="type-body-md text-silver mt-2 max-w-sm">{t('home.noUpcomingHint')}</p>
          </div>
        )}
      </section>

      <HomeAside active={active?.category} categories={categories} now={now} />
    </div>
  );
}

function HomeAside({ active, categories, now }: { active?: Category; categories: Category[]; now: number }) {
  const { t, lang } = useT();
  const install = useInstall();
  const tributes = useTributes();
  const leaders = active ? leadersOf(active, LEADERS) : { items: [], kind: 'driver' as const };
  const upcoming = useMemo(() => allUpcoming(categories, now).slice(0, 8), [categories, now]);
  const hasRules = (active?.rulesFormat?.length ?? 0) > 0;

  return (
    <aside className="px-margin lg:px-8 xl:px-6 py-8 space-y-9 xl:h-dvh xl:overflow-y-auto xl:border-l xl:border-hairline" aria-label={t('home.aside')}>
      {(install.canInstall || install.iosHint) && (
        <div className="flex items-center gap-3 rounded-2xl bg-asphalt border border-hairline px-4 py-3.5">
          {install.canInstall ? <Download className="w-5 h-5 text-white shrink-0" /> : <Share className="w-5 h-5 text-white shrink-0" />}
          <p className="type-body-sm text-silver flex-1">{install.canInstall ? t('home.installBody') : t('home.installIos')}</p>
          {install.canInstall ? (
            <button type="button" disabled={install.installing} onClick={() => void install.install()} className="h-9 px-4 rounded-full bg-white text-black type-label-badge active:scale-95 disabled:opacity-60">
              {t('home.install')}
            </button>
          ) : (
            <button type="button" onClick={install.dismissIosHint} aria-label={t('common.close')} className="w-9 h-9 flex items-center justify-center text-silver hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {active && leaders.items.length > 0 && (
        <section className="space-y-3">
          <SectionTitle right={<Link to={paths.standingsOf(active.id)}>{t('home.fullStandings')} →</Link>}>{t('home.standingsOf', { name: active.name })}</SectionTitle>
          <ListGroup>
            {leaders.items.map((entry) => {
              const driver = leaders.kind === 'driver' ? findCategoryDriver(active, entry.name) : undefined;
              const team = leaders.kind === 'team' ? findCategoryTeam(active, entry.name) : undefined;
              const to = driver ? paths.driver(active.id, driver.id) : team ? paths.team(active.id, team.id) : paths.standingsOf(active.id);
              return (
                <Link key={entry.name} to={to} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                  <span className={cn('type-headline-sm tabular w-6 shrink-0', entry.position === 1 ? 'text-white' : 'text-silver')}>{entry.position}</span>
                  <span className="flex-1 min-w-0">
                    <span className="type-body-md font-semibold text-white block truncate">{entry.name}</span>
                    {(entry.team ?? team?.car) && <span className="type-body-sm text-silver block truncate">{entry.team ?? team?.car}</span>}
                  </span>
                  <span className="type-headline-sm text-white tabular">{formatPoints(entry.points)}</span>
                </Link>
              );
            })}
          </ListGroup>
          <CategoryDataState categoryId={active.id} />
          {dataStateOf(active.id) === 'catalog' && <p className="type-body-sm text-silver">{t('state.catalogNote')}</p>}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <SectionTitle right={<Link to={paths.agenda}>{t('home.fullAgenda')} →</Link>}>{t('nav.agenda')}</SectionTitle>
          <ListGroup>
            {upcoming.map(({ category, race }) => {
              const date = raceStartDate(race);
              return (
                <Link key={`${category.id}-${race.id}`} to={paths.race(category.id, race.id)} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                  <span className="type-label-badge text-silver tabular w-12 shrink-0">{dayMonth(date, lang)}</span>
                  <span className="flex-1 min-w-0">
                    <span className="type-body-md font-semibold text-white block truncate">{raceTitle(race, lang)}</span>
                    <span className="type-body-sm text-silver block truncate">{category.name}</span>
                  </span>
                  <span className="type-label-badge text-white tabular shrink-0">{hasStartTime(race) ? timeOf(date, lang) : '—'}</span>
                </Link>
              );
            })}
          </ListGroup>
        </section>
      )}

      {active && hasRules && (
        <HowItWorksCard to={paths.rules(active.id)} title={t('rules.entryTitle')} subtitle={t('rules.entrySubtitle', { name: active.name })} />
      )}

      <footer className="flex flex-col items-start gap-2 pt-2 pb-4">
        <button type="button" onClick={tributes.onFooterLogoTap} className="flex items-center gap-2.5 select-none" aria-label="PitStopHub">
          <span className="w-2 h-2 rounded-full bg-racing-red" />
          <span className="type-headline-sm text-white">PitStopHub</span>
        </button>
        <p className="type-body-sm text-silver-dim">
          {t('home.footerCopy', { year: new Date().getFullYear() })}
          <br />
          {t('home.footerSub')}
        </p>
      </footer>
    </aside>
  );
}
