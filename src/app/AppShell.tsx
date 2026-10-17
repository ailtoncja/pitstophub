import { Suspense, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, House, LayoutGrid, Search, UserRound, type LucideIcon } from 'lucide-react';
import { AlertsSheet } from '../features/shell/AlertsSheet';
import { ProfileSheet } from '../features/shell/ProfileSheet';
import { SearchSheet } from '../features/shell/SearchSheet';
import { OnboardingSheet } from '../features/favorites/OnboardingSheet';
import { CategoryList } from '../components/CategoryList';
import { Skeleton, StateLegend } from '../components/ui';
import { allUpcoming, followedCategorySet } from '../lib/hero';
import { initials } from '../lib/format';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useAuth } from '../state/auth-context';
import { useLiveData } from '../state/live-data';
import { SelectedCategoryProvider, useSelectedCategory } from '../state/selected-category';
import { useSettings } from '../state/settings';
import { CategoryDrawer } from './CategoryDrawer';
import { paths } from './paths';
import { CATEGORY_SECTIONS, scopeCategoryId } from './scope';
import { ShellContext, type ShellApi } from './shell-context';

const SOON_MS = 48 * 3600_000;

type Sheet = 'search' | 'alerts' | 'profile' | null;

export default function AppShell() {
  return (
    <SelectedCategoryProvider>
      <Shell />
    </SelectedCategoryProvider>
  );
}

