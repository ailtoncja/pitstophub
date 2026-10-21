// Tipos da ficha de rali (WRC). Ver src/rally-info.ts.

export type RallySurface = 'gravel' | 'tarmac' | 'snow' | 'mixed';

export type RallyStage = {
  /** Numero da especial (SS). */
  number: number;
  name: string;
  km: number;
  /** Horario do 1o carro, com o fuso do rali (ISO 8601). Ausente quando a fonte nao publica. */
  startsAt?: string;
  /** Chave da geometria no mapa (especiais repetidas compartilham a mesma estrada). */
  routeId?: string;
  powerStage?: boolean;
};

export type RallyDay = {
  /** Data local do rali (AAAA-MM-DD). */
  date: string;
  stages: RallyStage[];
  /** Shakedown: treino cronometrado que nao conta para o resultado. */
  shakedown?: { name: string; km?: number; startsAt?: string };
};

export type RallyRoute = {
  id: string;
  /** Rotulo no mapa, ex.: "SS2/5". */
  label: string;
  /** Tracado em coordenadas do viewBox; ausente quando so ha largada e chegada. */
  path?: string;
  start: readonly [number, number];
  finish: readonly [number, number];
  /** Onde o rotulo fica (coordenadas do viewBox). */
  labelAt: readonly [number, number];
  /** Ponto da especial de onde sai a linha-guia ate o rotulo. */
  leaderFrom: readonly [number, number];
  anchor: 'left' | 'right' | 'center';
};

export type RallyMap = {
  width: number;
  height: number;
  /** Terra (poligonos de costa do OSM); vazio = so fundo de terra. */
  land: string;
  /** 'route' = tracado oficial; 'points' = so largada/chegada. */
  geometry: 'route' | 'points';
  routes: RallyRoute[];
  servicePark: { x: number; y: number } | null;
  towns: { name: string; x: number; y: number }[];
  scaleBar: { km: number; px: number };
  usesOsm: boolean;
};

export type RallySource = {
  label: string;
  url: string;
  /** Fonte secundaria (imprensa, Wikipedia): a tela marca como tal. */
  secondary?: boolean;
};

export type RallyInfo = {
  id: string;
  /** Primeiro e ultimo dia do rali (datas locais). */
  dates: { start: string; end: string };
  surface: RallySurface;
  /** Totais declarados pela fonte do itinerario (o teste confere com a soma das especiais). */
  official: { stages: number; km: number };
  /** Versao do documento do itinerario, quando publicada. */
  itineraryVersion?: string;
  /** O itinerario veio de fonte secundaria (sem documento oficial acessivel). */
  itinerarySecondary?: boolean;
  servicePark?: string;
  days: RallyDay[];
  /** Sem localizacao confiavel das especiais: a ficha aparece sem mapa. */
  map?: RallyMap;
  /** Nota curta sobre o mapa (ex.: por que so pontos). */
  mapNote?: { pt: string; en: string };
  sources: RallySource[];
};
