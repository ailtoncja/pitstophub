import React, { useEffect, useMemo, useState } from 'react';
import App from './App';
import { AuthUser, getCurrentSession, loginUser, logoutUser, registerUser } from './auth';

type AuthMode = 'login' | 'register';

export default function AuthGate() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => (mode === 'login' ? 'Entrar no PitStopHub' : 'Criar conta no PitStopHub'), [mode]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const sessionUser = await getCurrentSession();
      if (!mounted) return;
      setUser(sessionUser);
      setBootLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const closeAuth = () => {
    setAuthOpen(false);
    setError('');
    setPassword('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const result =
      mode === 'login'
        ? await loginUser({ email, password })
        : await registerUser({ name, email, password });

    if (!result.ok) {
      setError(result.message);
      setBusy(false);
      return;
    }

    const sessionUser = await getCurrentSession();
    setUser(sessionUser ?? result.user);
    setBusy(false);
    closeAuth();
  };

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <App
        currentUser={user}
        onLoginRequest={() => {
          setMode('login');
          setAuthOpen(true);
        }}
        onLogout={() => {
          void (async () => {
            await logoutUser();
            setUser(null);
            setMode('login');
            setEmail('');
            setPassword('');
            setError('');
          })();
        }}
      />

      {authOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuth} aria-label="Fechar modal" />

          <div className="relative w-full max-w-md glass-card p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-display font-black italic tracking-tight mb-2">PitStopHub</h1>
              <p className="text-sm text-gray-500">{title}</p>
            </div>

            <div className="grid grid-cols-2 bg-black/10 rounded-xl p-1 mb-6">
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'login' ? 'bg-brand-red text-white' : 'text-gray-500'}`}
                type="button"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'register' ? 'bg-brand-red text-white' : 'text-gray-500'}`}
                type="button"
              >
                Cadastro
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Nome</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/40"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@dominio.com"
                  className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 outline-none focus:ring-2 focus:ring-brand-red/40"
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-brand-red text-white font-black uppercase tracking-widest text-xs rounded-xl px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {busy ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
