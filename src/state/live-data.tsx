import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MOTORSPORT_DATA, type Category, type CategoryStandings, type Driver, type Race, type StandingItem } from '../types';
import { fetchCategoryLiveData, mergeCategoryWithLiveData, type JolpicaCategoryData } from '../jolpica';
import {
  fetchSyncedCalendar,
  fetchSyncedStandings,
  getSyncedCategoryIds,
  mergeCategoryWithSyncedCalendar,
  mergeCategoryWithSyncedStandings,
} from '../synced-races';
import {
  fetchGtwcCalendar,
  fetchGtwcRoster,
  fetchGtwcStandings,
  getGtwcCategoryIds,
  mergeCategoryWithGtwcCalendar,
  mergeCategoryWithGtwcRoster,
  mergeCategoryWithGtwcStandings,
  type GtwcRoster,
} from '../gtwc-live';
import {
  fetchEbCalendar,
  fetchEbRoster,
  fetchEbStandings,
  getEnduranceBrasilCategoryIds,
  mergeCategoryWithEbCalendar,
  mergeCategoryWithEbRoster,
  mergeCategoryWithEbStandings,
  type EbRoster,
} from '../endurance-brasil-live';
import {
  fetchBrasilCalendar,
  fetchBrasilDrivers,
  fetchBrasilStandings,
  getBrasilCategoryIds,
  mergeCategoryWithBrasilCalendar,
  mergeCategoryWithBrasilDrivers,
  mergeCategoryWithBrasilStandings,
} from '../brasil-live';

type ById<T> = Partial<Record<string, T | null>>;

type LiveDataValue = {
  /** As 14 categorias ja combinadas com as fontes ao vivo (catalogo estatico como base). */
  categories: Category[];
  byId: Map<string, Category>;
  /** As sincronizacoes iniciais terminaram (antes disso, algumas categorias ainda mostram o catalogo estatico). */
  ready: boolean;
  /** F1 (Jolpica): ao vivo, carregando ou fora do ar. */
  f1State: 'loading' | 'ready' | 'error';
  refresh: () => void;
};

const LiveDataContext = createContext<LiveDataValue | null>(null);

const TEN_MIN = 10 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

