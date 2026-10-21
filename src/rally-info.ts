import type { Race } from './types';
import { rallyIdFor } from './rally/dates';
import { RALLIES_2026 } from './rally/rallies-2026';
import type { RallyDay, RallyInfo, RallyStage } from './rally/types';

export type { RallyDay, RallyInfo, RallyMap, RallyRoute, RallySource, RallyStage, RallySurface } from './rally/types';

// Ficha de rali (WRC): o equivalente ao tracado do circuito para provas que nao tem pista.
// Cada numero vem de uma fonte citada em `sources`; o que nao foi publicado fica ausente
// (campo opcional) e a tela diz isso em vez de inventar. Os mapas sao gerados por
// scripts/rally/build_map.py a partir de scripts/rally/rallies/<id>.json.

/** A ficha do rali da etapa (ver rallyIdFor em ./rally/dates). */
export function getRallyInfo(race: Race): RallyInfo | null {
  const id = rallyIdFor(race);
  return id ? (RALLIES_2026.find((rally) => rally.id === id) ?? null) : null;
}

export function rallyStages(info: RallyInfo): RallyStage[] {
  return info.days.flatMap((day) => day.stages);
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Numeros-chave calculados das especiais (nao digitados a mao). */
export function rallyKeyNumbers(info: RallyInfo) {
  const stages = rallyStages(info);
  const km = round2(stages.reduce((sum, stage) => sum + stage.km, 0));
  const longestKm = Math.max(...stages.map((stage) => stage.km));
  const longest = stages.filter((stage) => stage.km === longestKm);
  const powerStage = stages.find((stage) => stage.powerStage) ?? null;
  return { count: stages.length, km, longest, longestKm, powerStage };
}

export function dayKm(day: RallyDay): number {
  return round2(day.stages.reduce((sum, stage) => sum + stage.km, 0));
}

/** Nome da especial sem o numero da passagem ("Coiluna – Loelle 1" -> "Coiluna – Loelle"). */
export function stageBaseName(name: string): string {
  return name.replace(/\s+\d+$/, '');
}
