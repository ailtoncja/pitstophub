import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { type AuthUser, getStoredUser, loginUser, logoutUser, mapAuthUser, MIN_PASSWORD_LENGTH, registerUser } from './auth';
import { translate } from './lib/i18n';
import { cn } from './lib/utils';
import { AuthContext, type AuthContextValue } from './state/auth-context';
import { readStoredLanguage } from './state/settings';
import { supabase } from './supabase';

type AuthMode = 'login' | 'register';

/**
 * Dono da sessao: expoe usuario / login / logout via AuthContext e desenha o modal de entrar/cadastrar.
 * Fica acima dos providers de idioma, entao le o idioma direto do aparelho ao abrir o modal.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const lang = useMemo(() => (authOpen ? readStoredLanguage() : 'pt'), [authOpen]);
  const t = useCallback((key: string) => translate(lang, key), [lang]);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          setUser(mapAuthUser(session.user));
          setError('');
          setNotice('');
          setAuthOpen(false);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        if (session?.user) setUser(mapAuthUser(session.user));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setError('');
    setNotice('');
    setPassword('');
  }, []);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [authOpen, closeAuth]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    const result = mode === 'login' ? await loginUser({ email, password }) : await registerUser({ name, email, password });

    if ('message' in result && !result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    if (result.status === 'pending_verification') {
      setNotice(result.message);
      setBusy(false);
      setMode('login');
      setPassword('');
      return;
    }

    setUser(result.user);
    setBusy(false);
    closeAuth();
  };

  const context = useMemo<AuthContextValue>(
    () => ({
      user,
      requestLogin: () => {
        setMode('login');
        setAuthOpen(true);
      },
      logout: () => {
        void (async () => {
          await logoutUser();
          setUser(null);
          setMode('login');
          setEmail('');
          setPassword('');
          setError('');
        })();
      },
    }),
    [user],
  );

  const inputClass = 'w-full rounded-xl border border-surface-border bg-surface-container-lowest px-4 py-3 type-body-md text-text-primary placeholder:text-text-muted outline-none focus:border-racing-red/70 focus:ring-2 focus:ring-racing-red/20 transition';
  const labelClass = 'block type-label-telemetry uppercase tracking-widest text-text-muted mb-2';

  return (
    <AuthContext.Provider value={context}>
      {children}

      <AnimatePresence>
        {authOpen && (
          <motion.div className="fixed inset-0 z-[250] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default" onClick={closeAuth} aria-label={t('common.close')} />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
              initial={{ y: 24, opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="relative w-full max-w-md rounded-2xl bg-surface-raised border border-surface-border p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
            >
              <button type="button" onClick={closeAuth} aria-label={t('common.close')} className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 text-center">
                <img src="/icons/icon-192.png" alt="" className="w-14 h-14 object-contain mx-auto mb-2" />
                <h1 id="auth-title" className="type-headline-lg italic font-black uppercase tracking-tight text-text-primary">PitStopHub</h1>
                <p className="type-body-sm text-text-muted mt-1">{mode === 'login' ? t('auth.titleLogin') : t('auth.titleRegister')}</p>
              </div>

              <div className="grid grid-cols-2 bg-surface-container-lowest rounded-xl p-1 mb-6" role="tablist">
                {(['login', 'register'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => switchMode(value)}
                    className={cn('px-3 py-2 rounded-lg type-label-badge uppercase tracking-wider transition-colors', mode === value ? 'bg-racing-red text-white' : 'text-text-secondary hover:text-white')}
                  >
                    {value === 'login' ? t('auth.tabLogin') : t('auth.tabRegister')}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label htmlFor="auth-name" className={labelClass}>{t('auth.name')}</label>
                    <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.namePlaceholder')} className={inputClass} autoComplete="name" required />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className={labelClass}>{t('auth.email')}</label>
                  <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@dominio.com" className={inputClass} autoComplete="email" required />
                </div>

                <div>
                  <label htmlFor="auth-password" className={labelClass}>{t('auth.password')}</label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={translate(lang, 'auth.passwordHint', { n: MIN_PASSWORD_LENGTH })}
                    className={inputClass}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                  />
                </div>

                {notice && <p className="type-body-sm text-tertiary" role="status">{notice}</p>}
                {error && <p className="type-body-sm text-error" role="alert">{error}</p>}

                <button type="submit" disabled={busy} className="w-full rounded-xl bg-racing-red text-white type-label-badge uppercase tracking-widest px-4 py-3.5 glow-red hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50">
                  {busy ? t('auth.busy') : mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}
