// Notifica quem segue um piloto ou time sobre a posicao em que ele terminou
// uma corrida ja concluida. Roda 1x/dia via GitHub Actions
// (.github/workflows/notify-results.yml), logo depois do sync do calendario,
// pra pegar corridas que acabaram de virar "completed".
//
// So cobre categorias com resultado confiavel: F1 (API estruturada da
// Jolpica, sem parsing de texto) e F2/F3/DTM/IMSA/IndyCar/NASCAR (texto da
// TheSportsDB com posicao por piloto, validado contra o elenco que a gente
// mantem -- so notifica quando o nome do piloto/time e encontrado no texto).
// WRC mistura formatos (resultado da etapa vs classificacao acumulada) --
// fica de fora por enquanto.
//
// Env vars necessarias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// THESPORTSDB_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

// Roda via `tsx` (ja e devDependency do projeto), nao `node` puro -- e o que
// permite importar MOTORSPORT_DATA direto de src/types.ts abaixo, reusando o
// mesmo elenco (nomes de piloto/time) que o site usa, em vez de duplicar essa
// lista aqui e correr o risco dela ficar desatualizada.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { MOTORSPORT_DATA } from '../src/types.ts';

const MOTORSPORT_DATA_BY_ID = new Map(MOTORSPORT_DATA.map((c) => [c.id, c]));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !THESPORTSDB_API_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Faltam env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, THESPORTSDB_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY');
  process.exit(1);
}

webpush.setVapidDetails('mailto:contato@pitstophub.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const THESPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}`;

const TEXT_RESULT_CATEGORIES = ['f2', 'f3', 'dtm', 'imsa', 'indy', 'nascar'];
const CATEGORY_NAMES = {
  f1: 'F1',
  f2: 'F2',
  f3: 'F3',
  dtm: 'DTM',
  imsa: 'IMSA',
  indy: 'IndyCar',
  nascar: 'NASCAR',
};
const WINDOW_DAYS = 3; // so olha corridas concluidas nos ultimos N dias

function normalize(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Alguns eventos da TheSportsDB colam a classificacao do campeonato logo
// depois do resultado da corrida, separadas so por uma linha de tracos (ex.:
// DTM e F2/F3) -- sem cortar isso fora, uma busca por nome podia pegar a
// posicao no campeonato em vez da posicao na corrida (confirmado testando
// com dados reais antes de subir isso pra producao).
function stripStandingsTail(strResult) {
  const idx = strResult.search(/-{3,}|standings/i);
  return idx === -1 ? strResult : strResult.slice(0, idx);
}

// Procura o nome (piloto ou time) linha a linha no texto de resultado da
// TheSportsDB e devolve a posicao de cada linha em que ele aparece. So
// confia em linhas que comecam com um numero (a posicao) -- se o nome nao
// aparecer em nenhuma linha assim, devolve [] e quem chamou nao notifica.
function findPositions(strResult, name) {
  if (!strResult || !name) return [];
  const target = normalize(name);
  if (!target) return [];
  const positions = [];
  for (const line of stripStandingsTail(strResult).split('\n')) {
    if (!normalize(line).includes(target)) continue;
    const match = line.match(/^\s*0*(\d{1,2})[.\t/ ]/);
    if (match) positions.push(Number(match[1]));
  }
  return positions;
}

function formatOrdinal(n) {
  return `${n}º`;
}

// "2º, 4º e 5º" em vez de "2º e 4º e 5º" pra times com 3+ carros classificados.
function formatOrdinalList(positions) {
  const labels = positions.map(formatOrdinal);
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} e ${labels.at(-1)}`;
}

async function fetchRacesToCheck() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: synced, error } = await supabase
    .from('synced_races')
    .select('category_id, race_id, name, en_name, date, external_id')
    .eq('status', 'completed')
    .in('category_id', TEXT_RESULT_CATEGORIES)
    .gte('date', since);
  if (error) throw error;

  const races = (synced ?? [])
    .filter((r) => r.external_id)
    .map((r) => ({
      categoryId: r.category_id,
      raceId: r.race_id,
      raceName: r.en_name || r.name,
      externalId: r.external_id,
    }));

  races.push(...(await fetchF1RacesToCheck(since)));
  return races;
}

async function fetchF1RacesToCheck(since) {
  const year = new Date().getUTCFullYear();
  const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/races.json?limit=100`);
  if (!res.ok) return [];
  const data = await res.json();
  const races = data?.MRData?.RaceTable?.Races ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return races
    .filter((r) => r.date >= since && r.date < today) // ja deve ter acontecido
    .map((r) => ({
      categoryId: 'f1',
      raceId: `f1-${year}-r${r.round}`,
      raceName: r.raceName,
      round: r.round,
      year,
    }));
}

