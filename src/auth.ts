import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

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
};

const AUTH_THEME_KEY = 'pitstophub_auth_theme_v1';

function mapUser(user: User): AuthUser {
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
  await supabase.from('user_settings').upsert(
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
  );
}

export async function getCurrentSession(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return mapUser(data.session.user);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
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
  if (password.length < 6) return { ok: false, message: 'Senha deve ter no minimo 6 caracteres.' };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });

  if (error) return { ok: false, message: error.message };
  if (!data.user) return { ok: false, message: 'Nao foi possivel criar a conta.' };

  if (!data.session) {
    return { ok: false, message: 'Conta criada. Confirme o email para entrar.' };
  }

  await ensureUserSettingsRow(data.user.id);
  return { ok: true, user: mapUser(data.user) };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Login indisponivel no momento. Configure o Supabase no ambiente.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  if (error || !data.user) {
    return { ok: false, message: 'Email ou senha invalidos.' };
  }

  await ensureUserSettingsRow(data.user.id);
  return { ok: true, user: mapUser(data.user) };
}

export async function logoutUser() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('theme, language, favorite_category_id, followed_category_ids, followed_team_ids, followed_driver_ids')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    theme: data.theme === 'light' ? 'light' : 'dark',
    language: data.language === 'en' ? 'en' : 'pt',
    favoriteCategoryId: data.favorite_category_id ?? 'f1',
    followedCategoryIds: Array.isArray(data.followed_category_ids) ? data.followed_category_ids : [],
    followedTeamIds: Array.isArray(data.followed_team_ids) ? data.followed_team_ids : [],
    followedDriverIds: Array.isArray(data.followed_driver_ids) ? data.followed_driver_ids : [],
  };
}

export async function saveUserSettings(userId: string, settings: UserSettings) {
  if (!supabase) return;
  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      theme: settings.theme,
      language: settings.language,
      favorite_category_id: settings.favoriteCategoryId,
      followed_category_ids: settings.followedCategoryIds,
      followed_team_ids: settings.followedTeamIds,
      followed_driver_ids: settings.followedDriverIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}

export function getAuthTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem(AUTH_THEME_KEY);
  return saved === 'light' ? 'light' : 'dark';
}

export function setAuthTheme(theme: 'dark' | 'light') {
  localStorage.setItem(AUTH_THEME_KEY, theme);
}
