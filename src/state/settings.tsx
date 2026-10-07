import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getUserSettings, saveUserSettings } from '../auth';
import { followKey } from '../lib/entities';
import type { Lang } from '../lib/format';
import { useAuth } from './auth-context';

export type NotifyPrefs = {
  notifyRaceDay: boolean;
  notifyT60: boolean;
  notifyStart: boolean;
  notifyResults: boolean;
};

type Prefs = NotifyPrefs & {
  favoriteCategoryId: string;
  followedCategoryIds: string[];
  followedTeamIds: string[];
  followedDriverIds: string[];
  favoritesOnboarded: boolean;
  priorityFollowIds: string[];
};

const LANG_KEY = 'pitstophub_lang';

const defaultPrefs: Prefs = {
  favoriteCategoryId: 'f1',
  followedCategoryIds: [],
  followedTeamIds: [],
  followedDriverIds: [],
  favoritesOnboarded: true, // visitante nao passa pelo onboarding de favoritos
  priorityFollowIds: [],
  notifyRaceDay: true,
  notifyT60: true,
  notifyStart: true,
  notifyResults: true,
};

/** Idioma salvo no aparelho (ou o do navegador). Exportado para o modal de login, que fica acima deste provider. */
export function readStoredLanguage(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === 'pt' || stored === 'en') return stored;
  } catch {
    // storage indisponivel: usa o idioma do navegador
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'pt';
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

type SettingsValue = {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  /** Configuracoes carregadas (ou visitante). */
  ready: boolean;
  prefs: Prefs;
  isFollowingCategory: (categoryId: string) => boolean;
  isFollowingTeam: (categoryId: string, teamId: string) => boolean;
  isFollowingDriver: (categoryId: string, driverId: string) => boolean;
  /** Seguir exige conta (as notificacoes saem do servidor). Visitante cai no login. Devolve se aplicou. */
  toggleCategory: (categoryId: string) => boolean;
  toggleTeam: (categoryId: string, teamId: string) => boolean;
  toggleDriver: (categoryId: string, driverId: string) => boolean;
  setNotify: (key: keyof NotifyPrefs, value: boolean) => void;
  movePriority: (key: string, direction: -1 | 1) => void;
  setFavoriteCategory: (categoryId: string) => void;
  finishOnboarding: () => void;
  showOnboarding: boolean;
};

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, requestLogin } = useAuth();
  const [language, setLanguageState] = useState<Lang>(readStoredLanguage);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [ready, setReady] = useState(false);

  const setLanguage = useCallback((lang: Lang) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // so nao persiste
    }
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  }, [language]);

  // Carrega as configuracoes da conta (ou volta ao padrao de visitante).
  useEffect(() => {
    if (!user) {
      setPrefs(defaultPrefs);
      setReady(true);
      return;
    }
    let mounted = true;
    setReady(false);
    (async () => {
      try {
        const settings = await getUserSettings(user.id);
        if (!mounted) return;
        if (settings) {
          setLanguage(settings.language);
          setPrefs({
            favoriteCategoryId: settings.favoriteCategoryId,
            followedCategoryIds: settings.followedCategoryIds,
            followedTeamIds: settings.followedTeamIds,
            followedDriverIds: settings.followedDriverIds,
            favoritesOnboarded: settings.favoritesOnboarded,
            priorityFollowIds: settings.priorityFollowIds,
            notifyRaceDay: settings.notifyRaceDay,
            notifyT60: settings.notifyT60,
            notifyStart: settings.notifyStart,
            notifyResults: settings.notifyResults,
          });
        } else {
          setPrefs({ ...defaultPrefs, favoritesOnboarded: false });
        }
      } catch (error) {
        console.error('Falha ao aplicar configuracoes do usuario.', error);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Salva (debounce) quando algo muda.
  useEffect(() => {
    if (!user || !ready) return;
    const timer = window.setTimeout(() => {
      void saveUserSettings(user.id, {
        theme: 'dark',
        language,
        favoriteCategoryId: prefs.favoriteCategoryId,
        followedCategoryIds: prefs.followedCategoryIds,
        followedTeamIds: prefs.followedTeamIds,
        followedDriverIds: prefs.followedDriverIds,
        favoritesOnboarded: prefs.favoritesOnboarded,
        priorityFollowIds: prefs.priorityFollowIds,
        notifyRaceDay: prefs.notifyRaceDay,
        notifyT60: prefs.notifyT60,
        notifyStart: prefs.notifyStart,
        notifyResults: prefs.notifyResults,
        timezone: browserTimeZone(),
      }).catch((error) => console.error('Falha ao salvar configuracoes do usuario.', error));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [user, ready, language, prefs]);

  // Mantem a ordem de prioridade sincronizada com quem a pessoa segue (regra do app antigo):
  // preserva a ordem, remove quem deixou de ser seguido e poe no fim quem passou a ser.
  useEffect(() => {
    if (!ready) return;
    const valid = new Set([
      ...prefs.followedTeamIds.map((k) => `team::${k}`),
      ...prefs.followedDriverIds.map((k) => `driver::${k}`),
    ]);
    setPrefs((prev) => {
      const next = prev.priorityFollowIds.filter((k) => valid.has(k));
      const present = new Set(next);
      for (const k of valid) if (!present.has(k)) next.push(k);
      if (next.length === prev.priorityFollowIds.length && next.every((v, i) => v === prev.priorityFollowIds[i])) return prev;
      return { ...prev, priorityFollowIds: next };
    });
  }, [prefs.followedTeamIds, prefs.followedDriverIds, ready]);

  const toggleIn = useCallback(
    (field: 'followedCategoryIds' | 'followedTeamIds' | 'followedDriverIds', value: string): boolean => {
      if (!user) {
        requestLogin();
        return false;
      }
      setPrefs((prev) => ({
        ...prev,
        [field]: prev[field].includes(value) ? prev[field].filter((id) => id !== value) : [...prev[field], value],
      }));
      return true;
    },
    [user, requestLogin],
  );

  const value = useMemo<SettingsValue>(() => {
    const categories = new Set(prefs.followedCategoryIds);
    const teams = new Set(prefs.followedTeamIds);
    const drivers = new Set(prefs.followedDriverIds);
    return {
      language,
      setLanguage,
      ready,
      prefs,
      isFollowingCategory: (id) => categories.has(id),
      isFollowingTeam: (categoryId, teamId) => teams.has(followKey(categoryId, teamId)),
      isFollowingDriver: (categoryId, driverId) => drivers.has(followKey(categoryId, driverId)),
      toggleCategory: (id) => toggleIn('followedCategoryIds', id),
      toggleTeam: (categoryId, teamId) => toggleIn('followedTeamIds', followKey(categoryId, teamId)),
      toggleDriver: (categoryId, driverId) => toggleIn('followedDriverIds', followKey(categoryId, driverId)),
      setNotify: (key, v) => setPrefs((prev) => ({ ...prev, [key]: v })),
      movePriority: (key, direction) =>
        setPrefs((prev) => {
          const idx = prev.priorityFollowIds.indexOf(key);
          const target = idx + direction;
          if (idx === -1 || target < 0 || target >= prev.priorityFollowIds.length) return prev;
          const next = [...prev.priorityFollowIds];
          [next[idx], next[target]] = [next[target], next[idx]];
          return { ...prev, priorityFollowIds: next };
        }),
      setFavoriteCategory: (categoryId) => setPrefs((prev) => (prev.favoriteCategoryId === categoryId ? prev : { ...prev, favoriteCategoryId: categoryId })),
      finishOnboarding: () => setPrefs((prev) => ({ ...prev, favoritesOnboarded: true })),
      showOnboarding: Boolean(user) && ready && !prefs.favoritesOnboarded,
    };
  }, [language, setLanguage, ready, prefs, toggleIn, user]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings precisa estar dentro de <SettingsProvider>');
  return value;
}
