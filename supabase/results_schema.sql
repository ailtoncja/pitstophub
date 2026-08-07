-- Execute este script no SQL Editor do Supabase (mesmo projeto do schema.sql).
-- Adiciona o suporte pra notificacao personalizada de resultado: guarda o id
-- do evento na TheSportsDB (pra buscar o resultado completo depois que a
-- corrida termina) e controla pra quem ja foi mandado o aviso de posicao.

alter table public.synced_races
  add column if not exists external_id text;

create table if not exists public.notified_race_results (
  category_id text not null,
  race_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  notified_at timestamptz not null default now(),
  primary key (category_id, race_id, user_id)
);

alter table public.notified_race_results enable row level security;
-- Sem nenhuma policy: apenas a service_role (job de notificacao) acessa esta tabela.
