import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Button, EmptyState, SectionTitle } from '../components/ui';
import { useAuth } from '../state/auth-context';
import { supabase } from '../supabase';

// Painel de correcao do motor de sincronizacao (Edge Function "admin" no Supabase).
// Nao aparece no menu. So abre para a conta do dono do site: a funcao confere a
// sessao de login e o ID do usuario (segredo ADMIN_USER_IDS no Supabase). A tela
// aqui e so conveniencia; quem barra de verdade e o servidor.
//
// Verificacao em duas etapas (TOTP): se a conta ja tem um app autenticador
// confirmado, o painel pede o codigo (sessao aal2) antes de carregar. Se nao
// tem, oferece a ativacao -- e passa a exigir quando o servidor responder 403
// com code 'mfa_required' (ADMIN_REQUIRE_MFA na Edge Function).

const API = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/admin`;

type Mode = 'off' | 'dry_run' | 'live';

interface CategoryStatus {
  category: string;
  mode: Mode;
  season: number | null;
  source: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastChangeAt: string | null;
  asOfRound: number | null;
  failures: number;
  lastError: string | null;
  problems: string[];
  warnings: string[];
  changes: { entity: string; key: string; before: unknown; after: unknown }[];
}

interface RaceRow {
  race_id: string;
  round: number;
  name: string;
  date: string;
  status: string;
  winner: string | null;
  season: number | null;
  official: boolean;
}

interface ChangeRow {
  id: number;
  entity: string;
  entity_key: string;
  before: unknown;
  after: unknown;
  reverted: boolean;
  created_at: string;
}

const MODE_LABEL: Record<Mode, string> = { off: 'Desligada', dry_run: 'Teste (nao grava)', live: 'Ativa' };

class AdminError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const { data: auth } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const accessToken = auth.session?.access_token;
  if (!accessToken) throw new AdminError('Entre na sua conta para abrir o painel.', 401);
  const res = await fetch(`${API}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, code } = data as { error?: string; code?: string };
    throw new AdminError(error ?? `HTTP ${res.status}`, res.status, code ?? (error === 'mfa_required' ? error : undefined));
  }
  return data as T;
}

function ago(iso: string | null) {
  if (!iso) return 'nunca';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `ha ${min} min`;
  if (min < 48 * 60) return `ha ${Math.round(min / 60)} h`;
  return `ha ${Math.round(min / 1440)} dias`;
}

function health(s: CategoryStatus): { label: string; className: string } {
  if (s.mode === 'off') return { label: 'Desligada', className: 'bg-white/10 text-white/60' };
  if (s.failures > 0 || s.problems.length > 0) return { label: 'Atencao', className: 'bg-red-500/20 text-red-300' };
  if (s.warnings.length > 0) return { label: 'Avisos', className: 'bg-amber-500/20 text-amber-200' };
  return { label: 'OK', className: 'bg-emerald-500/20 text-emerald-300' };
}

// ─── Verificacao em duas etapas ──────────────────────────────────────────────

type MfaState =
  | { step: 'checking' }
  // Sessao liberada para chamar o servidor. hasFactor diz se ja existe app autenticador confirmado.
  | { step: 'ready'; hasFactor: boolean }
  // Ja tem app autenticador, mas a sessao ainda e aal1: pede o codigo.
  | { step: 'verify'; factorId: string }
  // Servidor exige duas etapas e a conta ainda nao tem app autenticador.
  | { step: 'enroll' };

const MFA_FRIENDLY_NAME = 'PitStopHub admin';
const MFA_CODE_ERROR = 'Codigo invalido ou expirado. Confira o app autenticador e tente de novo.';
const MFA_FALLBACK: MfaState = { step: 'ready', hasFactor: false };

function isMfaRequired(e: unknown) {
  return e instanceof AdminError && e.status === 403 && e.code === 'mfa_required';
}

/** Descobre em que ponto a sessao esta: aal2, precisa do codigo ou ainda nao tem fator. */
async function readMfaState(): Promise<MfaState> {
  if (!supabase) return MFA_FALLBACK;
  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || !aal) return MFA_FALLBACK;
  if (aal.currentLevel === 'aal2') return { step: 'ready', hasFactor: true };
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError || !factors) return MFA_FALLBACK;
  const verified = factors.totp.find((f) => f.status === 'verified');
  if (verified) return { step: 'verify', factorId: verified.id };
  return MFA_FALLBACK;
}

