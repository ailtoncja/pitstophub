import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, EmptyState, SectionTitle } from '../components/ui';

// Painel de correcao do motor de sincronizacao (Edge Function "admin" no Supabase).
// Nao aparece no menu: acesso por /admin com a senha ADMIN_TOKEN, guardada so
// nesta aba (sessionStorage). A chave service_role nunca chega ao navegador.

const API = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/admin`;
const TOKEN_KEY = 'pitstophub.admin.token';

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

async function call<T>(token: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'x-admin-token': token,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
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

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [draft, setDraft] = useState('');
  const [statuses, setStatuses] = useState<CategoryStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setStatuses(await call<CategoryStatus[]>(token, '/status'));
    } catch (e) {
      setError((e as Error).message);
      if ((e as Error).message.includes('autorizado')) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken('');
      }
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!token) {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      sessionStorage.setItem(TOKEN_KEY, draft);
      setToken(draft);
    };
    return (
      <div className="px-margin pt-6 max-w-md">
        <SectionTitle>Painel de dados</SectionTitle>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            autoComplete="current-password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Senha do painel"
            className="rounded-xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/30"
          />
          <Button type="submit" disabled={draft.length < 16}>Entrar</Button>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </form>
      </div>
    );
  }

  const run = async (category: string, path: string, body: unknown, label: string) => {
    setBusy(`${category}:${label}`);
    try {
      await call(token, path, body);
      await load();
    } catch (e) {
      setError(`${category}: ${(e as Error).message}`);
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
                {expanded && <CategoryDetail token={token} status={s} busy={busy} onAction={run} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryDetail({
  token,
  status: s,
  busy,
  onAction,
}: {
  token: string;
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
      call<RaceRow[]>(token, `/races?category=${s.category}`),
      call<ChangeRow[]>(token, `/changes?category=${s.category}`),
    ]);
    setRaces(r);
    setChanges(c);
  }, [token, s.category]);

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
