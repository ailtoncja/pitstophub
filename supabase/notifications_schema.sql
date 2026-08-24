-- Execute este script no SQL Editor do Supabase (mesmo projeto do schema.sql).
-- Horario real da corrida, preferencias de aviso e dedup por usuario/tipo --
-- a mesma base que o PWA usa hoje e que o app nativo reaproveita depois.

alter table public.synced_races
  add column if not exists starts_at timestamptz;

alter table public.user_settings
  add column if not exists notify_race_day boolean not null default true;

alter table public.user_settings
  add column if not exists notify_t60 boolean not null default true;

alter table public.user_settings
  add column if not exists notify_start boolean not null default true;

alter table public.user_settings
  add column if not exists notify_results boolean not null default true;

alter table public.user_settings
  add column if not exists timezone text not null default 'America/Sao_Paulo';

-- Dedup por usuario + tipo (dia / 1h antes / largada). A tabela antiga
-- notified_races continua existindo, mas o job novo nao escreve mais nela:
-- era um "ja avisamos esta corrida" global, sem horario nem preferencia.
create table if not exists public.notified_race_alerts (
  category_id text not null,
  race_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('race-day', 't-60', 't-0')),
  notified_at timestamptz not null default now(),
  primary key (category_id, race_id, user_id, kind)
);

alter table public.notified_race_alerts enable row level security;
-- Sem policy: apenas a service_role (job de notificacao) acessa esta tabela.
