// Checador rapido de resultados: roda a cada ~15min via GitHub Actions
// (.github/workflows/notify-results.yml), bem mais barato que o sync completo
// (scripts/sync-thesportsdb.mjs, 1x/dia) -- em vez de refazer o calendario
// inteiro das 9 categorias, so re-consulta as corridas que a gente ja tem
// marcadas como "upcoming" mas cuja data ja chegou (candidatas a ter acabado
// de virar "completed"), pra notificar o resultado poucos minutos depois da
// TheSportsDB publicar, em vez de esperar o sync completo do dia seguinte.
//
// Env vars necessarias: THESPORTSDB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { apiBaseFor, fetchJson as fetchJsonRaw, getStatus, parseWinner, sleep, REQUEST_DELAY_MS } from './lib/thesportsdb.mjs';

const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!THESPORTSDB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltam env vars: THESPORTSDB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const API_BASE = apiBaseFor(THESPORTSDB_API_KEY);
const fetchJson = (path) => fetchJsonRaw(API_BASE, path);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const { data: candidates, error } = await supabase
    .from('synced_races')
    .select('category_id, race_id, external_id, en_name')
    .eq('status', 'upcoming')
    .lte('date', todayUTC())
    .not('external_id', 'is', null);
  if (error) throw error;

  if (!candidates || candidates.length === 0) {
    console.log('Nenhuma corrida pendente de resultado.');
    return;
  }

  let updated = 0;
  for (const race of candidates) {
    await sleep(REQUEST_DELAY_MS);
    let detail;
    try {
      detail = await fetchJson(`/lookupevent.php?id=${race.external_id}`);
    } catch (fetchError) {
      console.error(`[${race.category_id}/${race.race_id}] falha ao consultar:`, fetchError.message);
      continue;
    }
    const event = detail?.events?.[0];
    if (!event) continue;

    const status = getStatus(event);
    if (status === 'upcoming') continue; // ainda nao acabou, nada a atualizar

    const winner = status === 'completed' ? parseWinner(event.strResult) : null;
    const { error: updateError } = await supabase
      .from('synced_races')
      .update({ status, winner, updated_at: new Date().toISOString() })
      .eq('category_id', race.category_id)
      .eq('race_id', race.race_id);
    if (updateError) {
      console.error(`[${race.category_id}/${race.race_id}] falha ao atualizar:`, updateError.message);
      continue;
    }
    console.log(`${race.category_id}/${race.race_id} ("${race.en_name}"): upcoming -> ${status}${winner ? ` (vencedor: ${winner})` : ''}`);
    updated++;
  }

  console.log(`Concluido: ${updated} corrida(s) atualizada(s) de ${candidates.length} candidata(s).`);
}

main().catch((error) => {
  console.error('Falha no checador rapido de resultados.', error);
  process.exit(1);
});
