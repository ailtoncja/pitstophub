import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Home, LayoutGrid, ListOrdered, Search, type LucideIcon } from 'lucide-react';
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
import { useSettings } from '../state/settings';
import { paths } from './paths';
import { ShellContext, type ShellApi } from './shell-context';

type NavItem = { to: string; key: string; icon: LucideIcon; end?: boolean; sections: string[] };

const NAV: NavItem[] = [
  { to: paths.home, key: 'nav.home', icon: Home, end: true, sections: [''] },
  { to: paths.calendar, key: 'nav.calendar', icon: CalendarDays, sections: ['calendario', 'circuito'] },
  { to: paths.standings, key: 'nav.standings', icon: ListOrdered, sections: ['classificacao'] },
  { to: paths.categories, key: 'nav.categories', icon: LayoutGrid, sections: ['categorias', 'piloto', 'equipe', 'campeoes'] },
];

const SUBTITLE: Record<string, string> = {
  '': 'nav.home',
  calendario: 'nav.calendar',
  classificacao: 'nav.standings',
  categorias: 'nav.categories',
  piloto: 'nav.driverProfile',
  equipe: 'nav.teamProfile',
  circuito: 'nav.circuitProfile',
  campeoes: 'nav.champions',
};

const SOON_MS = 48 * 3600_000;

type Sheet = 'search' | 'alerts' | 'profile' | null;

export default function AppShell() {
  const { t } = useT();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { categories } = useLiveData();
  const { prefs } = useSettings();
  const [sheet, setSheet] = useState<Sheet>(null);

  const section = pathname.split('/')[1] ?? '';
  const subtitle = t(SUBTITLE[section] ?? 'nav.home');

  // Bolinha vermelha do sino: tem etapa de algo que a pessoa acompanha nas proximas 48 h.
  const hasSoon = useMemo(() => {
    const followed = followedCategorySet(prefs);
    if (followed.size === 0) return false;
    const now = Date.now();
    return allUpcoming(categories.filter((c) => followed.has(c.id)), now).some(({ race }) => raceStartDate(race).getTime() - now <= SOON_MS);
  }, [categories, prefs]);

  const shell = useMemo<ShellApi>(
    () => ({
      openSearch: () => setSheet('search'),
      openAlerts: () => setSheet('alerts'),
      openProfile: () => setSheet('profile'),
    }),
    [],
  );
  const close = () => setSheet(null);

  return (
    <ShellContext.Provider value={shell}>
      <div className="min-h-dvh bg-surface text-on-surface">
        <header className="sticky top-0 z-50 bg-surface/85 backdrop-blur-md border-b border-surface-container-high pt-safe">
          <div className="mx-auto max-w-6xl px-margin h-16 flex items-center justify-between gap-4">
            <Link to={paths.home} className="flex items-center gap-2.5 min-w-0" aria-label="PitStopHub">
              <img src="/icons/icon-192.png" alt="" className="w-9 h-9 object-contain shrink-0" />
              <span className="flex flex-col leading-none min-w-0">
                <span className="type-headline-sm font-black italic uppercase tracking-tight text-text-primary">PitStopHub</span>
                <span className="type-label-telemetry uppercase tracking-widest text-text-muted mt-1 truncate">{subtitle}</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label={t('nav.label')}>
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={() =>
                    cn(
                      'px-3.5 py-2 rounded-lg type-label-badge uppercase tracking-wider transition-colors',
                      item.sections.includes(section) ? 'text-racing-red bg-racing-red/10' : 'text-text-secondary hover:text-text-primary',
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1 shrink-0">
              <HeaderButton label={t('shell.search')} onClick={shell.openSearch}><Search className="w-5 h-5" /></HeaderButton>
              <HeaderButton label={t('shell.alerts')} onClick={shell.openAlerts}>
                <Bell className="w-5 h-5" />
                {hasSoon && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-racing-red ring-2 ring-surface" aria-hidden />}
              </HeaderButton>
              <button
                type="button"
                onClick={shell.openProfile}
                aria-label={t('shell.profile')}
                className="ml-1 w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center type-label-badge font-black active:scale-90 transition-transform"
              >
                {user ? initials(user.name || user.email) : <ProfileGlyph />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container-high pb-safe" aria-label={t('nav.label')}>
          <ul className="grid grid-cols-4 h-16">
            {NAV.map((item) => {
              const active = item.sections.includes(section);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="relative h-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform" aria-current={active ? 'page' : undefined}>
                    {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-racing-red" aria-hidden />}
                    <Icon className={cn('w-[22px] h-[22px] transition-colors', active ? 'text-racing-red' : 'text-text-muted')} />
                    <span className={cn('type-label-telemetry uppercase tracking-wide transition-colors', active ? 'text-racing-red font-bold' : 'text-text-muted')}>{t(item.key)}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <SearchSheet open={sheet === 'search'} onClose={close} />
      <AlertsSheet open={sheet === 'alerts'} onClose={close} onOpenProfile={shell.openProfile} />
      <ProfileSheet open={sheet === 'profile'} onClose={close} />
      <OnboardingSheet />
    </ShellContext.Provider>
  );
}

function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="relative w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-container active:scale-90 transition-all">
      {children}
    </button>
  );
}

function ProfileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
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