/**
 * Orquestra todas as fontes de dados (Jolpica, TheSportsDB via Supabase, api-motorsports) e entrega
 * as categorias ja mescladas. Porte do que antes vivia dentro do App.tsx.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [f1Data, setF1Data] = useState<JolpicaCategoryData | null>(null);
  const [f1State, setF1State] = useState<LiveDataValue['f1State']>('loading');
  const [syncedCalendars, setSyncedCalendars] = useState<ById<Race[]>>({});
  const [syncedStandings, setSyncedStandings] = useState<ById<StandingItem[]>>({});
  const [syncedReady, setSyncedReady] = useState(false);
  const [gtwcCalendars, setGtwcCalendars] = useState<ById<Race[]>>({});
  const [gtwcRosters, setGtwcRosters] = useState<ById<GtwcRoster>>({});
  const [gtwcStandings, setGtwcStandings] = useState<ById<CategoryStandings>>({});
  const [gtwcReady, setGtwcReady] = useState(false);
  const [ebCalendars, setEbCalendars] = useState<ById<Race[]>>({});
  const [ebRosters, setEbRosters] = useState<ById<EbRoster>>({});
  const [ebStandings, setEbStandings] = useState<ById<CategoryStandings>>({});
  const [ebReady, setEbReady] = useState(false);
  const [brCalendars, setBrCalendars] = useState<ById<Race[]>>({});
  const [brDrivers, setBrDrivers] = useState<ById<Driver[]>>({});
  const [brStandings, setBrStandings] = useState<ById<CategoryStandings>>({});
  const [brReady, setBrReady] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  // Formula 1 (Jolpica)
  useEffect(() => {
    let mounted = true;
    const f1 = MOTORSPORT_DATA.find((category) => category.id === 'f1');
    if (!f1) return;

    const sync = async (force = false) => {
      try {
        const data = await fetchCategoryLiveData(f1, force);
        if (!mounted) return;
        setF1Data(data);
        setF1State(data ? 'ready' : 'error');
      } catch (error) {
        console.error('Falha ao sincronizar dados da Jolpica F1.', error);
        if (mounted) setF1State((prev) => (prev === 'ready' ? prev : 'error'));
      }
    };

    void sync(refreshTick > 0);
    const id = window.setInterval(() => void sync(true), TEN_MIN);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshTick]);

  // Categorias sincronizadas (Supabase): juntadas num unico update para evitar "saltos" de layout.
  useEffect(() => {
    let mounted = true;
    const sync = async (force = false) => {
      const results = await Promise.allSettled(
        getSyncedCategoryIds().map(async (categoryId) => {
          const [calendar, standings] = await Promise.all([
            fetchSyncedCalendar(categoryId, force),
            fetchSyncedStandings(categoryId, force),
          ]);
          return { categoryId, calendar, standings };
        }),
      );
      if (!mounted) return;
      setSyncedCalendars((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.calendar;
        return next;
      });
      setSyncedStandings((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.standings;
        return next;
      });
      setSyncedReady(true);
    };
    void sync(refreshTick > 0);
    const id = window.setInterval(() => void sync(true), THIRTY_MIN);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [refreshTick]);

  // GT World Challenge (api-motorsports)
  useEffect(() => {
    let mounted = true;
    const sync = async (force = false) => {
      const results = await Promise.allSettled(
        getGtwcCategoryIds().map(async (categoryId) => {
          const [calendar, roster, standings] = await Promise.all([
            fetchGtwcCalendar(categoryId, force),
            fetchGtwcRoster(categoryId, force),
            fetchGtwcStandings(categoryId, force),
          ]);
          return { categoryId, calendar, roster, standings };
        }),
      );
      if (!mounted) return;
      setGtwcCalendars((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.calendar;
        return next;
      });
      setGtwcRosters((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.roster;
        return next;
      });
      setGtwcStandings((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.standings;
        return next;
      });
      setGtwcReady(true);
    };
    void sync(refreshTick > 0);
    const id = window.setInterval(() => void sync(true), THIRTY_MIN);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [refreshTick]);

  // Endurance Brasil (api-motorsports)
  useEffect(() => {
    let mounted = true;
    const sync = async (force = false) => {
      const results = await Promise.allSettled(
        getEnduranceBrasilCategoryIds().map(async (categoryId) => {
          const [calendar, roster, standings] = await Promise.all([
            fetchEbCalendar(categoryId, force),
            fetchEbRoster(categoryId, force),
            fetchEbStandings(categoryId, force),
          ]);
          return { categoryId, calendar, roster, standings };
        }),
      );
      if (!mounted) return;
      setEbCalendars((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.calendar;
        return next;
      });
      setEbRosters((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.roster;
        return next;
      });
      setEbStandings((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.standings;
        return next;
      });
      setEbReady(true);
    };
    void sync(refreshTick > 0);
    const id = window.setInterval(() => void sync(true), THIRTY_MIN);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [refreshTick]);

  // NASCAR Brasil e Porsche Cup Brasil (api-motorsports)
  useEffect(() => {
    let mounted = true;
    const sync = async (force = false) => {
      const results = await Promise.allSettled(
        getBrasilCategoryIds().map(async (categoryId) => {
          const [calendar, drivers, standings] = await Promise.all([
            fetchBrasilCalendar(categoryId, force),
            fetchBrasilDrivers(categoryId, force),
            fetchBrasilStandings(categoryId, force),
          ]);
          return { categoryId, calendar, drivers, standings };
        }),
      );
      if (!mounted) return;
      setBrCalendars((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.calendar;
        return next;
      });
      setBrDrivers((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.drivers;
        return next;
      });
      setBrStandings((prev) => {
        const next = { ...prev };
        for (const r of results) if (r.status === 'fulfilled') next[r.value.categoryId] = r.value.standings;
        return next;
      });
      setBrReady(true);
    };
    void sync(refreshTick > 0);
    const id = window.setInterval(() => void sync(true), THIRTY_MIN);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [refreshTick]);

  const categories = useMemo(
    () =>
      MOTORSPORT_DATA.map((category) => {
        const live = category.id === 'f1' ? mergeCategoryWithLiveData(category, f1Data) : category;
        const calendarMerged = mergeCategoryWithSyncedCalendar(live, syncedCalendars[category.id] ?? null);
        const standingsMerged = mergeCategoryWithSyncedStandings(calendarMerged, syncedStandings[category.id] ?? null);
        const gtwcCalendarMerged = mergeCategoryWithGtwcCalendar(standingsMerged, gtwcCalendars[category.id] ?? null);
        const gtwcRosterMerged = mergeCategoryWithGtwcRoster(gtwcCalendarMerged, gtwcRosters[category.id] ?? null);
        const gtwcStandingsMerged = mergeCategoryWithGtwcStandings(gtwcRosterMerged, gtwcStandings[category.id] ?? null);
        const ebCalendarMerged = mergeCategoryWithEbCalendar(gtwcStandingsMerged, ebCalendars[category.id] ?? null);
        const ebRosterMerged = mergeCategoryWithEbRoster(ebCalendarMerged, ebRosters[category.id] ?? null);
        const ebStandingsMerged = mergeCategoryWithEbStandings(ebRosterMerged, ebStandings[category.id] ?? null);
        const brCalendarMerged = mergeCategoryWithBrasilCalendar(ebStandingsMerged, brCalendars[category.id] ?? null);
        const brDriversMerged = mergeCategoryWithBrasilDrivers(brCalendarMerged, brDrivers[category.id] ?? null);
        return mergeCategoryWithBrasilStandings(brDriversMerged, brStandings[category.id] ?? null);
      }),
    [
      f1Data, syncedCalendars, syncedStandings, gtwcCalendars, gtwcRosters, gtwcStandings,
      ebCalendars, ebRosters, ebStandings, brCalendars, brDrivers, brStandings,
    ],
  );

  const value = useMemo<LiveDataValue>(
    () => ({
      categories,
      byId: new Map(categories.map((category) => [category.id, category])),
      ready: syncedReady && gtwcReady && ebReady && brReady && f1State !== 'loading',
      f1State,
      refresh,
    }),
    [categories, syncedReady, gtwcReady, ebReady, brReady, f1State, refresh],
  );

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData(): LiveDataValue {
  const value = useContext(LiveDataContext);
  if (!value) throw new Error('useLiveData precisa estar dentro de <LiveDataProvider>');
  return value;
}

export function useCategory(categoryId: string | undefined): Category | undefined {
  const { byId } = useLiveData();
  return categoryId ? byId.get(categoryId) : undefined;
}
