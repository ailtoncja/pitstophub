// Envia push no dia da corrida, ~1h antes e na largada, pra quem segue a
// categoria (ou um time/piloto dela). Roda a cada 15min via GitHub Actions
// (.github/workflows/notify-races.yml).
//
// Precisa de starts_at no synced_races (supabase/notifications_schema.sql +
// sync-thesportsdb.mjs) pra T-60/T-0. Sem horario, so manda o aviso do dia.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Faltam env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY');
  process.exit(1);
}

webpush.setVapidDetails('mailto:contato@pitstophub.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYNCED_CATEGORY_NAMES = {
  f2: 'F2',
  f3: 'F3',
  'f1-academy': 'F1 Academy',
  wec: 'WEC',
  imsa: 'IMSA',
  dtm: 'DTM',
  indy: 'IndyCar',
  nascar: 'NASCAR',
  wrc: 'WRC',
};

const DEFAULT_TZ = 'America/Sao_Paulo';
const KINDS = ['race-day', 't-60', 't-0'];

function addDays(isoDate, days) {
  const next = new Date(`${isoDate}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

function formatLocalTime(iso, timeZone, language) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function raceStart(race) {
  if (race.startsAt) {
    const start = new Date(race.startsAt);
    if (!Number.isNaN(start.getTime())) return start;
  }
  return null;
}

function shouldSend(kind, now, race, timeZone) {
  const start = raceStart(race);
  if (kind === 't-60') {
    if (!start) return false;
    const ms = start.getTime() - now.getTime();
    return ms >= 20 * 60 * 1000 && ms <= 80 * 60 * 1000;
  }
  if (kind === 't-0') {
    if (!start) return false;
    const ms = now.getTime() - start.getTime();
    return ms >= -10 * 60 * 1000 && ms <= 15 * 60 * 1000;
  }

  const localNow = zonedParts(now, timeZone);
  const localStart = start
    ? zonedParts(start, timeZone)
    : { date: race.date, hour: 15, minute: 0 };
  if (localNow.date !== localStart.date) return false;
  const startMinutes = localStart.hour * 60 + localStart.minute;
  const nowMinutes = localNow.hour * 60 + localNow.minute;
  const gate = Math.min(8 * 60, Math.max(0, startMinutes - 120));
  return nowMinutes >= gate;
}

function wantsKind(settings, kind) {
  if (kind === 'race-day') return settings.notify_race_day !== false;
  if (kind === 't-60') return settings.notify_t60 !== false;
  if (kind === 't-0') return settings.notify_start !== false;
  return false;
}

function followsCategory(row, categoryId) {
  const prefix = `${categoryId}::`;
  if ((row.followed_category_ids ?? []).includes(categoryId)) return true;
  if ((row.followed_team_ids ?? []).some((key) => key.startsWith(prefix))) return true;
  if ((row.followed_driver_ids ?? []).some((key) => key.startsWith(prefix))) return true;
  return false;
}

function buildPayload(race, kind, language, timeZone) {
  const categoryName = race.categoryName;
  const raceName = language === 'en' ? (race.enName || race.raceName) : race.raceName;
  const timeLabel = race.startsAt ? formatLocalTime(race.startsAt, timeZone, language) : null;
  const url = `/?c=${encodeURIComponent(race.categoryId)}`;

  if (kind === 't-0') {
    return {
      title: language === 'en' ? `${categoryName}: lights out` : `${categoryName}: luzes apagadas`,
      body: raceName,
      url,
      kind,
      tag: `${race.categoryId}-${race.raceId}-t0`,
    };
  }
  if (kind === 't-60') {
    return {
      title: language === 'en' ? `${categoryName}: starts soon` : `${categoryName}: largada em breve`,
      body: timeLabel ? (language === 'en' ? `${raceName} · ${timeLabel}` : `${raceName} · ${timeLabel}`) : raceName,
      url,
      kind,
      tag: `${race.categoryId}-${race.raceId}-t60`,
    };
  }
  return {
    title: language === 'en' ? `${categoryName}: race day` : `${categoryName}: corrida hoje`,
    body: timeLabel
      ? (language === 'en' ? `${raceName} · starts ${timeLabel}` : `${raceName} · largada ${timeLabel}`)
      : raceName,
    url,
    kind,
    tag: `${race.categoryId}-${race.raceId}-day`,
  };
}

async function fetchWindowRaces() {
  const from = addDays(todayUTC(), -1);
  const to = addDays(todayUTC(), 1);
  const fullSelect = 'category_id, race_id, name, en_name, date, starts_at';
  let { data, error } = await supabase
    .from('synced_races')
    .select(fullSelect)
    .eq('status', 'upcoming')
    .gte('date', from)
    .lte('date', to);

  if (error && /starts_at/i.test(error.message)) {
    const legacy = await supabase
      .from('synced_races')
      .select('category_id, race_id, name, en_name, date')
      .eq('status', 'upcoming')
      .gte('date', from)
      .lte('date', to);
    data = legacy.data;
    error = legacy.error;
  }
  if (error) throw error;

  const synced = (data ?? []).map((row) => ({
    categoryId: row.category_id,
    raceId: row.race_id,
    raceName: row.name,
    enName: row.en_name,
    date: row.date,
    startsAt: row.starts_at ?? null,
    categoryName: SYNCED_CATEGORY_NAMES[row.category_id] ?? row.category_id,
  }));

  return [...synced, ...(await fetchF1Window(from, to))];
}

function jolpicaStartsAt(date, time) {
  if (!time) return null;
  const iso = /Z|[+-]\d{2}/.test(time) ? `${date}T${time}` : `${date}T${time}Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function fetchF1Window(from, to) {
  const year = new Date().getUTCFullYear();
  const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/races.json?limit=100`);
  if (!res.ok) return [];
  const data = await res.json();
  const races = data?.MRData?.RaceTable?.Races ?? [];
  return races
    .filter((race) => race.date >= from && race.date <= to)
    .map((race) => ({
      categoryId: 'f1',
      raceId: `f1-${year}-r${race.round}`,
      raceName: race.raceName.replace(/^(.+?) Grand Prix$/i, (_, loc) => `GP de ${loc}`),
      enName: race.raceName,
      date: race.date,
      startsAt: jolpicaStartsAt(race.date, race.time),
      categoryName: 'F1',
    }));
}

async function loadSettings() {
  const fullSelect = 'user_id, language, timezone, followed_category_ids, followed_team_ids, followed_driver_ids, notify_race_day, notify_t60, notify_start';
  let { data, error } = await supabase.from('user_settings').select(fullSelect);
  if (error) {
    const legacy = await supabase
      .from('user_settings')
      .select('user_id, language, followed_category_ids, followed_team_ids, followed_driver_ids');
    data = legacy.data;
    error = legacy.error;
  }
  if (error) throw error;
  return data ?? [];
}

async function alreadyNotified(categoryId, raceId, userId, kind) {
  const { data, error } = await supabase
    .from('notified_race_alerts')
    .select('user_id')
    .eq('category_id', categoryId)
    .eq('race_id', raceId)
    .eq('user_id', userId)
    .eq('kind', kind)
    .maybeSingle();
  if (error) {
    if (/notified_race_alerts/i.test(error.message)) {
      throw new Error('Tabela notified_race_alerts ausente. Rode supabase/notifications_schema.sql');
    }
    throw error;
  }
  return Boolean(data);
}

async function markNotified(categoryId, raceId, userId, kind) {
  const { error } = await supabase
    .from('notified_race_alerts')
    .insert({ category_id: categoryId, race_id: raceId, user_id: userId, kind });
  if (error) console.error(`Falha ao marcar ${categoryId}/${raceId}/${userId}/${kind}.`, error);
}

async function sendToUser(userId, payload) {
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) throw error;
  if (!subs || subs.length === 0) return false;

  let sentAny = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sentAny = true;
    } catch (sendError) {
      const statusCode = sendError?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.error(`Falha ao enviar push (usuario ${userId}).`, statusCode ?? sendError);
      }
    }
  }
  return sentAny;
}

async function main() {
  const now = new Date();
  const races = await fetchWindowRaces();
  if (races.length === 0) {
    console.log('Nenhuma corrida na janela de notificacao.');
    return;
  }

  const allSettings = await loadSettings();
  let totalSent = 0;

  for (const race of races) {
    for (const settings of allSettings) {
      if (!followsCategory(settings, race.categoryId)) continue;
      const language = settings.language === 'en' ? 'en' : 'pt';
      const timeZone = settings.timezone || DEFAULT_TZ;

      for (const kind of KINDS) {
        if (!wantsKind(settings, kind)) continue;
        if (!shouldSend(kind, now, race, timeZone)) continue;
        if (await alreadyNotified(race.categoryId, race.raceId, settings.user_id, kind)) continue;

        const sent = await sendToUser(settings.user_id, buildPayload(race, kind, language, timeZone));
        if (sent) {
          await markNotified(race.categoryId, race.raceId, settings.user_id, kind);
          totalSent += 1;
          console.log(`${race.categoryId}/${race.raceId} ${kind} -> ${settings.user_id}`);
        }
      }
    }
  }

  console.log(`Concluido: ${totalSent} notificacao(oes) de corrida enviada(s).`);
}

main().catch((error) => {
  console.error('Falha no job de notificacoes.', error);
  process.exit(1);
});
