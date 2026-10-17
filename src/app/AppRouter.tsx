import { lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, EmptyState } from '../components/ui';
import { useT } from '../lib/i18n';
import { MOTORSPORT_DATA } from '../types';
import AppShell from './AppShell';
import { paths } from './paths';

const HomePage = lazy(() => import('../pages/HomePage'));
const AgendaPage = lazy(() => import('../pages/AgendaPage'));
const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const StandingsPage = lazy(() => import('../pages/StandingsPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const DriverPage = lazy(() => import('../pages/DriverPage'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const RacePage = lazy(() => import('../pages/RacePage'));
const ChampionsPage = lazy(() => import('../pages/ChampionsPage'));
const GridPage = lazy(() => import('../pages/GridPage'));
const RulesPage = lazy(() => import('../pages/RulesPage'));

const CATEGORY_IDS = new Set(MOTORSPORT_DATA.map((category) => category.id));

/** Links antigos e de notificacao push (`/?c=<categoria>`) abrem o calendario daquela categoria. */
function HomeEntry() {
  const [params] = useSearchParams();
  const legacy = params.get('c');
  if (legacy && CATEGORY_IDS.has(legacy)) return <Navigate to={paths.calendarOf(legacy)} replace />;
  return <HomePage />;
}

/** Clique numa notificacao com o app aberto: o service worker avisa a pagina em vez de recarregar. */
function NotificationLinks() {
  const navigate = useNavigate();
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'pitstophub-open' || typeof event.data.url !== 'string') return;
      try {
        const url = new URL(event.data.url, window.location.origin);
        if (url.origin === window.location.origin) navigate(`${url.pathname}${url.search}`);
      } catch {
        // URL invalida: ignora
      }
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [navigate]);
  return null;
}

function NotFound() {
  const { t } = useT();
  return (
    <div className="px-margin pt-6">
      <EmptyState
        title={t('app.notFound')}
        hint={t('app.notFoundHint')}
        action={<Button to={paths.home}>{t('nav.home')}</Button>}
      />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <NotificationLinks />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomeEntry />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="classificacao" element={<StandingsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="categorias/:categoryId" element={<CategoryPage />} />
          <Route path="piloto/:categoryId/:driverId" element={<DriverPage />} />
          <Route path="equipe/:categoryId/:teamId" element={<TeamPage />} />
          <Route path="circuito/:categoryId/:raceId" element={<RacePage />} />
          <Route path="campeoes" element={<ChampionsPage />} />
          <Route path="grid" element={<GridPage />} />
          <Route path="como-funciona/:categoryId" element={<RulesPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
