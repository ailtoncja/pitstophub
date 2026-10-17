import { matchPath } from 'react-router-dom';

// Qual categoria a pagina atual "e": o parametro da rota nas paginas de categoria, piloto, equipe, corrida e regras;
// nas abas Calendario, Classificacao e Grid, a categoria escolhida (?c= ou guardada no aparelho).
const ROUTE_PATTERNS = [
  '/categorias/:categoryId',
  '/piloto/:categoryId/:driverId',
  '/equipe/:categoryId/:teamId',
  '/circuito/:categoryId/:raceId',
  '/como-funciona/:categoryId',
];
const SELECTED_SECTIONS = new Set(['calendario', 'classificacao', 'grid']);

export function scopeCategoryId(pathname: string, selectedId: string): string | null {
  for (const pattern of ROUTE_PATTERNS) {
    const match = matchPath(pattern, pathname);
    if (match?.params.categoryId) return decodeURIComponent(match.params.categoryId);
  }
  const section = pathname.split('/')[1] ?? '';
  return SELECTED_SECTIONS.has(section) ? selectedId : null;
}

/** Secoes que pertencem a "Categorias" na navegacao inferior do celular. */
export const CATEGORY_SECTIONS = new Set(['categorias', 'calendario', 'classificacao', 'grid', 'piloto', 'equipe', 'circuito', 'como-funciona', 'campeoes']);
