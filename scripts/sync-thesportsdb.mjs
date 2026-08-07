// Sincroniza o calendario das categorias sem API propria usando a TheSportsDB.
// Roda 1x/dia via GitHub Actions (.github/workflows/sync-categories.yml).
//
// Por que rodada-a-rodada em vez de eventsseason.php: o endpoint de temporada
// inteira e limitado a 15 eventos no plano free (corta a temporada na metade,
// sem avisar). eventsround.php nao tem esse limite.
//
// Env vars necessarias: THESPORTSDB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!THESPORTSDB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltam env vars: THESPORTSDB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const API_BASE = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}`;
const REQUEST_DELAY_MS = 700; // ~85 req/min, folga sob o limite Premium de 100/min
const MAX_ROUNDS = 30;
const MAX_CONSECUTIVE_MISSES = 3;

// id da categoria no app -> id da liga na TheSportsDB
const LEAGUE_IDS = {
  f2: '4486',
  f3: '4487',
  'f1-academy': '5382',
  wec: '4413',
  imsa: '4488',
  dtm: '4438',
  'gt-world-challenge': '4439', // Endurance Cup (a liga 4440 e so a Sprint Cup, sem Paul Ricard/Monza/Spa/Portimao)
  indy: '4373',
  nascar: '4393',
  wrc: '4409',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const rowsByCategory = {};
  const standingsByCategory = {};
  const summary = [];

  for (const [categoryId, leagueId] of Object.entries(LEAGUE_IDS)) {
    try {
      const { rows, standings, standingsRound } = await syncCategory(categoryId, leagueId);
      rowsByCategory[categoryId] = rows;
      if (standings) standingsByCategory[categoryId] = { standings, round: standingsRound };
      summary.push(`${categoryId}: ${rows.length} corridas${standings ? `, classificacao apos rodada ${standingsRound}` : ''}`);
    } catch (error) {
      console.error(`[${categoryId}] falhou:`, error.message);
      summary.push(`${categoryId}: FALHOU (${error.message})`);
    }
  }

  // O calendario tambem e uma "foto" atual: apaga e regrava por categoria.
  // Sem isso, quando a resolucao de temporada troca de ano entre execucoes
  // (ex.: volta a marcar "2025" por um dia), as linhas da temporada errada
  // ficam para sempre (race_id diferente = upsert nunca as sobrescreve).
  let totalRows = 0;
  for (const [categoryId, rows] of Object.entries(rowsByCategory)) {
    if (rows.length === 0) continue;
    const { error: deleteError } = await supabase.from('synced_races').delete().eq('category_id', categoryId);
    if (deleteError) {
      console.error(`[${categoryId}] falha ao limpar corridas antigas:`, deleteError.message);
      continue;
    }
    const { error: insertError } = await supabase.from('synced_races').insert(rows);
    if (insertError) {
      console.error(`[${categoryId}] falha ao gravar corridas:`, insertError.message);
      continue;
    }
    totalRows += rows.length;
  }

  for (const [categoryId, { standings, round }] of Object.entries(standingsByCategory)) {
    // A classificacao e uma "foto" atual, nao historico: apaga e regrava.
    const { error: deleteError } = await supabase.from('synced_standings').delete().eq('category_id', categoryId);
    if (deleteError) {
      console.error(`[${categoryId}] falha ao limpar classificacao antiga:`, deleteError.message);
      continue;
    }
    const standingsRows = standings.map((item) => ({
      category_id: categoryId,
      position: item.position,
      name: item.name,
      team: item.team || null,
      points: item.points,
      as_of_round: round,
      source: 'thesportsdb',
      updated_at: new Date().toISOString(),
    }));
    const { error: insertError } = await supabase.from('synced_standings').insert(standingsRows);
    if (insertError) console.error(`[${categoryId}] falha ao gravar classificacao:`, insertError.message);
  }

  console.log('\n=== Resumo ===');
  summary.forEach((line) => console.log(line));
  console.log(`Total de corridas gravadas: ${totalRows}`);
  console.log(`Categorias com classificacao: ${Object.keys(standingsByCategory).length}/${Object.keys(LEAGUE_IDS).length}`);
}

async function syncCategory(categoryId, leagueId) {
  const season = await resolveCurrentSeason(leagueId);

  const rows = [];
  let latestStandings = null;
  let latestStandingsRound = null;
  let consecutiveMisses = 0;

  for (let round = 1; round <= MAX_ROUNDS && consecutiveMisses < MAX_CONSECUTIVE_MISSES; round++) {
    await sleep(REQUEST_DELAY_MS);
    const data = await fetchJson(`/eventsround.php?id=${leagueId}&r=${round}&s=${season}`);
    const events = data?.events ?? [];

    if (events.length === 0) {
      consecutiveMisses++;
      continue;
    }
    consecutiveMisses = 0;

    const main = pickMainEvent(events);
    if (!main) continue;

    rows.push(buildRow(categoryId, round, main));

    const standings = parseStandings(main.strResult);
    if (standings) {
      latestStandings = standings;
      latestStandingsRound = round;
    }
  }

  return { rows, standings: latestStandings, standingsRound: latestStandingsRound };
}

// lookupleague.php->strCurrentSeason fica desatualizado para varias ligas (viu
// "2025" com a temporada 2026 ja em andamento). O evento passado mais recente
// e um sinal mais confiavel de qual temporada esta rodando agora.
async function resolveCurrentSeason(leagueId) {
  await sleep(REQUEST_DELAY_MS);
  const past = await fetchJson(`/eventspastleague.php?id=${leagueId}`);
  const seasonFromPast = past?.events?.[0]?.strSeason;
  if (seasonFromPast) return seasonFromPast;

  await sleep(REQUEST_DELAY_MS);
  const league = await fetchJson(`/lookupleague.php?id=${leagueId}`);
  const season = league?.leagues?.[0]?.strCurrentSeason;
  if (!season) throw new Error('temporada atual nao encontrada');
  return season;
}

