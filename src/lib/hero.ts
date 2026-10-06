import type { Category, Race } from '../types';
import { raceStartDate } from '../race-time';
import { CATEGORY_GROUPS, type GroupId } from './categories-meta';
import { upcomingRaces } from './season';

export type HeroRace = { category: Category; race: Race };

/** Categorias de interesse: as seguidas + as de quem a pessoa segue (time/piloto). */
export function followedCategorySet(args: {
  followedCategoryIds: string[];
  followedTeamIds: string[];
  followedDriverIds: string[];
}): Set<string> {
  const fromKey = (k: string) => k.split('::')[0];
  return new Set([
    ...args.followedCategoryIds,
    ...args.followedTeamIds.map(fromKey),
    ...args.followedDriverIds.map(fromKey),
  ].filter(Boolean));
}

/** Todas as proximas etapas (de qualquer categoria) em ordem cronologica. */
export function allUpcoming(categories: Category[], now = Date.now()): HeroRace[] {
  return categories
    .flatMap((category) => upcomingRaces(category.calendar, now).map((race) => ({ category, race })))
    .sort((a, b) => raceStartDate(a.race).getTime() - raceStartDate(b.race).getTime());
}

/**
 * Etapa em destaque da Home. Com um grupo escolhido, so olha aquele grupo; em "Todas", prefere o que a
 * pessoa segue (quando segue algo) e cai em qualquer categoria se nada seguido tem etapa pela frente.
 */
export function pickHero(args: {
  categories: Category[];
  group: GroupId | 'all';
  followed: Set<string>;
  now?: number;
}): { hero: HeroRace | null; sameDay: HeroRace[] } {
  const { categories, group, followed, now = Date.now() } = args;
  const groupIds = group === 'all' ? null : new Set(CATEGORY_GROUPS.find((g) => g.id === group)?.ids ?? []);
  const inGroup = categories.filter((category) => !groupIds || groupIds.has(category.id));

  let pool = allUpcoming(inGroup, now);
  if (group === 'all' && followed.size > 0) {
    const followedPool = pool.filter((item) => followed.has(item.category.id));
    if (followedPool.length > 0) pool = followedPool;
  }

  const hero = pool[0] ?? null;
  const sameDay = hero ? pool.filter((item) => item.race.date === hero.race.date) : [];
  return { hero, sameDay };
}
