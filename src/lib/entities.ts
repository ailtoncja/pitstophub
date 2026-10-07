import type { Category, Driver, Race, Team } from '../types';

/** "Lucas Auer / Maro Engel" -> ["Lucas Auer", "Maro Engel"] (Sprint/DTM guardam duplas no mesmo round). */
export function winnerNameParts(winner: string): string[] {
  return winner.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

export function findCategoryDriver(category: Category, name: string | undefined): Driver | undefined {
  if (!name) return undefined;
  const exact = category.drivers.find((driver) => driver.name === name);
  if (exact) return exact;
  for (const part of winnerNameParts(name)) {
    const hit = category.drivers.find((driver) => driver.name === part);
    if (hit) return hit;
  }
  // Fontes diferentes abreviam ("M. Verstappen"): cai no sobrenome.
  const wanted = normalize(name);
  const last = wanted.split(' ').at(-1) ?? '';
  return last
    ? category.drivers.find((driver) => normalize(driver.name) === wanted)
      ?? category.drivers.find((driver) => normalize(driver.name).split(' ').at(-1) === last)
    : undefined;
}

export function findCategoryTeam(category: Category, name: string | undefined): Team | undefined {
  if (!name) return undefined;
  const exact = category.teams.find((team) => team.name === name);
  if (exact) return exact;
  const wanted = normalize(name);
  return category.teams.find((team) => {
    const candidate = normalize(team.name);
    return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
  });
}

export function teamOfDriver(category: Category, driver: Driver): Team | undefined {
  return category.teams.find((team) => team.id === driver.teamId);
}

export function driversOfTeam(category: Category, team: Team): Driver[] {
  return category.drivers
    .filter((driver) => driver.teamId === team.id)
    .sort((a, b) => (Number.parseInt(a.number, 10) || 999) - (Number.parseInt(b.number, 10) || 999));
}

export function raceWonByDriver(race: Race, driverName: string): boolean {
  if (!race.winner) return false;
  return race.winner === driverName || winnerNameParts(race.winner).includes(driverName);
}

/** Codigo de 3 letras ("VER"): ultimo sobrenome, em maiusculas. */
export function driverCode(name: string): string {
  const parts = normalize(name).split(' ').filter(Boolean);
  return (parts.at(-1) ?? name).slice(0, 3).toUpperCase();
}

/** "Max Verstappen" -> "M. Verstappen". */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0].toUpperCase()}. ${parts.slice(1).join(' ')}`;
}

export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { first: '', last: name };
  return { first: parts.slice(0, -1).join(' '), last: parts.at(-1) ?? '' };
}

/** Id estavel das rotas para uma corrida (alguns calendarios ao vivo nao trazem id unico). */
export function raceKey(race: Race): string {
  return race.id;
}

/** Chave "categoria::id" usada nas listas de times/pilotos seguidos (compativel com o app antigo). */
export const followKey = (categoryId: string, id: string) => `${categoryId}::${id}`;
