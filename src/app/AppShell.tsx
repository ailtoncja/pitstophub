import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Home, ListOrdered, Menu, Search, Users, type LucideIcon } from 'lucide-react';
import { AlertsSheet } from '../features/shell/AlertsSheet';
import { ProfileSheet } from '../features/shell/ProfileSheet';
import { SearchSheet } from '../features/shell/SearchSheet';
import { OnboardingSheet } from '../features/favorites/OnboardingSheet';
import { Skeleton } from '../components/ui';
import { allUpcoming, followedCategorySet } from '../lib/hero';
import { initials } from '../lib/format';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useAuth } from '../state/auth-context';
import { useLiveData } from '../state/live-data';
import { SelectedCategoryProvider } from '../state/selected-category';
import { useSettings } from '../state/settings';
import { CategoryDrawer } from './CategoryDrawer';
import { paths } from './paths';
import { ShellContext, type ShellApi } from './shell-context';

type NavItem = { to: string; key: string; icon: LucideIcon; end?: boolean; sections: string[] };

// As quatro abas do app: a categoria escolhida (menu lateral ou chips da Inicio) comanda todas.
const NAV: NavItem[] = [
  { to: paths.home, key: 'nav.home', icon: Home, end: true, sections: [''] },
  { to: paths.calendar, key: 'nav.calendar', icon: CalendarDays, sections: ['calendario', 'circuito'] },
  { to: paths.standings, key: 'nav.standings', icon: ListOrdered, sections: ['classificacao'] },
  { to: paths.grid, key: 'nav.grid', icon: Users, sections: ['grid', 'piloto', 'equipe'] },
];

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
  const [sheet, setSheet] = useState<Sheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const section = pathname.split('/')[1] ?? '';

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

  return (
    <ShellContext.Provider value={shell}>
      <div className="min-h-dvh bg-carbon text-on-surface">
        <header className="sticky top-0 z-50 bg-surface border-b-2 border-outline-variant pt-safe">
          <div className="mx-auto max-w-6xl h-16 flex items-center px-1 md:px-margin gap-1">
            <HeaderButton label={t('shell.menu')} onClick={shell.openMenu} className="text-primary"><Menu className="w-6 h-6" /></HeaderButton>

            <Link to={paths.home} className="flex-1 md:flex-none md:mr-6 text-center md:text-left min-w-0" aria-label="PitStopHub">
              <span className="type-headline-lg text-[24px] leading-none font-black italic uppercase tracking-[-0.05em] text-primary">PitStopHub</span>
            </Link>

            <nav className="hidden md:flex flex-1 items-center gap-1" aria-label={t('nav.label')}>
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={() =>
                    cn(
                      'px-3.5 py-2 rounded-sm type-label-badge uppercase tracking-wider transition-colors',
                      item.sections.includes(section) ? 'text-primary bg-primary-container/15' : 'text-on-surface-variant hover:text-white',
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center shrink-0">
              <HeaderButton label={t('shell.search')} onClick={shell.openSearch}><Search className="w-[22px] h-[22px]" /></HeaderButton>
              <HeaderButton label={t('shell.alerts')} onClick={shell.openAlerts}>
                <Bell className="w-[22px] h-[22px]" />
                {hasSoon && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container" aria-hidden />}
              </HeaderButton>
              <button
                type="button"
                onClick={shell.openProfile}
                aria-label={t('shell.profile')}
                className={cn(
                  'ml-1 mr-2 w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center type-label-badge font-bold active:scale-90 transition-transform',
                  user ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                {user ? initials(user.name || user.email) : <ProfileGlyph />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl w-full pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-10">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-highest pb-safe" aria-label={t('nav.label')}>
          <div className="h-1 bg-primary-container" aria-hidden />
          <ul className="grid grid-cols-4 h-[72px] px-1">
            {NAV.map((item) => {
              const active = item.sections.includes(section);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="h-full flex flex-col items-center active:scale-95 transition-transform" aria-current={active ? 'page' : undefined}>
                    <span className={cn('w-full h-1', active ? 'bg-primary' : 'bg-transparent')} aria-hidden />
                    <Icon className={cn('w-6 h-6 mt-2.5', active ? 'text-primary' : 'text-on-surface-variant/70')} strokeWidth={active ? 2.4 : 1.8} />
                    <span className={cn('type-label-telemetry uppercase mt-0.5', active ? 'text-primary font-bold' : 'text-on-surface-variant/70')}>{t(item.key)}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <CategoryDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchSheet open={sheet === 'search'} onClose={close} />
      <AlertsSheet open={sheet === 'alerts'} onClose={close} onOpenProfile={shell.openProfile} />
      <ProfileSheet open={sheet === 'profile'} onClose={close} />
      <OnboardingSheet />
    </ShellContext.Provider>
  );
}

function HeaderButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn('relative w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-white active:scale-90 transition-all', className)}>
      {children}
    </button>
  );
}

function ProfileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7z" />
    </svg>
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
