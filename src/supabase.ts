import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const isSecureSupabaseUrl = typeof supabaseUrl === 'string' && /^https:\/\//i.test(supabaseUrl);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
} else if (!isSecureSupabaseUrl) {
  console.warn('Supabase configurado sem HTTPS. Isso reduz a seguranca da sessao e das credenciais.');
}

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && supabaseUrl && supabaseAnonKey && isSecureSupabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storageKey: 'pitstophub.auth.token',
        },
      })
    : null;