async function fetchTextResult(externalId) {
  const res = await fetch(`${THESPORTSDB_BASE}/lookupevent.php?id=${externalId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.events?.[0]?.strResult ?? null;
}

async function fetchF1Results(year, round) {
  const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.MRData?.RaceTable?.Races?.[0]?.Results ?? null;
}

async function alreadyNotified(categoryId, raceId, userId) {
  const { data, error } = await supabase
    .from('notified_race_results')
    .select('user_id')
    .eq('category_id', categoryId)
    .eq('race_id', raceId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function markNotified(categoryId, raceId, userId) {
  const { error } = await supabase
    .from('notified_race_results')
    .insert({ category_id: categoryId, race_id: raceId, user_id: userId });
  if (error) console.error(`Falha ao marcar ${categoryId}/${raceId}/${userId} como notificada.`, error);
}

async function sendPush(userId, payload) {
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) throw error;

  let sentAny = false;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sentAny = true;
    } catch (error) {
      const statusCode = error?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      } else {
        console.error(`Falha ao enviar push (usuario ${userId}).`, statusCode ?? error);
      }
    }
  }
  return sentAny;
}

async function processRace(race, allSettings, allCategories) {
  const category = allCategories.get(race.categoryId);
  if (!category) return 0;
  const categoryName = CATEGORY_NAMES[race.categoryId] ?? race.categoryId;

  let resultText = null;
  let f1Results = null;
  if (race.categoryId === 'f1') {
    f1Results = await fetchF1Results(race.year, race.round);
    if (!f1Results) return 0;
  } else {
    resultText = await fetchTextResult(race.externalId);
    if (!resultText) return 0;
  }

  let sentCount = 0;

  for (const settings of allSettings) {
    const followedDriverIds = (settings.followed_driver_ids ?? [])
      .filter((k) => k.startsWith(`${race.categoryId}::`))
      .map((k) => k.split('::')[1]);
    const followedTeamIds = (settings.followed_team_ids ?? [])
      .filter((k) => k.startsWith(`${race.categoryId}::`))
      .map((k) => k.split('::')[1]);

    if (followedDriverIds.length === 0 && followedTeamIds.length === 0) continue;
    if (await alreadyNotified(race.categoryId, race.raceId, settings.user_id)) continue;

    // 1a passada: acha a posicao de cada piloto/time seguido, sem se
    // preocupar com ordem ainda. coveredPositions junta as posicoes ja
    // cobertas por um piloto seguido individualmente -- se a pessoa segue o
    // Leclerc e a Ferrari, a linha da Ferrari nao repete a posicao dele, so
    // entra com o(s) outro(s) carro(s) (se houver).
    const driverMessages = new Map(); // driverId -> texto
    const coveredPositions = new Set();

    for (const driverId of followedDriverIds) {
      const driver = category.drivers.find((d) => d.id === driverId);
      if (!driver) continue;
      const position = f1Results
        ? f1Results.find((r) => r.Driver.driverId === driverId)?.position
        : findPositions(resultText, driver.name)[0];
      if (!position) continue;
      coveredPositions.add(Number(position));
      driverMessages.set(driverId, `${driver.name} terminou em ${formatOrdinal(position)} no ${race.raceName}!`);
    }

    const teamMessages = new Map(); // teamId -> texto
    for (const teamId of followedTeamIds) {
      const team = category.teams.find((t) => t.id === teamId);
      if (!team) continue;
      const positions = f1Results
        ? f1Results.filter((r) => r.Constructor && category.drivers.some((d) => d.id === r.Driver.driverId && d.teamId === teamId)).map((r) => r.position)
        : findPositions(resultText, team.name);
      if (positions.length === 0) continue;
      const sorted = [...new Set(positions.map(Number))].filter((p) => !coveredPositions.has(p)).sort((a, b) => a - b);
      if (sorted.length === 0) continue;
      teamMessages.set(teamId, `${team.name} terminou com ${sorted.length > 1 ? 'os carros em' : 'o carro em'} ${formatOrdinalList(sorted)} no ${race.raceName}!`);
    }

    if (driverMessages.size === 0 && teamMessages.size === 0) continue;

    // 2a passada: monta a ordem final seguindo priority_follow_ids (quem
    // esta mais no topo da lista de prioridade aparece primeiro na
    // notificacao). Quem tem mensagem mas nao esta na lista de prioridade
    // (ex.: settings desatualizado) entra no fim, na ordem em que foi
    // encontrado -- nunca fica de fora.
    const messages = [];
    const usedDriverIds = new Set();
    const usedTeamIds = new Set();
    for (const key of settings.priority_follow_ids ?? []) {
      const [kind, categoryId, id] = key.split('::');
      if (categoryId !== race.categoryId) continue;
      if (kind === 'driver' && driverMessages.has(id)) {
        messages.push(driverMessages.get(id));
        usedDriverIds.add(id);
      } else if (kind === 'team' && teamMessages.has(id)) {
        messages.push(teamMessages.get(id));
        usedTeamIds.add(id);
      }
    }
    for (const [driverId, text] of driverMessages) {
      if (!usedDriverIds.has(driverId)) messages.push(text);
    }
    for (const [teamId, text] of teamMessages) {
      if (!usedTeamIds.has(teamId)) messages.push(text);
    }

    const sent = await sendPush(settings.user_id, {
      title: `${categoryName}: resultado`,
      body: messages.join(' '),
      url: '/',
    });
    await markNotified(race.categoryId, race.raceId, settings.user_id);
    if (sent) sentCount++;
  }

  return sentCount;
}

async function main() {
  const races = await fetchRacesToCheck();
  if (races.length === 0) {
    console.log('Nenhuma corrida concluida recentemente pra checar.');
    return;
  }

  const { data: allSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, followed_driver_ids, followed_team_ids, priority_follow_ids');
  if (settingsError) throw settingsError;

  let totalSent = 0;
  for (const race of races) {
    const sent = await processRace(race, allSettings ?? [], MOTORSPORT_DATA_BY_ID);
    if (sent > 0) console.log(`${race.categoryId}/${race.raceId}: ${sent} notificacao(oes) de resultado enviada(s).`);
    totalSent += sent;
  }

  console.log(`Concluido: ${totalSent} notificacao(oes) de resultado enviada(s) no total.`);
}

main().catch((error) => {
  console.error('Falha no job de notificacoes de resultado.', error);
  process.exit(1);
});
