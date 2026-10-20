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

// Tom de cada serie: tinge so o campo do reel e dos cartoes. O vermelho de marca (#e10600) fica reservado para
// largada, ao vivo e "seguindo", por isso nenhuma serie usa ele como tom.
export const CATEGORY_ACCENTS: Record<string, string> = {
  f1: '#9aa5b8',
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

export const accentOf = (categoryId: string) => CATEGORY_ACCENTS[categoryId] ?? '#9aa5b8';

/**
 * De onde vem o dado de cada categoria, em tres graus que a interface mostra pela forma do filete:
 * live = calendario e classificacao ao vivo (Jolpica, api-motorsports; atualizam em minutos);
 * daily = calendario e classificacao sincronizados das fontes oficiais pelo motor do Supabase (pitstophub-data);
 * catalog = calendario diario, mas a classificacao vem do catalogo estatico e pode estar desatualizada.
 */
export type DataState = 'live' | 'daily' | 'catalog';

export const DATA_STATE: Record<string, DataState> = {
  f1: 'live',
  'gtwc-europe': 'live',
  'gtwc-america': 'live',
  'gtwc-asia': 'live',
  'endurance-brasil': 'live',
  f2: 'daily',
  f3: 'daily',
  dtm: 'daily',
  wrc: 'daily',
  wec: 'daily',
  imsa: 'daily',
  indy: 'daily',
  nascar: 'daily',
  'f1-academy': 'daily',
};

export const dataStateOf = (categoryId: string): DataState => DATA_STATE[categoryId] ?? 'catalog';

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
