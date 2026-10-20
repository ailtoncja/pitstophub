import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase, SUPABASE_STORAGE_KEY } from './supabase';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type UserSettings = {
  theme: 'dark' | 'light';
  language: 'pt' | 'en';
  favoriteCategoryId: string;
  followedCategoryIds: string[];
  followedTeamIds: string[];
  followedDriverIds: string[];
  favoritesOnboarded: boolean;
  priorityFollowIds: string[];
  notifyRaceDay: boolean;
  notifyT60: boolean;
  notifyStart: boolean;
  notifyResults: boolean;
  timezone: string;
};

type AuthSuccess =
  | { ok: true; status: 'authenticated'; user: AuthUser }
  | { ok: true; status: 'pending_verification'; message: string };

const AUTH_THEME_KEY = 'pitstophub_auth_theme_v1';
const SETTINGS_CACHE_PREFIX = 'pitstophub_settings_v2_';
const SUPABASE_REQUEST_TIMEOUT_MS = 5000;
export const MIN_PASSWORD_LENGTH = 10;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = SUPABASE_REQUEST_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Tempo limite excedido apos ${timeoutMs}ms.`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const REGISTER_FAILED_MESSAGE = 'Nao foi possivel criar a conta. Se ja tiver cadastro, entre ou recupere a senha.';
export const LOGIN_FAILED_MESSAGE = 'Email ou senha invalidos.';
const RATE_LIMIT_MESSAGE = 'Muitas tentativas de envio de email em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';

/**
 * Traduz o erro do Supabase para uma mensagem segura de mostrar na tela.
 * Nunca repassa o texto cru do servidor e nao diz se o email ja tem conta
 * (evita enumeracao de contas): fora limite de tentativas e regra de senha,
 * tudo cai numa mensagem neutra.
 */
export function mapAuthErrorMessage(message: string | undefined, mode: 'login' | 'register') {
  const normalized = (message ?? '').toLowerCase();

  if (
    normalized.includes('email rate limit exceeded') ||
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('security purposes') ||
    normalized.includes('too many requests')
  ) {
    return RATE_LIMIT_MESSAGE;
  }

  if (mode === 'register') {
    // Regra de senha nao revela nada sobre a conta, entao vale mostrar.
    if (normalized.includes('password should be at least')) {
      return `A senha deve ter no minimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (normalized.includes('password') && normalized.includes('weak')) {
      return 'Escolha uma senha mais forte para proteger sua conta.';
    }
    return REGISTER_FAILED_MESSAGE;
  }

  // O Supabase so responde "email not confirmed" depois de conferir a senha,
  // entao nao serve para descobrir contas -- e ajuda quem acabou de se cadastrar.
  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar. O link esta na sua caixa de entrada.';
  }

  return LOGIN_FAILED_MESSAGE;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { user?: User };
    if (!session?.user) return null;
    return mapAuthUser(session.user);
  } catch {
    return null;
  }
}

