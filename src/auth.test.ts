import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cliente do Supabase falso: os testes controlam o que signOut/signIn/signUp devolvem.
const signOut = vi.fn();
const signInWithPassword = vi.fn();
const signUp = vi.fn();

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  SUPABASE_STORAGE_KEY: 'pitstophub.auth.token',
  supabase: {
    auth: { signOut, signInWithPassword, signUp },
    from: () => ({ upsert: () => Promise.resolve({ error: null }) }),
  },
}));

const { LOGIN_FAILED_MESSAGE, REGISTER_FAILED_MESSAGE, loginUser, logoutUser, mapAuthErrorMessage, registerUser } = await import('./auth');

// Ambiente de teste e node: localStorage minimo em memoria.
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
});

beforeEach(() => {
  store.clear();
  signOut.mockReset();
  signInWithPassword.mockReset();
  signUp.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('mapAuthErrorMessage', () => {
  it('nao diz se o email ja tem cadastro', () => {
    expect(mapAuthErrorMessage('User already registered', 'register')).toBe(REGISTER_FAILED_MESSAGE);
  });

  it('nunca repassa o texto cru do servidor', () => {
    expect(mapAuthErrorMessage('Database error saving new user: duplicate key', 'register')).toBe(REGISTER_FAILED_MESSAGE);
    expect(mapAuthErrorMessage('Invalid login credentials', 'login')).toBe(LOGIN_FAILED_MESSAGE);
    expect(mapAuthErrorMessage('Some internal error 42', 'login')).toBe(LOGIN_FAILED_MESSAGE);
    expect(mapAuthErrorMessage(undefined, 'login')).toBe(LOGIN_FAILED_MESSAGE);
  });

  it('mantem a mensagem de limite de tentativas', () => {
    expect(mapAuthErrorMessage('Email rate limit exceeded', 'register')).toMatch(/Muitas tentativas/);
    expect(mapAuthErrorMessage('Too many requests', 'login')).toMatch(/Muitas tentativas/);
  });

  it('mostra a regra de senha so no cadastro', () => {
    expect(mapAuthErrorMessage('Password should be at least 10 characters', 'register')).toMatch(/minimo/);
    expect(mapAuthErrorMessage('Password is known to be weak', 'register')).toMatch(/senha mais forte/);
  });
});

describe('loginUser / registerUser', () => {
  it('login com erro devolve mensagem neutra', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });
    expect(await loginUser({ email: 'a@b.com', password: 'x' })).toEqual({ ok: false, message: LOGIN_FAILED_MESSAGE });
  });

  it('cadastro de email existente devolve mensagem neutra', async () => {
    signUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'User already registered' } });
    const result = await registerUser({ name: 'Ana', email: 'a@b.com', password: 'senha-forte-123' });
    expect(result).toEqual({ ok: false, message: REGISTER_FAILED_MESSAGE });
  });

  it('falha de rede no login nao vaza o erro', async () => {
    signInWithPassword.mockRejectedValue(new Error('fetch failed: ECONNRESET 10.0.0.1'));
    const result = await loginUser({ email: 'a@b.com', password: 'x' });
    expect(result.ok).toBe(false);
    expect('message' in result && result.message).not.toMatch(/ECONNRESET/);
  });
});

describe('logoutUser', () => {
  const seed = () => {
    store.set('pitstophub.auth.token', '{"user":{}}');
    store.set('pitstophub_settings_v2_u1', '{}');
    store.set('pitstophub_auth_theme_v1', 'dark');
  };

  it('encerra a sessao global e limpa o aparelho', async () => {
    seed();
    signOut.mockResolvedValue({ error: null });
    await logoutUser('u1');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith();
    expect(store.has('pitstophub.auth.token')).toBe(false);
    expect(store.has('pitstophub_settings_v2_u1')).toBe(false);
    expect(store.get('pitstophub_auth_theme_v1')).toBe('dark');
  });

  it('cai para o signOut local quando o global devolve erro', async () => {
    seed();
    signOut.mockResolvedValueOnce({ error: { message: 'network' } }).mockResolvedValueOnce({ error: null });
    await logoutUser('u1');
    expect(signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
    expect(store.has('pitstophub.auth.token')).toBe(false);
  });

  it('limpa o aparelho mesmo se os dois signOut falharem', async () => {
    seed();
    signOut.mockRejectedValue(new Error('offline'));
    await expect(logoutUser('u1')).resolves.toBeUndefined();
    expect(signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
    expect(store.has('pitstophub.auth.token')).toBe(false);
    expect(store.has('pitstophub_settings_v2_u1')).toBe(false);
  });

  it('cai para o signOut local quando o global passa do tempo', async () => {
    vi.useFakeTimers();
    try {
      seed();
      signOut.mockImplementationOnce(() => new Promise(() => undefined)).mockResolvedValueOnce({ error: null });
      const pending = logoutUser('u1');
      await vi.advanceTimersByTimeAsync(6000);
      await pending;
      expect(signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
      expect(store.has('pitstophub.auth.token')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