/** Campo de 6 digitos do app autenticador + envio (challenge + verify). */
function MfaCodeForm({ factorId, submitLabel, onVerified }: { factorId: string; submitLabel: string; onVerified: () => void }) {
  const inputId = useId();
  const hintId = useId();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !/^\d{6}$/.test(code)) {
      setError('Digite os 6 numeros do app autenticador.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw verifyError;
      onVerified();
    } catch {
      setError(MFA_CODE_ERROR);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => void submit(e)}>
      <label htmlFor={inputId} className="flex flex-col gap-1">
        <span className="text-xs text-white/60">Codigo de 6 digitos</span>
        <input
          id={inputId}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          className="w-36 rounded-lg bg-white/5 px-3 py-2 font-mono tracking-[0.3em] ring-1 ring-white/10"
        />
      </label>
      <Button type="submit" disabled={busy || code.length !== 6}>{busy ? 'Conferindo...' : submitLabel}</Button>
      <p id={hintId} className="w-full text-xs text-white/60">Abra o app autenticador (Google Authenticator, 1Password, Authy...) e digite o codigo atual.</p>
      {error && <p className="w-full text-sm text-red-200" role="alert">{error}</p>}
    </form>
  );
}

/** Pede o codigo para subir a sessao para aal2. */
function MfaVerify({ factorId, onVerified }: { factorId: string; onVerified: () => void }) {
  return (
    <section aria-labelledby="mfa-verify-title" className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <h3 id="mfa-verify-title" className="font-semibold">Verificacao em duas etapas</h3>
      <p className="text-sm text-white/70">Para abrir o painel, confirme com o codigo do seu app autenticador.</p>
      <MfaCodeForm factorId={factorId} submitLabel="Confirmar" onVerified={onVerified} />
    </section>
  );
}