export function mapAuthUser(user: User): AuthUser {
  const email = user.email ?? '';
  const metadataName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '';
  const name = metadataName || email.split('@')[0] || 'Usuario';
  return {
    id: user.id,
    name,
    email,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

async function ensureUserSettingsRow(userId: string) {
  if (!supabase) return;
  try {
    await withTimeout(Promise.resolve(
      supabase.from('user_settings').upsert(
        {
          user_id: userId,
          theme: 'dark',
          language: 'pt',
          favorite_category_id: 'f1',
          followed_category_ids: [],
          followed_team_ids: [],
          followed_driver_ids: [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )
    ));
  } catch (error) {
    console.error('Falha ao garantir a linha de configuracoes do usuario.', error);
  }
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(supabase.auth.getSession());
    if (error || !data.session?.user) return null;
    return mapAuthUser(data.session.user);
  } catch (error) {
    console.error('Falha ao carregar sessao atual.', error);
    return null;
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSuccess | { ok: false; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Login indisponivel no momento. Configure o Supabase no ambiente.',
    };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2) return { ok: false, message: 'Nome deve ter pelo menos 2 caracteres.' };
  if (!email.includes('@') || email.length < 5) return { ok: false, message: 'Email invalido.' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Senha deve ter no minimo ${MIN_PASSWORD_LENGTH} caracteres.` };
  }

  let result: Awaited<ReturnType<typeof supabase.auth.signUp>>;
  try {
    result = await withTimeout(supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    }));
  } catch (requestError) {
    console.error('Falha ao criar conta.', requestError);
    return { ok: false, message: REGISTER_FAILED_MESSAGE };
  }
  const { data, error } = result;

  if (error) return { ok: false, message: mapAuthErrorMessage(error.message, 'register') };
  if (!data.user) return { ok: false, message: REGISTER_FAILED_MESSAGE };

  if (!data.session) {
    return {
      ok: true,
      status: 'pending_verification',
      message: 'Verifique seu email para confirmar o cadastro antes de entrar. Se ja tiver conta, entre ou recupere a senha.',
    };
  }

  void ensureUserSettingsRow(data.user.id);
  return { ok: true, status: 'authenticated', user: mapAuthUser(data.user) };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSuccess | { ok: false; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Login indisponivel no momento. Configure o Supabase no ambiente.',
    };
  }

  let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
  try {
    result = await withTimeout(supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }));
  } catch (requestError) {
    console.error('Falha ao entrar.', requestError);
    return { ok: false, message: 'Nao foi possivel entrar agora. Verifique a conexao e tente novamente.' };
  }
  const { data, error } = result;

  if (error || !data.user) {
    return { ok: false, message: mapAuthErrorMessage(error?.message, 'login') };
  }

  void ensureUserSettingsRow(data.user.id);
  return { ok: true, status: 'authenticated', user: mapAuthUser(data.user) };
}

/** Apaga o que fica salvo no aparelho para a sessao: token do Supabase e cache de configuracoes. */
function clearLocalAuthData(userId?: string) {
  try {
    localStorage.removeItem(SUPABASE_STORAGE_KEY);
    if (userId) localStorage.removeItem(`${SETTINGS_CACHE_PREFIX}${userId}`);
  } catch {
    // localStorage indisponivel (modo privado etc.): nada a limpar
  }
}

/**
 * Sai da conta sempre, mesmo sem rede: tenta o signOut global (revoga o
 * refresh token no servidor); se falhar ou passar do tempo, encerra so a
 * sessao local. No fim, apaga o token e o cache do aparelho de qualquer jeito.
 */
export async function logoutUser(userId?: string) {
  try {
    if (!supabase) return;
    try {
      const { error } = await withTimeout(supabase.auth.signOut());
      if (error) throw error;
    } catch (globalError) {
      console.warn('Falha ao encerrar a sessao no servidor; encerrando so neste aparelho.', globalError);
      try {
        await withTimeout(supabase.auth.signOut({ scope: 'local' }));
      } catch (localError) {
        console.warn('Falha ao encerrar a sessao local.', localError);
      }
    }
  } finally {
    clearLocalAuthData(userId);
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const cacheKey = `${SETTINGS_CACHE_PREFIX}${userId}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Partial<UserSettings>;
      return {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        language: parsed.language === 'en' ? 'en' : 'pt',
        favoriteCategoryId: parsed.favoriteCategoryId ?? 'f1',
        followedCategoryIds: parsed.followedCategoryIds ?? [],
        followedTeamIds: parsed.followedTeamIds ?? [],
        followedDriverIds: parsed.followedDriverIds ?? [],
        favoritesOnboarded: parsed.favoritesOnboarded ?? false,
        priorityFollowIds: parsed.priorityFollowIds ?? [],
        notifyRaceDay: parsed.notifyRaceDay !== false,
        notifyT60: parsed.notifyT60 !== false,
        notifyStart: parsed.notifyStart !== false,
        notifyResults: parsed.notifyResults !== false,
        timezone: parsed.timezone || 'America/Sao_Paulo',
      };
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  if (!supabase) return null;

  // As colunas favorites_onboarded/priority_follow_ids exigem a migracao em
  // supabase/favorites_schema.sql. Se ela ainda nao rodou no banco, o select
  // completo falha (coluna inexistente) -- cai para o select legado abaixo
  // em vez de quebrar o carregamento de tema/idioma/follows de todo mundo.
  try {
    const response = await withTimeout(Promise.resolve(
      supabase
        .from('user_settings')
        .select('theme, language, favorite_category_id, followed_category_ids, followed_team_ids, followed_driver_ids, favorites_onboarded, priority_follow_ids, notify_race_day, notify_t60, notify_start, notify_results, timezone')
        .eq('user_id', userId)
        .maybeSingle()
    ));
    let { data, error } = response;

    if (error) {
      const favorites = await withTimeout(Promise.resolve(
        supabase
          .from('user_settings')
          .select('theme, language, favorite_category_id, followed_category_ids, followed_team_ids, followed_driver_ids, favorites_onboarded, priority_follow_ids')
          .eq('user_id', userId)
          .maybeSingle()
      ));
      data = favorites.data as typeof data;
      error = favorites.error;
    }

    if (error) {
      const legacy = await withTimeout(Promise.resolve(
        supabase
          .from('user_settings')
          .select('theme, language, favorite_category_id, followed_category_ids, followed_team_ids, followed_driver_ids')
          .eq('user_id', userId)
          .maybeSingle()
      ));
      data = legacy.data as typeof data;
      error = legacy.error;
    }

    if (error || !data) return null;

    const settings: UserSettings = {
      theme: data.theme === 'light' ? 'light' : 'dark',
      language: data.language === 'en' ? 'en' : 'pt',
      favoriteCategoryId: data.favorite_category_id ?? 'f1',
      followedCategoryIds: Array.isArray(data.followed_category_ids) ? data.followed_category_ids : [],
      followedTeamIds: Array.isArray(data.followed_team_ids) ? data.followed_team_ids : [],
      followedDriverIds: Array.isArray(data.followed_driver_ids) ? data.followed_driver_ids : [],
      favoritesOnboarded: (data as { favorites_onboarded?: boolean }).favorites_onboarded ?? false,
      priorityFollowIds: Array.isArray((data as { priority_follow_ids?: string[] }).priority_follow_ids)
        ? (data as { priority_follow_ids: string[] }).priority_follow_ids
        : [],
      notifyRaceDay: (data as { notify_race_day?: boolean }).notify_race_day !== false,
      notifyT60: (data as { notify_t60?: boolean }).notify_t60 !== false,
      notifyStart: (data as { notify_start?: boolean }).notify_start !== false,
      notifyResults: (data as { notify_results?: boolean }).notify_results !== false,
      timezone: (data as { timezone?: string }).timezone || 'America/Sao_Paulo',
    };
    localStorage.setItem(cacheKey, JSON.stringify(settings));
    return settings;
  } catch (requestError) {
    console.error('Falha ao carregar configuracoes do usuario.', requestError);
    return null;
  }
}

export async function saveUserSettings(userId: string, settings: UserSettings) {
  localStorage.setItem(`${SETTINGS_CACHE_PREFIX}${userId}`, JSON.stringify(settings));
  if (!supabase) return;

  const basePayload = {
    user_id: userId,
    theme: settings.theme,
    language: settings.language,
    favorite_category_id: settings.favoriteCategoryId,
    followed_category_ids: settings.followedCategoryIds,
    followed_team_ids: settings.followedTeamIds,
    followed_driver_ids: settings.followedDriverIds,
    updated_at: new Date().toISOString(),
  };

  const { error } = await withTimeout(Promise.resolve(
    supabase.from('user_settings').upsert(
      {
        ...basePayload,
        favorites_onboarded: settings.favoritesOnboarded,
        priority_follow_ids: settings.priorityFollowIds,
        notify_race_day: settings.notifyRaceDay,
        notify_t60: settings.notifyT60,
        notify_start: settings.notifyStart,
        notify_results: settings.notifyResults,
        timezone: settings.timezone,
      },
      { onConflict: 'user_id' }
    )
  ));

  if (error) {
    const { error: favoritesError } = await withTimeout(Promise.resolve(
      supabase.from('user_settings').upsert(
        { ...basePayload, favorites_onboarded: settings.favoritesOnboarded, priority_follow_ids: settings.priorityFollowIds },
        { onConflict: 'user_id' }
      )
    ));
    if (!favoritesError) return;
    const { error: legacyError } = await withTimeout(Promise.resolve(
      supabase.from('user_settings').upsert(basePayload, { onConflict: 'user_id' })
    ));
    if (legacyError) throw legacyError;
  }
}

export function getAuthTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem(AUTH_THEME_KEY);
  return saved === 'light' ? 'light' : 'dark';
}

export function setAuthTheme(theme: 'dark' | 'light') {
  localStorage.setItem(AUTH_THEME_KEY, theme);
}
