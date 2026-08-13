// Envia push notification pra quem segue uma categoria que tem corrida hoje.
// Roda 1x/dia via GitHub Actions (.github/workflows/notify-races.yml), depois
// do sync do calendario (sync-categories.yml) pra ler dados frescos.
//
// Limitacao conhecida: synced_races.date e so a data (sem horario), entao o
// aviso e "tem corrida hoje", nao "corrida em 1 hora". Precisaria capturar
// strTime da TheSportsDB pra ter precisao de horario -- nao faz parte deste
// job ainda.
//
// Env vars necessarias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

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

// Mesmos ids/nomes de src/types.ts -- categorias sincronizadas via Supabase
// mais o f1, que usa a API da Jolpica (sem tabela synced_races propria).
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

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchTodaysSyncedRaces(today) {
  const { data, error } = await supabase
    .from('synced_races')
    .select('category_id, race_id, name')
    .eq('status', 'upcoming')
    .eq('date', today);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    categoryId: row.category_id,
    raceId: row.race_id,
    raceName: row.name,
    categoryName: SYNCED_CATEGORY_NAMES[row.category_id] ?? row.category_id,
  }));
}

async function fetchTodaysF1Race(today) {
  const year = new Date().getUTCFullYear();
  const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/races.json?limit=100`);
  if (!res.ok) return [];
  const data = await res.json();
  const races = data?.MRData?.RaceTable?.Races ?? [];
  return races
    .filter((r) => r.date === today)
    .map((r) => ({
      categoryId: 'f1',
      raceId: `f1-${year}-r${r.round}`,
      raceName: r.raceName,
      categoryName: 'F1',
    }));
}

async function alreadyNotified(categoryId, raceId) {
  const { data, error } = await supabase
    .from('notified_races')
    .select('race_id')
    .eq('category_id', categoryId)
    .eq('race_id', raceId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function markNotified(categoryId, raceId) {
  const { error } = await supabase.from('notified_races').insert({ category_id: categoryId, race_id: raceId });
  if (error) console.error(`Falha ao marcar ${categoryId}/${raceId} como notificada.`, error);
}

function followsCategory(row, categoryId) {
  const prefix = `${categoryId}::`;
  if ((row.followed_category_ids ?? []).includes(categoryId)) return true;
  if ((row.followed_team_ids ?? []).some((k) => k.startsWith(prefix))) return true;
  if ((row.followed_driver_ids ?? []).some((k) => k.startsWith(prefix))) return true;
  return false;
}

async function subscribersForCategory(categoryId) {
  // Mesma regra da home do app (followedCategoryObjects em App.tsx): seguir
  // um time ou piloto de uma categoria conta como seguir a categoria, mesmo
  // sem ter clicado no botao "Seguir categoria" separadamente. A base de
  // usuarios ainda e pequena, entao filtrar em JS em vez de SQL e suficiente.
  const { data: settingsRows, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, followed_category_ids, followed_team_ids, followed_driver_ids');
  if (settingsError) throw settingsError;

  const userIds = (settingsRows ?? []).filter((row) => followsCategory(row, categoryId)).map((r) => r.user_id);
  if (userIds.length === 0) return [];

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds);
  if (subsError) throw subsError;
  return subs ?? [];
}

async function sendToSubscription(sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (error) {
    const statusCode = error?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Inscricao morta (usuario desinstalou, revogou permissao, etc).
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);
    } else {
      console.error(`Falha ao enviar push (endpoint ${sub.endpoint.slice(0, 40)}...).`, statusCode ?? error);
    }
    return false;
  }
}

async function main() {
  const today = todayUTC();
  const races = [...(await fetchTodaysSyncedRaces(today)), ...(await fetchTodaysF1Race(today))];

  if (races.length === 0) {
    console.log(`Nenhuma corrida hoje (${today}).`);
    return;
  }

  let totalSent = 0;
  for (const race of races) {
    if (await alreadyNotified(race.categoryId, race.raceId)) {
      console.log(`${race.categoryId}/${race.raceId} ja foi notificada, pulando.`);
      continue;
    }

    const subs = await subscribersForCategory(race.categoryId);
    console.log(`${race.categoryName}: "${race.raceName}" hoje -- ${subs.length} inscricao(oes) pra notificar.`);

    const payload = {
      title: `${race.categoryName}: corrida hoje!`,
      body: race.raceName,
      url: '/',
    };

    let sentForRace = 0;
    for (const sub of subs) {
      if (await sendToSubscription(sub, payload)) sentForRace++;
    }
    totalSent += sentForRace;

    await markNotified(race.categoryId, race.raceId);
  }

  console.log(`Concluido: ${totalSent} notificacao(oes) enviada(s) no total.`);
}

main().catch((error) => {
  console.error('Falha no job de notificacoes.', error);
  process.exit(1);
});