function Shell() {
  const { t } = useT();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { categories } = useLiveData();
  const { prefs } = useSettings();
  const { selectedId } = useSelectedCategory();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const section = pathname.split('/')[1] ?? '';
  const isHome = pathname === '/';
  const scopeId = scopeCategoryId(pathname, selectedId);

  // Bolinha vermelha do sino: tem etapa de algo que a pessoa acompanha nas proximas 48 h.
  const hasSoon = useMemo(() => {
    const followed = followedCategorySet(prefs);
    if (followed.size === 0) return false;
    const now = Date.now();
    return allUpcoming(categories.filter((c) => followed.has(c.id)), now).some(({ race }) => raceStartDate(race).getTime() - now <= SOON_MS);
  }, [categories, prefs]);

  const shell = useMemo<ShellApi>(
    () => ({
      openMenu: () => setMenuOpen(true),
      openSearch: () => setSheet('search'),
      openAlerts: () => setSheet('alerts'),
      openProfile: () => setSheet('profile'),
    }),
    [],
  );
  const close = () => setSheet(null);

  const bottomItems: { to: string; label: string; icon: LucideIcon; active: boolean; end?: boolean }[] = [
    { to: paths.home, label: t('nav.home'), icon: House, active: section === '', end: true },
    { to: paths.agenda, label: t('nav.agenda'), icon: CalendarDays, active: section === 'agenda' },
    { to: paths.categories, label: t('nav.categories'), icon: LayoutGrid, active: CATEGORY_SECTIONS.has(section) },
  ];

  return (
    <ShellContext.Provider value={shell}>
      <div className="min-h-dvh bg-carbon text-on-surface lg:pl-[264px]">
        {/* Trilho lateral (computador): navegacao, as 14 categorias e as acoes da conta */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[264px] flex-col bg-black border-r border-hairline" aria-label={t('nav.label')}>
          <Link to={paths.home} className="flex items-center gap-3 px-5 h-[72px] shrink-0" aria-label="PitStopHub">
            <img src="/icons/icon-192.png" alt="" className="w-9 h-9 object-contain" />
            <span className="text-[1.375rem] font-extrabold tracking-[-0.04em] text-white">PitStopHub</span>
          </Link>

          <div className="px-3 space-y-1 shrink-0">
            <button
              type="button"
              onClick={shell.openSearch}
              className="w-full h-11 px-3 rounded-xl border border-white/20 flex items-center gap-3 text-silver hover:text-white hover:border-white/50 transition-colors"
            >
              <Search className="w-[18px] h-[18px]" />
              <span className="type-body-md">{t('shell.search')}</span>
            </button>
            <RailLink to={paths.home} icon={House} end>{t('nav.home')}</RailLink>
            <RailLink to={paths.agenda} icon={CalendarDays}>{t('nav.agenda')}</RailLink>
            <RailLink to={paths.categories} icon={LayoutGrid} end>{t('nav.explore')}</RailLink>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-5 pb-4">
            <CategoryList activeId={scopeId} legend={false} />
          </div>

          <div className="shrink-0 px-6 py-3 border-t border-hairline">
            <StateLegend />
          </div>

          <div className="shrink-0 px-3 py-3 border-t border-hairline flex items-center gap-1">
            <button
              type="button"
              onClick={shell.openProfile}
              aria-label={t('shell.profile')}
              className="flex-1 min-w-0 h-11 px-2 rounded-xl flex items-center gap-3 text-white hover:bg-white/10 transition-colors"
            >
              <span className={cn('w-8 h-8 rounded-full flex items-center justify-center type-label-badge shrink-0', user ? 'bg-white text-black' : 'border border-white/30 text-silver')}>
                {user ? initials(user.name || user.email) : <UserRound className="w-4 h-4" />}
              </span>
              <span className="type-body-md truncate">{user ? user.name || user.email : t('profile.login')}</span>
            </button>
            <button
              type="button"
              onClick={shell.openAlerts}
              aria-label={t('shell.alerts')}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center text-silver hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {hasSoon && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-racing-red" role="img" aria-label={t('shell.alertsSoon')} />}
            </button>
          </div>
        </aside>

        {/* Barra do topo (celular) */}
        <header className="lg:hidden sticky top-0 z-40 bg-black border-b border-hairline pt-safe">
          <div className="h-14 flex items-center px-margin gap-1">
            <Link to={paths.home} className="flex items-center gap-2.5 flex-1 min-w-0" aria-label="PitStopHub">
              <img src="/icons/icon-192.png" alt="" className="w-8 h-8 object-contain" />
              <span className="text-[1.25rem] font-extrabold tracking-[-0.04em] text-white">PitStopHub</span>
            </Link>
            <button type="button" onClick={shell.openSearch} aria-label={t('shell.search')} className="w-11 h-11 flex items-center justify-center text-white active:scale-90 transition-transform">
              <Search className="w-[22px] h-[22px]" />
            </button>
            <button type="button" onClick={shell.openAlerts} aria-label={t('shell.alerts')} className="relative w-11 h-11 flex items-center justify-center text-white active:scale-90 transition-transform">
              <Bell className="w-[22px] h-[22px]" />
              {hasSoon && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-racing-red" role="img" aria-label={t('shell.alertsSoon')} />}
            </button>
          </div>
        </header>

        <main className={cn('w-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0', !isHome && 'mx-auto max-w-[1180px] lg:px-8')}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Navegacao inferior (celular) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-black border-t border-hairline pb-safe" aria-label={t('nav.label')}>
          <ul className="grid grid-cols-4 h-[4.25rem]">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} aria-current={item.active ? 'page' : undefined} className="h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
                    <Icon className={cn('w-6 h-6', item.active ? 'text-white' : 'text-silver-dim')} strokeWidth={item.active ? 2.4 : 1.8} />
                    <span className={cn('type-label-telemetry', item.active ? 'text-white font-bold' : 'text-silver-dim')}>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
            <li>
              <button type="button" onClick={shell.openProfile} aria-label={t('shell.profile')} className="w-full h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
                {user ? (
                  <span className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-[0.75rem] font-bold">{initials(user.name || user.email)}</span>
                ) : (
                  <UserRound className="w-6 h-6 text-silver-dim" strokeWidth={1.8} />
                )}
                <span className="type-label-telemetry text-silver-dim">{t('nav.profile')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <CategoryDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeId={scopeId} />
      <SearchSheet open={sheet === 'search'} onClose={close} />
      <AlertsSheet open={sheet === 'alerts'} onClose={close} onOpenProfile={shell.openProfile} />
      <ProfileSheet open={sheet === 'profile'} onClose={close} />
      <OnboardingSheet />
    </ShellContext.Provider>
  );
}

function RailLink({ to, icon: Icon, end, children }: { to: string; icon: LucideIcon; end?: boolean; children: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 h-11 px-3 rounded-xl type-body-md transition-colors duration-200',
          isActive ? 'bg-white text-black font-bold' : 'text-silver hover:text-white hover:bg-white/10',
        )
      }
    >
      <Icon className="w-[18px] h-[18px]" />
      {children}
    </NavLink>
  );
}

function PageFallback() {
  return (
    <div className="px-margin pt-6 space-y-3">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-40" />
      <Skeleton className="h-24" />
    </div>
  );
}
