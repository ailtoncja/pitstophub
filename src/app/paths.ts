// Rotas do site. O Vercel ja reescreve qualquer caminho para o index.html (vercel.json), entao
// links profundos como /piloto/f1/norris funcionam ao abrir direto ou ao atualizar a pagina.
const enc = encodeURIComponent;

export const paths = {
  home: '/',
  calendar: '/calendario',
  standings: '/classificacao',
  categories: '/categorias',
  champions: '/campeoes',
  grid: '/grid',
  rules: (categoryId: string, section = 0) => `/como-funciona/${enc(categoryId)}${section > 0 ? `?s=${section}` : ''}`,
  category: (categoryId: string) => `/categorias/${enc(categoryId)}`,
  driver: (categoryId: string, driverId: string) => `/piloto/${enc(categoryId)}/${enc(driverId)}`,
  team: (categoryId: string, teamId: string) => `/equipe/${enc(categoryId)}/${enc(teamId)}`,
  race: (categoryId: string, raceId: string) => `/circuito/${enc(categoryId)}/${enc(raceId)}`,
  calendarOf: (categoryId: string) => `/calendario?c=${enc(categoryId)}`,
  standingsOf: (categoryId: string) => `/classificacao?c=${enc(categoryId)}`,
} as const;