/** Cadastra um app autenticador (TOTP): QR code + segredo, depois confirma com o primeiro codigo. */
function MfaEnroll({ required, onVerified }: { required: boolean; onVerified: () => void }) {
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    try {
      // Tentativas abandonadas deixam fatores nao confirmados com o mesmo nome,
      // o que faz o enroll falhar -- limpa antes de comecar de novo.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const factor of factors?.all ?? []) {
        if (factor.factor_type === 'totp' && factor.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: MFA_FRIENDLY_NAME });
      if (enrollError || !data) throw enrollError ?? new Error('enroll');
      // So aceita a imagem como data URL de SVG (o que o supabase-js devolve).
      const qrCode = data.totp.qr_code.startsWith('data:image/svg+xml') ? data.totp.qr_code : '';
      setEnrollment({ factorId: data.id, qrCode, secret: data.totp.secret });
    } catch {
      setError('Nao foi possivel iniciar a ativacao agora. Tente de novo em instantes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="mfa-enroll-title" className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <h3 id="mfa-enroll-title" className="font-semibold">Ativar verificacao em duas etapas</h3>
      <p className="text-sm text-white/70">
        {required
          ? 'O painel exige um app autenticador nesta conta. Ative para continuar.'
          : 'Recomendado: alem da senha, o painel passa a pedir um codigo do seu app autenticador.'}
      </p>
      {!enrollment ? (
        <div>
          <Button onClick={() => void start()} disabled={busy}>{busy ? 'Preparando...' : 'Ativar verificacao em duas etapas'}</Button>
        </div>
      ) : (
        <>
          <ol className="list-decimal pl-5 text-sm text-white/80">
            <li>Escaneie o QR code com o app autenticador (ou digite o segredo abaixo).</li>
            <li>Digite o codigo de 6 digitos que o app mostrar.</li>
          </ol>
          {enrollment.qrCode && (
            <img src={enrollment.qrCode} alt="QR code para adicionar o PitStopHub ao app autenticador" width={180} height={180} className="rounded-xl bg-white p-2" />
          )}
          <div className="text-sm">
            <span className="text-white/60">Segredo: </span>
            <code className="break-all select-all rounded bg-white/10 px-2 py-1 font-mono">{enrollment.secret}</code>
          </div>
          <MfaCodeForm factorId={enrollment.factorId} submitLabel="Ativar" onVerified={onVerified} />
        </>
      )}
      {error && <p className="text-sm text-red-200" role="alert">{error}</p>}
    </section>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, requestLogin } = useAuth();
  const [statuses, setStatuses] = useState<CategoryStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [mfa, setMfa] = useState<MfaState>({ step: 'checking' });
  const userId = user?.id;

  // Confere o nivel da sessao (aal1/aal2) antes de chamar o servidor.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setMfa({ step: 'checking' });
    void readMfaState()
      .catch(() => MFA_FALLBACK)
      .then((next) => {
        if (!cancelled) setMfa(next);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Servidor pediu duas etapas: codigo se ja tem fator, ativacao se nao tem.
  const onMfaRequired = useCallback(async () => {
    setStatuses(null);
    const next = await readMfaState().catch(() => MFA_FALLBACK);
    setMfa(next.step === 'verify' ? next : { step: 'enroll' });
  }, []);

  const onMfaVerified = useCallback(() => setMfa({ step: 'ready', hasFactor: true }), []);

  const mfaReady = mfa.step === 'ready';
  const load = useCallback(async () => {
    if (!user || !mfaReady) return;
    try {
      setError(null);
      setStatuses(await call<CategoryStatus[]>('/status'));
    } catch (e) {
      if (isMfaRequired(e)) await onMfaRequired();
      else if (e instanceof AdminError && e.status === 403) setDenied(true);
      else setError((e as Error).message);
    }
  }, [user, mfaReady, onMfaRequired]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <div className="px-margin pt-6">
        <EmptyState title="Area restrita" hint="Entre na sua conta para continuar." action={<Button onClick={requestLogin}>Entrar</Button>} />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="px-margin pt-6">
        <EmptyState title="Area restrita" hint="Esta pagina e so para a administracao do site." />
      </div>
    );
  }

  if (mfa.step !== 'ready') {
    return (
      <div className="px-margin pt-6 pb-16">
        <SectionTitle>Painel de dados</SectionTitle>
        {mfa.step === 'checking' && <p className="mt-6 text-white/60" role="status">Conferindo a sessao...</p>}
        {mfa.step === 'verify' && <MfaVerify factorId={mfa.factorId} onVerified={onMfaVerified} />}
        {mfa.step === 'enroll' && <MfaEnroll required onVerified={onMfaVerified} />}
      </div>
    );
  }

  const run = async (category: string, path: string, body: unknown, label: string) => {
    setBusy(`${category}:${label}`);
    try {
      await call(path, body);
      await load();
    } catch (e) {
      if (isMfaRequired(e)) await onMfaRequired();
      else setError(`${category}: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="px-margin pt-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Painel de dados</SectionTitle>
        <Button variant="secondary" onClick={() => void load()}>Atualizar</Button>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {/* So oferece a ativacao depois que o servidor confirmou que a conta e de admin. */}
      {statuses && !mfa.hasFactor && <MfaEnroll required={false} onVerified={onMfaVerified} />}
      {!statuses ? (
        <p className="mt-6 text-white/60">Carregando...</p>
      ) : statuses.length === 0 ? (
        <EmptyState title="Nenhuma categoria configurada" hint="Rode as migrations do pitstophub-data." />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {statuses.map((s) => {
            const h = health(s);
            const expanded = open === s.category;
            return (
              <div key={s.category} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(expanded ? null : s.category)}>
                  <div>
                    <div className="font-semibold">{s.category} {s.season ? `· ${s.season}` : ''}</div>
                    <div className="text-xs text-white/60">
                      {MODE_LABEL[s.mode]} · ultima execucao {ago(s.lastRunAt)} · ultimo sucesso {ago(s.lastSuccessAt)}
                      {s.asOfRound ? ` · ate a etapa ${s.asOfRound}` : ''}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${h.className}`}>{h.label}</span>
                </button>
                {expanded && <CategoryDetail status={s} busy={busy} onAction={run} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryDetail({
  status: s,
  busy,
  onAction,
}: {
  status: CategoryStatus;
  busy: string | null;
  onAction: (category: string, path: string, body: unknown, label: string) => Promise<void>;
}) {
  const [races, setRaces] = useState<RaceRow[]>([]);
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [fix, setFix] = useState<{ race: string; winner: string }>({ race: '', winner: '' });
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [r, c] = await Promise.all([
      call<RaceRow[]>(`/races?category=${encodeURIComponent(s.category)}`),
      call<ChangeRow[]>(`/changes?category=${encodeURIComponent(s.category)}`),
    ]);
    setRaces(r);
    setChanges(c);
  }, [s.category]);

  useEffect(() => {
    void refresh().catch((e) => setMessage((e as Error).message));
  }, [refresh]);

  const season = s.season ?? races.find((r) => r.season)?.season ?? new Date().getFullYear();
  const isBusy = (label: string) => busy === `${s.category}:${label}`;

  return (
    <div className="mt-4 flex flex-col gap-4 text-sm">
      {s.lastError && <p className="rounded-xl bg-red-500/10 p-3 text-red-200">Erro: {s.lastError}</p>}
      {s.problems.length > 0 && (
        <ul className="list-disc rounded-xl bg-red-500/10 p-3 pl-6 text-red-200">
          {s.problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      {s.warnings.length > 0 && (
        <ul className="list-disc rounded-xl bg-amber-500/10 p-3 pl-6 text-amber-100">
          {s.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {(['live', 'dry_run', 'off'] as Mode[]).map((mode) => (
          <Button
            key={mode}
            variant={s.mode === mode ? 'primary' : 'secondary'}
            disabled={s.mode === mode || isBusy('mode')}
            onClick={() => void onAction(s.category, '/mode', { category: s.category, mode }, 'mode')}
          >
            {MODE_LABEL[mode]}
          </Button>
        ))}
        <Button variant="secondary" disabled={isBusy('run')} onClick={() => void onAction(s.category, '/run', { category: s.category }, 'run').then(refresh)}>
          {isBusy('run') ? 'Rodando...' : 'Rodar agora'}
        </Button>
      </div>

      {s.mode === 'dry_run' && s.changes.length > 0 && (
        <div>
          <div className="mb-1 font-semibold">O que mudaria se estivesse ativa ({s.changes.length})</div>
          <ul className="max-h-60 overflow-auto rounded-xl bg-white/5 p-3 text-xs">
            {s.changes.map((c) => (
              <li key={`${c.entity}:${c.key}`} className="py-1">
                <b>{c.key}</b>: {JSON.stringify(c.before)} → {JSON.stringify(c.after)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!fix.race || !fix.winner.trim()) return;
          void onAction(
            s.category,
            '/override',
            { category: s.category, season, race_id: fix.race, kind: 'winner', value: fix.winner.trim(), note: 'painel' },
            'override',
          ).then(() => {
            setMessage('Vencedor corrigido. Vale ate a fonte oficial trazer o mesmo nome.');
            setFix({ race: '', winner: '' });
            return refresh();
          });
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/60">Corrigir vencedor</span>
          <select
            value={fix.race}
            onChange={(e) => setFix({ ...fix, race: e.target.value })}
            className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
          >
            <option value="">Escolha a corrida</option>
            {races.map((r) => (
              <option key={r.race_id} value={r.race_id}>
                R{r.round} {r.name} ({r.date}) — {r.winner ?? 'sem vencedor'}
              </option>
            ))}
          </select>
        </label>
        <input
          value={fix.winner}
          onChange={(e) => setFix({ ...fix, winner: e.target.value })}
          placeholder="Nome do vencedor"
          className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10"
        />
        <Button type="submit" disabled={isBusy('override')}>Salvar</Button>
      </form>
      {message && <p className="text-emerald-300">{message}</p>}

      <div>
        <div className="mb-1 font-semibold">Ultimas mudancas gravadas</div>
        {changes.length === 0 ? (
          <p className="text-white/60">Nenhuma ainda.</p>
        ) : (
          <ul className="max-h-72 overflow-auto rounded-xl bg-white/5 p-3 text-xs">
            {changes.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-2 py-1">
                <span>
                  {new Date(c.created_at).toLocaleString('pt-BR')} · <b>{c.entity_key}</b>: {JSON.stringify(c.before)} → {JSON.stringify(c.after)}
                  {c.reverted && ' (desfeita)'}
                </span>
                {c.entity === 'race' && !c.reverted && c.before != null && (
                  <button
                    type="button"
                    className="shrink-0 text-red-300 underline"
                    onClick={() =>
                      void onAction(s.category, '/revert', { changeId: c.id }, 'revert').then(() => {
                        setMessage('Mudanca desfeita. Se a fonte insistir no valor novo, crie uma correcao.');
                        return refresh();
                      })
                    }
                  >
                    Desfazer
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
