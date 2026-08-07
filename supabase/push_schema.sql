-- Execute este script no SQL Editor do Supabase (mesmo projeto do schema.sql).
-- Guarda as inscricoes de push notification de cada usuario e quais corridas
-- ja tiveram aviso disparado (pra nao notificar a mesma corrida duas vezes).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Cada usuario ve e gerencia apenas as proprias inscricoes.
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
on public.push_subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
on public.push_subscriptions
for delete
using (auth.uid() = user_id);

-- Sem policy de select "publica": so o dono (auth.uid()) ou a service_role
-- (usada pelo job do GitHub Actions que envia as notificacoes) leem as linhas.

create table if not exists public.notified_races (
  category_id text not null,
  race_id text not null,
  notified_at timestamptz not null default now(),
  primary key (category_id, race_id)
);

alter table public.notified_races enable row level security;
-- Sem nenhuma policy: apenas a service_role (job de notificacao) acessa esta tabela.
