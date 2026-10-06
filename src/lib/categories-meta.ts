import type { Category } from '../types';

export type GroupId = 'formulas' | 'americanas' | 'endurance' | 'rally';

export type CategoryGroup = {
  id: GroupId;
  label: { pt: string; en: string };
  ids: string[];
};

// Mesmo agrupamento do menu antigo (NAV_GROUPS), com os nomes do design novo.
export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'formulas', label: { pt: 'Fórmulas', en: 'Formulas' }, ids: ['f1', 'f2', 'f3', 'f1-academy'] },
  { id: 'americanas', label: { pt: 'Americanas', en: 'American' }, ids: ['indy', 'nascar'] },
  {
    id: 'endurance',
    label: { pt: 'Endurance / GT', en: 'Endurance / GT' },
    ids: ['wec', 'imsa', 'dtm', 'gtwc-europe', 'gtwc-america', 'gtwc-asia', 'endurance-brasil'],
  },
  { id: 'rally', label: { pt: 'Rally', en: 'Rally' }, ids: ['wrc'] },
];

export const GROUP_BY_CATEGORY: Record<string, GroupId> = Object.fromEntries(
  CATEGORY_GROUPS.flatMap((group) => group.ids.map((id) => [id, group.id] as const)),
);

export function groupOf(categoryId: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((group) => group.ids.includes(categoryId));
}

// Cor de cada serie (usada em marcadores pequenos; o vermelho de marca segue como destaque principal).
export const CATEGORY_ACCENTS: Record<string, string> = {
  f1: '#e10600',
  f2: '#0093cc',
  f3: '#ff8700',
  'f1-academy': '#e91e8c',
  wec: '#00a19b',
  imsa: '#ffc107',
  dtm: '#6c63ff',
  indy: '#38bdf8',
  nascar: '#f59e0b',
  wrc: '#22c55e',
  'gtwc-europe': '#2ecc71',
  'gtwc-america': '#f39c12',
  'gtwc-asia': '#9b59b6',
  'endurance-brasil': '#009b3a',
};

export const accentOf = (categoryId: string) => CATEGORY_ACCENTS[categoryId] ?? '#e10600';

/** Nome da corrida que o campeonato chama de "rodada" (F1: GP; NASCAR/IndyCar: etapa). */
export function totalRounds(category: Category): number {
  return category.calendar.filter((race) => race.status !== 'cancelled').length;
}

export function completedRounds(category: Category): number {
  return category.calendar.filter((race) => race.status === 'completed').length;
}

/** Quantas equipes/grids: categorias sem equipes (ainda sem dado) mostram so as etapas. */
export function categorySummary(category: Category, language: 'pt' | 'en'): string {
  const teams = category.teams.length;
  const rounds = totalRounds(category);
  const parts: string[] = [];
  if (teams > 0) parts.push(language === 'pt' ? `${teams} Equipes` : `${teams} Teams`);
  if (rounds > 0) parts.push(language === 'pt' ? `${rounds} Etapas` : `${rounds} Rounds`);
  return parts.join(' • ');
}