function pickMainEvent(events) {
  const feature = events.find((e) => /feature/i.test(e.strEvent));
  if (feature) return feature;

  const race = events
    .filter((e) => /race/i.test(e.strEvent) && !/practice|qualifying|warm[\s-]?up/i.test(e.strEvent))
    .sort((a, b) => (a.strTimestamp ?? a.dateEvent ?? '').localeCompare(b.strTimestamp ?? b.dateEvent ?? ''))
    .at(-1);
  if (race) return race;

  return events
    .filter((e) => !/practice|qualifying|warm[\s-]?up/i.test(e.strEvent))
    .sort((a, b) => (a.strTimestamp ?? a.dateEvent ?? '').localeCompare(b.strTimestamp ?? b.dateEvent ?? ''))
    .at(-1) ?? events.at(-1);
}

function buildRow(categoryId, round, event) {
  const status = getStatus(event);
  return {
    category_id: categoryId,
    race_id: `r${round}-${slugify(event.strEvent)}`,
    round,
    name: `Rodada ${round}`,
    en_name: event.strEvent,
    location: event.strCity || event.strCountry || null,
    en_location: event.strCity || event.strCountry || null,
    circuit: event.strVenue || null,
    date: event.dateEvent,
    status,
    winner: status === 'completed' ? parseWinner(event.strResult) : null,
    external_id: event.idEvent ?? null,
    source: 'thesportsdb',
    updated_at: new Date().toISOString(),
  };
}

function getStatus(event) {
  if (event.strPostponed === 'yes') return 'cancelled';
  if (event.strStatus === 'FT' || (event.strResult && event.strResult.trim().length > 0)) return 'completed';
  if (event.dateEvent && new Date(`${event.dateEvent}T23:59:59Z`) < new Date()) return 'completed';
  return 'upcoming';
}

// O texto de resultado da TheSportsDB nao segue um formato unico entre ligas
// (F2/F3/DTM/IndyCar usam "posicao\t/piloto\t/equipe\t/tempo", NASCAR usa os
// mesmos campos sem a barra e as vezes com uma linha de cabecalho antes dos
// dados, WEC usa "posicao /equipe #carro /tempo" sem tabs). IMSA e GT World
// Challenge usam texto corrido em prosa (varia a cada corrida) - nunca da pra
// extrair com seguranca, entao essas linhas nunca batem com o padrao abaixo e
// o vencedor fica em branco de propósito. Percorremos as linhas ate achar uma
// que bata exatamente com "posicao 1"; caso contrario preferimos deixar em
// branco a arriscar um nome errado.
function parseWinner(strResult) {
  if (!strResult) return null;
  const lines = strResult.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const fields = splitResultFields(line);
    if (fields.length < 2) continue;

    const position = fields[0].replace(/^0+(?=\d)/, '');
    if (position !== '1') continue;

    const name = fields.slice(1).find((f) => /[a-zA-Z]{3,}/.test(f) && !/^[\d:.+\s]+$/.test(f));
    if (name) return name;
  }

  return null;
}

function splitResultFields(line) {
  const raw = line.includes('\t') ? line.split('\t') : line.split('/');
  return raw.map((f) => f.replace(/^\//, '').trim()).filter(Boolean);
}

// Alguns eventos trazem um bloco extra tipo "Driver Standings after X" ou
// "Current Championship Standings After X" no fim do texto de resultado, com
// linhas "posicao /piloto /equipe /pontos". Nao aparece em toda corrida, entao
// guardamos a classificacao mais recente encontrada (e cumulativa, so cresce).
function parseStandings(strResult) {
  if (!strResult) return null;
  const headingMatch = strResult.match(/.*standings.*/i);
  if (!headingMatch) return null;

  const tail = strResult.slice(strResult.indexOf(headingMatch[0]) + headingMatch[0].length);
  const rows = [];

  for (const rawLine of tail.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const withTeam = line.match(/^(\d{1,2})\s*\/\s*([^/]+?)\s*\/\s*([^/]+?)\s*\/\s*([\d.]+)\s*$/);
    if (withTeam) {
      rows.push({
        position: parseInt(withTeam[1], 10),
        name: withTeam[2].trim(),
        team: withTeam[3].trim(),
        points: parseFloat(withTeam[4]),
      });
      continue;
    }

    // Algumas ligas (ex: WRC) nao trazem equipe na classificacao de pilotos:
    // so "posicao /piloto /pontos".
    const noTeam = line.match(/^(\d{1,2})\s*\/\s*([^/]+?)\s*\/\s*([\d.]+)\s*$/);
    if (noTeam) {
      rows.push({
        position: parseInt(noTeam[1], 10),
        name: noTeam[2].trim(),
        team: null,
        points: parseFloat(noTeam[3]),
      });
    }
  }

  if (rows.length === 0) return null;

  // Categorias multi-classe (ex: WEC com Hypercar/LMGT3) reiniciam a posicao em
  // 1 para cada classe dentro do mesmo bloco de texto. Nesse caso nao existe uma
  // classificacao geral unica, entao preferimos nao gravar nada a misturar
  // posicoes de classes diferentes como se fosse um ranking so.
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].position !== i + 1) return null;
  }

  return rows;
}

async function fetchJson(path, attempt = 0) {
  const res = await fetch(`${API_BASE}${path}`);
  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    await sleep(3000 * (attempt + 1));
    return fetchJson(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`TheSportsDB HTTP ${res.status} em ${path}`);
  return res.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

main().catch((error) => {
  console.error('Sync falhou:', error);
  process.exit(1);
});
