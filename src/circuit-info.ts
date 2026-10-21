import { DRAWN_CIRCUITS } from './circuit-drawings';
import type { Category, Race } from './types';

// Dados de circuitos (extensao, curvas, recorde, zonas de Straight Mode, frenagem, estrategia de pneus).
//
// Mapas (public/circuits/*.png): mapas oficiais de 2026 do formula1.com
// (media.formula1.com/.../common/f1/2026/track/2026track<pista>detailed.png), quadro 16:9
// inteiro reduzido para 1252x704, fundo transparente, sem os baloes de Speed Trap /
// Overtake e sem a legenda "STRAIGHT MODE ZONE" (as hachuras vermelhas das zonas ficam).
//
// Extensao, voltas, recorde, primeiro GP e distancia de prova: paginas de circuito do
// formula1.com (formula1.com/en/racing/2026/<gp>); a distancia e a oficial da F1, nao
// voltas x extensao.

export type CircuitInfo = {
  trackImage?: string;
  // Desenho feito a partir do OpenStreetMap (src/circuit-drawings.ts): exige o credito
  // "© OpenStreetMap" onde o desenho aparece (licenca ODbL).
  osm?: boolean;
  // Os campos abaixo so existem quando ha fonte. Voltas, distancia, recorde, primeira corrida,
  // Straight Mode, frenagens e pneus sao dados do GP de F1 e so valem na pagina da F1.
  lengthKm?: number;
  raceDistanceKm?: number;
  laps?: number;
  corners?: number;
  direction?: 'clockwise' | 'counterclockwise';
  // Ausente quando a pista ainda nao tem recorde de corrida.
  lapRecord?: { time: string; driver: string; year: number };
  firstGrandPrix?: number;
  // O DRS deixou de existir na F1 em 2026; os mapas oficiais de 2026 marcam as zonas de
  // Straight Mode (aero ativa) com hachuras vermelhas. Numero de zonas contado nesses mapas;
  // ausente quando o mapa da F1 ainda nao traz as zonas (mapa antigo ou sem hachura).
  straightModeZones?: number;
  brakingZones?: { turn: string; name: string; pt: string; en: string }[];
  tyreStrategyNote?: { pt: string; en: string };
};

// Dados reais do Autódromo José Carlos Pace (Interlagos), usados só na página de teste do GP de São Paulo.
// Fontes: Wikipedia (Interlagos Circuit) e RaceFans (briefing do GP do Brasil).
const INTERLAGOS_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/interlagos.png',
  lengthKm: 4.309,
  raceDistanceKm: 305.879,
  laps: 71,
  corners: 15,
  direction: 'counterclockwise',
  lapRecord: { time: '1:10.540', driver: 'V. Bottas (Mercedes)', year: 2018 },
  firstGrandPrix: 1973,
  brakingZones: [
    {
      turn: 'C1-C2',
      name: 'Senna S',
      pt: 'Frenada pesada logo após a reta principal, com os carros chegando a mais de 300 km/h. Cerca de 80% das ultrapassagens em Interlagos acontecem aqui ou na Curva 4.',
      en: 'Heavy braking right after the main straight, with cars arriving at over 300 km/h. Around 80% of overtakes at Interlagos happen here or at Turn 4.',
    },
    {
      turn: 'C4',
      name: 'Descida do Lago',
      pt: 'Segunda maior zona de ultrapassagem da pista, na sequência imediata da Senna S.',
      en: "The track's second-biggest overtaking zone, right after the Senna S.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Pista abrasiva e historicamente favorável a estratégias de um pit stop combinando o composto macio com o médio; o desgaste é o fator decisivo, não a diferença de ritmo entre compostos.',
    en: 'An abrasive track that has historically favored one-stop strategies mixing the soft and medium compounds; tyre wear is the deciding factor, not the pace gap between compounds.',
  },
};

// Dados reais do Silverstone Circuit, usados só na página de teste do GP da Grã-Bretanha. Fonte: Wikipedia.
const SILVERSTONE_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/silverstone.png',
  lengthKm: 5.891,
  raceDistanceKm: 306.198,
  laps: 52,
  corners: 18,
  direction: 'clockwise',
  lapRecord: { time: '1:27.097', driver: 'M. Verstappen (Red Bull)', year: 2020 },
  firstGrandPrix: 1950,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C6',
      name: 'Brooklands',
      pt: 'Frenada média ao fim da reta Wellington, numa curva à esquerda que fecha até o ápice; um dos dois pontos de ultrapassagem mais realistas do traçado.',
      en: "Medium-speed braking at the end of the Wellington Straight, a left-hander that tightens to the apex; one of the track's two most realistic overtaking spots.",
    },
    {
      turn: 'C15',
      name: 'Stowe',
      pt: 'Frenada pesada ao fim da reta Hangar, vindo de mais de 300 km/h; principal ponto de ultrapassagem de Silverstone.',
      en: "Heavy braking at the end of the Hangar Straight, arriving at over 300 km/h; Silverstone's main overtaking point.",
    },
  ],
  tyreStrategyNote: {
    pt: 'A sequência de curvas rápidas e de alta carga lateral (como Maggotts-Becketts-Chapel) impõe desgaste severo aos pneus; em 2020 esse estresse chegou a causar múltiplos furos nas voltas finais da corrida. As estratégias alternam entre um e dois pit stops, dependendo da temperatura da pista.',
    en: 'The sequence of fast, high-lateral-load corners (like Maggotts-Becketts-Chapel) puts severe stress on the tyres; in 2020 that stress caused multiple tyre failures in the closing laps of the race. Strategies swing between one and two pit stops depending on track temperature.',
  },
};

// Dados reais do Circuit de Spa-Francorchamps, usados só na página de teste do GP da Bélgica. Fonte: Wikipedia.
const SPA_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/spa.png',
  lengthKm: 7.004,
  raceDistanceKm: 308.054,
  laps: 44,
  corners: 19,
  direction: 'clockwise',
  lapRecord: { time: '1:44.701', driver: 'S. Pérez (Red Bull)', year: 2024 },
  firstGrandPrix: 1950,
  straightModeZones: 5,
  brakingZones: [
    {
      turn: 'C5',
      name: 'Les Combes',
      pt: 'Frenada pesada ao fim da reta Kemmel, vindo de mais de 300 km/h logo depois da subida de Eau Rouge/Raidillon; principal ponto de ultrapassagem de Spa.',
      en: "Heavy braking at the end of the Kemmel Straight, arriving at over 300 km/h right after the Eau Rouge/Raidillon climb; Spa's main overtaking point.",
    },
    {
      turn: 'C1',
      name: 'La Source',
      pt: 'Hairpin lento logo após a linha de largada, sequência clássica de ultrapassagens na primeira volta.',
      en: 'A slow hairpin right after the start/finish line, a classic first-lap overtaking spot.',
    },
  ],
  tyreStrategyNote: {
    pt: 'O trecho mais longo de pista sem curvas do calendário (reta Kemmel) soma-se a um clima notoriamente instável nas Ardenas, que pode obrigar a trocas de pneus de chuva no meio da corrida mesmo em estratégias planejadas para pista seca.',
    en: "The calendar's longest flat-out stretch (Kemmel Straight) combines with notoriously unstable Ardennes weather, which can force mid-race wet-tyre changes even in strategies planned for a dry race.",
  },
};

// Dados reais do Albert Park Circuit, usados só na página de teste do GP da Austrália. Fonte: Wikipedia.
const ALBERT_PARK_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/albertpark.png',
  lengthKm: 5.278,
  raceDistanceKm: 306.124,
  laps: 58,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:19.813', driver: 'C. Leclerc (Ferrari)', year: 2024 },
  firstGrandPrix: 1996,
  straightModeZones: 5,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada logo após a reta principal; principal ponto de ultrapassagem do traçado desde a reconfiguração de 2022.',
      en: "Heavy braking right after the main straight; the layout's primary overtaking point since the 2022 reconfiguration.",
    },
    {
      turn: 'C9',
      name: 'Turn 9',
      pt: 'Fim de uma sequência rápida vinda da Curva 6, com frenada tardia à beira do lago.',
      en: 'The end of a fast sequence from Turn 6, with a late brake alongside the lake.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Pista remodelada em 2022, com asfalto mais liso e curvas mais rápidas que reduziram o desgaste em relação ao traçado antigo; a maioria das corridas recentes tem sido decidida com apenas um pit stop.',
    en: 'Reconfigured in 2022 with smoother asphalt and faster corners that reduced tyre wear compared to the old layout; most recent races have been decided with just a single pit stop.',
  },
};

// Dados reais do Shanghai International Circuit, usados só na página de teste do GP da China. Fonte: Wikipedia.
const SHANGHAI_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/china.png',
  lengthKm: 5.451,
  raceDistanceKm: 305.066,
  laps: 56,
  corners: 16,
  direction: 'clockwise',
  lapRecord: { time: '1:32.238', driver: 'M. Schumacher (Ferrari)', year: 2004 },
  firstGrandPrix: 2004,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1-C2',
      name: 'Curva do Caracol',
      pt: 'Longa curva à direita de raio decrescente, inspirada no caractere chinês "上" (shàng); a frenada inicial é leve, mas a curva aperta progressivamente até a Curva 2.',
      en: 'A long, decreasing-radius right-hander inspired by the Chinese character "上" (shàng); the initial brake is light, but the corner tightens progressively into Turn 2.',
    },
    {
      turn: 'C14',
      name: 'Hairpin',
      pt: 'Frenada pesada ao fim da reta oposta, principal ponto de ultrapassagem do traçado.',
      en: "Heavy braking at the end of the back straight, the layout's main overtaking point.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Superfície abrasiva e curvas de longa duração (como a Curva 1 e a Curva 8) geram desgaste lateral elevado; a estratégia mais comum é de um pit stop, mas o clima instável de Xangai no início da temporada pode forçar mudanças.',
    en: "An abrasive surface and long-duration corners (like Turn 1 and Turn 8) create high lateral tyre wear; a one-stop strategy is most common, but Shanghai's unstable early-season weather can force changes.",
  },
};

// Dados reais do Suzuka International Racing Course, usados só na página de teste do GP do Japão. Fonte: Wikipedia.
const SUZUKA_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/japan.png',
  lengthKm: 5.807,
  raceDistanceKm: 307.471,
  laps: 53,
  corners: 18,
  direction: 'clockwise',
  lapRecord: { time: '1:30.965', driver: 'K. Antonelli (Mercedes)', year: 2025 },
  firstGrandPrix: 1987,
  straightModeZones: 2,
  brakingZones: [
    {
      turn: 'C1',
      name: '130R / Reta Principal',
      pt: 'Único traçado do calendário com um cruzamento em desnível (a pista passa por cima de si mesma perto da Curva 1), seguido de frenada pesada logo depois da lendária 130R.',
      en: "The calendar's only layout with a grade-separated crossover (the track passes over itself near Turn 1), right after the legendary 130R corner.",
    },
    {
      turn: 'C8',
      name: 'Degner',
      pt: 'Sequência de duas curvas rápidas à direita que testa a confiança do carro sob carga lateral, logo após a S de Esses.',
      en: 'A fast two-part right-hand sequence that tests the car under lateral load, right after the Esses.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Considerada uma das pistas mais exigentes do calendário para os pneus, com curvas rápidas e de alta carga lateral em sequência (Esses, Degner, 130R); historicamente decidida com uma parada, mas o clima instável do outono japonês pode obrigar à troca para pneus de chuva.',
    en: "Regarded as one of the most tyre-demanding tracks on the calendar, with a sequence of fast, high-load corners (Esses, Degner, 130R); historically decided with one stop, though unstable autumn weather in Japan can force a switch to wet tyres.",
  },
};

// Bahrain International Circuit (Sakhir), para provas realmente disputadas em Sakhir (GP do
// Bahrein de abril, cancelado em 2026; etapas de F2/F3; 8 Horas do Bahrein da WEC).
// Fontes: Wikipedia; dados de prova em formula1.com/en/racing/2025/bahrain.
const SAKHIR_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/sakhir.png',
  lengthKm: 5.412,
  raceDistanceKm: 308.238,
  laps: 57,
  corners: 15,
  direction: 'clockwise',
  lapRecord: { time: '1:31.447', driver: 'P. de la Rosa (McLaren)', year: 2005 },
  firstGrandPrix: 2004,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada logo após a reta principal, no deserto; ponto de ultrapassagem clássico desde a corrida inaugural de 2004.',
      en: 'Heavy braking right after the main straight, in the desert; a classic overtaking point since the inaugural 2004 race.',
    },
    {
      turn: 'C4',
      name: 'Turn 4',
      pt: 'Segunda maior zona de frenada da pista, ao fim de uma pequena reta que sai da Curva 3.',
      en: "The track's second-biggest braking zone, at the end of a short straight out of Turn 3.",
    },
  ],
  tyreStrategyNote: {
    pt: 'A areia do deserto que se acumula na pista aumenta o desgaste dos pneus ao longo do fim de semana; combinado com o asfalto abrasivo, isso historicamente favorece estratégias de dois pit stops.',
    en: "Desert sand that builds up on the track surface increases tyre wear over the weekend; combined with the abrasive asphalt, this has historically favoured two-stop strategies.",
  },
};

// Sepang International Circuit (Malasia). Em 2026 o GP do Bahrein foi transferido para Sepang
// ("Bahrain Grand Prix in Malaysia", 2-4 de outubro). Fonte: formula1.com/en/racing/2026/bahrain
// (extensao, voltas, distancia, recorde, primeiro GP) e o mapa oficial 2026trackkualalumpurdetailed.png.
const SEPANG_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/sepang.png',
  lengthKm: 5.543,
  raceDistanceKm: 310.417,
  laps: 56,
  corners: 15,
  direction: 'clockwise',
  lapRecord: { time: '1:34.080', driver: 'S. Vettel (Ferrari)', year: 2017 },
  firstGrandPrix: 1999,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada forte no fim da reta principal, entrando num grampo à direita que emenda na Curva 2; o primeiro grande ponto de ultrapassagem da volta.',
      en: 'Hard braking at the end of the main straight into a right-hand hairpin that links into Turn 2; the first big overtaking point of the lap.',
    },
    {
      turn: 'C15',
      name: 'Turn 15',
      pt: 'Grampo final à esquerda, no fim da longa reta oposta; principal ponto de ultrapassagem de Sepang.',
      en: "The final left-hand hairpin at the end of the long back straight; Sepang's main overtaking point.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Calor e umidade tropicais elevam a temperatura do asfalto e o desgaste térmico dos pneus, e as pancadas de chuva da tarde podem mudar a corrida de repente; na era em que a F1 corria aqui, as estratégias de duas ou mais paradas eram comuns.',
    en: 'Tropical heat and humidity push up track temperature and thermal tyre wear, and afternoon downpours can change a race in an instant; in the era when F1 raced here, strategies of two or more stops were common.',
  },
};

// Dados reais do Miami International Autodrome, usados só na página de teste do GP de Miami. Fonte: Wikipedia.
const MIAMI_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/miami.png',
  lengthKm: 5.412,
  raceDistanceKm: 308.326,
  laps: 57,
  corners: 19,
  direction: 'counterclockwise',
  lapRecord: { time: '1:29.708', driver: 'M. Verstappen (Red Bull)', year: 2023 },
  firstGrandPrix: 2022,
  straightModeZones: 3,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada logo após a reta principal, ao redor do estádio do Hard Rock Stadium.',
      en: 'Heavy braking right after the main straight, around the Hard Rock Stadium.',
    },
    {
      turn: 'C11',
      name: 'Turn 11',
      pt: 'Frenada tardia ao fim de uma sequência rápida, um dos pontos de ultrapassagem mais usados da pista.',
      en: "Late braking at the end of a fast sequence, one of the track's most-used overtaking points.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Pista híbrida (rua e permanente) com asfalto relativamente liso; o calor e a umidade da Flórida elevam a temperatura dos pneus, mas o desgaste em si é moderado, favorecendo estratégias de uma parada.',
    en: "A hybrid street/permanent layout with relatively smooth asphalt; Florida's heat and humidity raise tyre temperatures, but wear itself is moderate, favouring one-stop strategies.",
  },
};

// Dados reais do Circuit Gilles Villeneuve, usados só na página de teste do GP do Canadá. Fonte: Wikipedia.
const CANADA_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/canada.png',
  lengthKm: 4.361,
  raceDistanceKm: 305.270,
  laps: 70,
  corners: 14,
  direction: 'counterclockwise',
  lapRecord: { time: '1:13.078', driver: 'V. Bottas (Mercedes)', year: 2019 },
  firstGrandPrix: 1978,
  straightModeZones: 3,
  brakingZones: [
    {
      turn: 'C1-C2',
      name: 'Turn 1-2',
      pt: 'Chicane pesada logo após a reta dos boxes, principal ponto de ultrapassagem na largada.',
      en: 'A heavy chicane right after the pit straight, the main overtaking point off the start.',
    },
    {
      turn: 'C13-C14',
      name: 'Muro dos Campeões',
      pt: 'Chicane final ao fim da reta oposta, batizada assim depois que vários campeões mundiais bateram no muro de saída ali em anos diferentes.',
      en: "The final chicane at the end of the back straight, nicknamed after several world champions crashed into the exit wall there over the years.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Pista semi-urbana de baixa carga aerodinâmica, com frenadas fortes e muitos toques em zebras; o desgaste dos pneus costuma ser baixo, mas o risco de dano por impacto é alto, o que historicamente favorece uma parada.',
    en: 'A low-downforce semi-street track with hard braking zones and lots of kerb contact; tyre wear tends to be low, but impact-damage risk is high, historically favouring a one-stop strategy.',
  },
};

// Dados reais do Circuit de Monaco, usados só na página de teste do GP de Mônaco. Fonte: Wikipedia.
const MONACO_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/monaco.png',
  lengthKm: 3.337,
  raceDistanceKm: 260.286,
  laps: 78,
  corners: 19,
  direction: 'clockwise',
  lapRecord: { time: '1:12.909', driver: 'L. Hamilton (Mercedes)', year: 2021 },
  firstGrandPrix: 1950,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Sainte Dévote',
      pt: 'Primeira curva depois da largada, um funil estreito que costuma decidir a corrida logo na primeira volta.',
      en: 'The first corner after the start, a narrow funnel that often decides the race on the opening lap.',
    },
    {
      turn: 'C10',
      name: 'Chicane do Porto',
      pt: 'Freada brusca ao sair do túnel, vindo da maior velocidade do traçado; um dos raros pontos onde uma ultrapassagem é fisicamente possível.',
      en: "A sharp brake right out of the tunnel, arriving at the layout's highest speed; one of the few points where an overtake is physically possible.",
    },
  ],
  tyreStrategyNote: {
    pt: 'A pista mais estreita e mais lenta do calendário torna ultrapassar quase impossível, então a estratégia gira em torno da classificação e do undercut nos boxes; o desgaste dos pneus é o mais baixo do ano, e a corrida é quase sempre decidida com uma única parada obrigatória.',
    en: "The narrowest, slowest track on the calendar makes overtaking almost impossible, so strategy revolves around qualifying and the pit-stop undercut; tyre wear is the lowest of the year, and the race is almost always settled with a single mandatory stop.",
  },
};

// Dados reais do Circuit de Barcelona-Catalunya (traçado atual, sem chicane final), usados só na página de teste do GP da Espanha. Fonte: Wikipedia.
const SPAIN_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/spain.png',
  lengthKm: 4.657,
  raceDistanceKm: 307.236,
  laps: 66,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:15.743', driver: 'O. Piastri (McLaren)', year: 2025 },
  firstGrandPrix: 1991,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Elf',
      pt: 'Frenada pesada logo após a reta principal, principal ponto de ultrapassagem desde a remoção da chicane final em 2023.',
      en: "Heavy braking right after the main straight, the main overtaking point since the final chicane was removed in 2023.",
    },
    {
      turn: 'C10',
      name: 'Campsa',
      pt: 'Curva rápida à direita que antecede uma pequena reta, testando a confiança do carro em alta velocidade.',
      en: 'A fast right-hander ahead of a short straight, testing the car under high-speed load.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Pista de referência para testes pré-temporada, com curvas de longa duração (como a Curva 3) que geram desgaste elevado no pneu dianteiro esquerdo; costuma ser decidida com uma ou duas paradas, dependendo da temperatura do asfalto.',
    en: "A benchmark pre-season testing venue, with long-duration corners (like Turn 3) that create heavy front-left tyre wear; usually decided with one or two stops, depending on track temperature.",
  },
};

// Dados reais do Red Bull Ring, usados só na página de teste do GP da Áustria. Fonte: Wikipedia.
const AUSTRIA_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/austria.png',
  lengthKm: 4.326,
  raceDistanceKm: 307.026,
  laps: 71,
  corners: 10,
  direction: 'clockwise',
  lapRecord: { time: '1:07.924', driver: 'O. Piastri (McLaren)', year: 2025 },
  firstGrandPrix: 1970,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada em subida logo após a reta principal, o traçado mais curto do calendário e um dos com mais ultrapassagens por volta.',
      en: "Heavy uphill braking right after the main straight, the shortest lap on the calendar and one of the most overtaking-heavy.",
    },
    {
      turn: 'C3',
      name: 'Turn 3',
      pt: 'Segunda frenada pesada em sequência, ao fim de uma reta curta que sai da Curva 2.',
      en: 'A second heavy braking zone in sequence, at the end of a short straight out of Turn 2.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Volta curta e cheia de curvas de subida/descida gera baixo desgaste de pneu, mas o asfalto costuma ter pouca aderência por ser pouco usado fora do fim de semana de corrida; a maioria das estratégias é de uma parada.',
    en: "The short lap full of uphill and downhill corners produces low tyre wear, but the track surface tends to have low grip since it sees little use outside race weekend; most strategies are one-stop.",
  },
};

// Dados reais do Hungaroring, usados só na página de teste do GP da Hungria. Fonte: Wikipedia.
const HUNGARY_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/hungary.png',
  lengthKm: 4.381,
  raceDistanceKm: 306.630,
  laps: 70,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:16.627', driver: 'L. Hamilton (Mercedes)', year: 2020 },
  firstGrandPrix: 1986,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada em subida logo após a reta principal, praticamente o único ponto de ultrapassagem real do traçado.',
      en: "Heavy uphill braking right after the main straight, practically the layout's only real overtaking point.",
    },
    {
      turn: 'C4',
      name: 'Turn 4',
      pt: 'Curva lenta em subida que costuma embaralhar o pelotão logo no início da volta, especialmente em caso de safety car.',
      en: 'A slow uphill corner that often shuffles the field early in the lap, especially after a safety car.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Apelidada de "Mônaco sem muros" por ter curvas de baixa velocidade e pouquíssimas retas, o que historicamente torna a ultrapassagem rara e favorece a estratégia de uma parada baseada na classificação e no undercut.',
    en: 'Nicknamed "Monaco without the walls" for its low-speed corners and very few straights, which historically makes overtaking rare and favours a one-stop strategy built around qualifying and the undercut.',
  },
};

// Dados reais do Circuit Zandvoort, usados só na página de teste do GP dos Países Baixos. Fonte: Wikipedia.
const NETHERLANDS_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/netherlands.png',
  lengthKm: 4.259,
  raceDistanceKm: 306.592,
  laps: 72,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:11.097', driver: 'L. Hamilton (Mercedes)', year: 2021 },
  firstGrandPrix: 1952,
  straightModeZones: 2,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Tarzan',
      pt: 'Frenada pesada de raio fechado logo após a reta principal, com múltiplas linhas de ataque possíveis; principal ponto de ultrapassagem da pista.',
      en: "Heavy, tight-radius braking right after the main straight, with multiple possible lines of attack; the track's main overtaking point.",
    },
    {
      turn: 'C13',
      name: 'Arie Luyendyk',
      pt: 'Curva final banked (inclinada) que leva à reta dos boxes, uma das únicas curvas com sobrelevação do calendário atual.',
      en: "A banked final corner leading onto the pit straight, one of the only banked turns on the current calendar.",
    },
  ],
  tyreStrategyNote: {
    pt: 'As curvas banked (inclinadas) permitem velocidades de curva mais altas que o normal, elevando a carga lateral sobre os pneus; o clima costeiro instável da Holanda é o principal fator de risco para a estratégia.',
    en: "The banked corners allow higher-than-normal cornering speeds, raising lateral tyre load; the Netherlands' unstable coastal weather is the main strategic risk factor.",
  },
};

// Dados reais do Autodromo Nazionale Monza, usados só na página de teste do GP da Itália. Fonte: Wikipedia.
const ITALY_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/italy.png',
  lengthKm: 5.793,
  raceDistanceKm: 306.720,
  laps: 53,
  corners: 11,
  direction: 'clockwise',
  lapRecord: { time: '1:20.901', driver: 'L. Norris (McLaren)', year: 2025 },
  firstGrandPrix: 1950,
  straightModeZones: 4,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Rettifilo',
      pt: 'Chicane pesada logo após a reta mais longa do calendário; principal ponto de ultrapassagem do "templo da velocidade".',
      en: "A heavy chicane right after the calendar's longest straight; the main overtaking point at the 'temple of speed'.",
    },
    {
      turn: 'C8',
      name: 'Ascari',
      pt: 'Sequência de três curvas rápidas em forma de S, uma das mais icônicas do calendário.',
      en: 'A fast three-part S-shaped sequence, one of the most iconic on the calendar.',
    },
  ],
  tyreStrategyNote: {
    pt: 'A pista de menor carga aerodinâmica do calendário, com longas retas e frenadas curtas, gera o menor desgaste de pneu do ano; a estratégia quase sempre é de uma única parada.',
    en: "The lowest-downforce track on the calendar, with long straights and short braking zones, produces the lowest tyre wear of the year; strategy is almost always a single stop.",
  },
};

// Dados do Madring (Madrid), estreante no calendario em 2026. Extensao, voltas, distancia e
// recorde: formula1.com/en/racing/2026/spain. Frenagens e curva inclinada: The Race, Motorsport.com.
const MADRID_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/madrid.png',
  lengthKm: 5.414,
  raceDistanceKm: 308.399,
  laps: 57,
  corners: 22,
  direction: 'clockwise',
  lapRecord: { time: '1:35.587', driver: 'G. Russell (Mercedes)', year: 2026 },
  firstGrandPrix: 2026,
  straightModeZones: 2,
  brakingZones: [
    {
      turn: 'C1-C2',
      name: 'Chicane inicial',
      pt: 'Chicane em alta velocidade logo após a reta dos boxes de 589 metros, com os carros freando de mais de 320 km/h para cerca de 100 km/h.',
      en: 'A high-speed chicane right after the 589-metre pit straight, with cars braking from over 320 km/h down to around 100 km/h.',
    },
    {
      turn: 'C5-C6',
      name: 'Chicane sob o viaduto',
      pt: 'Considerada a melhor zona de ultrapassagem do traçado pelos organizadores, fica logo abaixo de um viaduto de rodovia que corta o circuito.',
      en: "Rated by organisers as the layout's best overtaking zone, it sits right beneath a motorway overpass that cuts through the circuit.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Traçado estreado em 2026, com uma curva banked (inclinada a 24°) de 500 metros batizada de "La Monumental", inspirada na Arena de Las Ventas e na curva de Zandvoort; com apenas uma edição disputada, ainda há pouco histórico para definir a estratégia ideal de pneus.',
    en: 'A layout that debuted in 2026, featuring a 500-metre, 24-degree banked corner nicknamed "La Monumental", inspired by the Las Ventas bullring and Zandvoort\'s banked turn; with only one race held so far, there is still little history to settle the ideal tyre strategy.',
  },
};

// Dados reais do Baku City Circuit, usados só na página de teste do GP do Azerbaijão. Fonte: Wikipedia.
const AZERBAIJAN_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/azerbaijan.png',
  lengthKm: 6.003,
  raceDistanceKm: 306.049,
  laps: 51,
  corners: 20,
  direction: 'counterclockwise',
  lapRecord: { time: '1:43.009', driver: 'C. Leclerc (Ferrari)', year: 2019 },
  firstGrandPrix: 2016,
  straightModeZones: 2,
  brakingZones: [
    {
      turn: 'C1-C2',
      name: 'Turn 1-2',
      pt: 'Frenada pesada logo após a reta principal, primeiro ponto de ultrapassagem do traçado urbano de Baku.',
      en: "Heavy braking right after the main straight, the first overtaking point on Baku's street layout.",
    },
    {
      turn: 'C16',
      name: 'Turn 16',
      pt: 'Frenada tardia ao fim da reta mais longa do calendário, que passa pela Cidade Velha de Baku, chegando a mais de 340 km/h.',
      en: "Late braking at the end of the calendar's longest straight, which runs past Baku's Old City, with cars arriving at over 340 km/h.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Combina a reta mais longa do calendário com um trecho estreito e sinuoso ao lado do castelo medieval; o desgaste de pneu é moderado, mas a alta chance de safety car por causa dos muros próximos torna a estratégia imprevisível.',
    en: "Combines the calendar's longest straight with a narrow, twisty section alongside the medieval castle; tyre wear is moderate, but the high chance of a safety car due to the close walls makes strategy unpredictable.",
  },
};

// Dados reais do Marina Bay Street Circuit (traçado atual, sem a curva 16-17), usados só na página de teste do GP de Singapura. Fonte: Wikipedia.
const SINGAPORE_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/singapore.png',
  lengthKm: 4.927,
  raceDistanceKm: 305.337,
  laps: 62,
  corners: 19,
  direction: 'counterclockwise',
  lapRecord: { time: '1:33.808', driver: 'L. Hamilton (Ferrari)', year: 2025 },
  firstGrandPrix: 2008,
  straightModeZones: 5,
  brakingZones: [
    {
      turn: 'C7',
      name: 'Turn 7',
      pt: 'Frenada pesada ao fim de uma sequência rápida, um dos poucos pontos de ultrapassagem sob as luzes de Marina Bay.',
      en: "Heavy braking at the end of a fast sequence, one of the few overtaking points under Marina Bay's floodlights.",
    },
    {
      turn: 'C14',
      name: 'Turn 14',
      pt: 'Curva lenta perto do fim da volta, historicamente palco de incidentes por causa da pouca visibilidade e dos muros próximos.',
      en: 'A slow corner near the end of the lap, historically the scene of incidents due to poor visibility and close walls.',
    },
  ],
  tyreStrategyNote: {
    pt: 'A corrida noturna mais longa do calendário (cerca de 2 horas) em pista urbana estreita e cheia de zebras eleva muito o risco de safety car; o desgaste térmico costuma favorecer duas paradas, mas quase toda corrida é decidida pela estratégia em torno das interrupções.',
    en: "The calendar's longest night race (around 2 hours) on a narrow street track full of kerbs greatly raises the safety-car risk; thermal degradation tends to favour two stops, but almost every race is decided by strategy around the interruptions.",
  },
};

// Dados reais do Circuit of the Americas, usados só na página de teste do GP dos EUA. Fonte: Wikipedia.
const USA_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/usa.png',
  lengthKm: 5.513,
  raceDistanceKm: 308.405,
  laps: 56,
  corners: 20,
  direction: 'counterclockwise',
  lapRecord: { time: '1:36.169', driver: 'C. Leclerc (Ferrari)', year: 2019 },
  firstGrandPrix: 2012,
  straightModeZones: 2,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Subida íngreme seguida de frenada pesada em uma curva cega, inspirada em Silverstone e Nürburgring.',
      en: 'A steep uphill run followed by heavy braking into a blind corner, inspired by Silverstone and the Nürburgring.',
    },
    {
      turn: 'C12',
      name: 'Turn 12',
      pt: 'Principal ponto de ultrapassagem do traçado, ao fim da reta mais longa do circuito.',
      en: "The layout's main overtaking point, at the end of the circuit's longest straight.",
    },
  ],
  tyreStrategyNote: {
    pt: 'O setor 1, em subida e com curvas de alta carga lateral inspiradas em Silverstone, é o que mais desgasta os pneus; a maioria das corridas é decidida com uma parada.',
    en: 'Sector 1, uphill with high-lateral-load corners inspired by Silverstone, wears the tyres the most; most races are decided with one stop.',
  },
};

// Dados reais do Autódromo Hermanos Rodríguez, usados só na página de teste do GP do México. Fonte: Wikipedia.
const MEXICO_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/mexico.png',
  lengthKm: 4.304,
  raceDistanceKm: 305.354,
  laps: 71,
  corners: 17,
  direction: 'clockwise',
  lapRecord: { time: '1:17.774', driver: 'V. Bottas (Mercedes)', year: 2021 },
  firstGrandPrix: 1963,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Peraltada / Turn 1',
      pt: 'Frenada pesada logo após a reta principal; a altitude de mais de 2.200m reduz a carga aerodinâmica disponível, tornando a frenada mais longa que em pistas ao nível do mar.',
      en: "Heavy braking right after the main straight; the venue's altitude above 2,200m reduces available downforce, making the braking zone longer than at sea-level tracks.",
    },
    {
      turn: 'C17',
      name: 'Foro Sol',
      pt: 'Curva lenta dentro do antigo autódromo de beisebol Foro Sol, com a torcida praticamente em cima da pista.',
      en: "A slow corner inside the former Foro Sol baseball stadium, with the crowd almost on top of the track.",
    },
  ],
  tyreStrategyNote: {
    pt: 'A altitude elevada reduz o downforce e o resfriamento dos pneus, mas também reduz o desgaste em si; a estratégia mais comum é de uma parada, com o setor do estádio (Foro Sol) sendo o ponto mais lento da volta.',
    en: "The high altitude reduces both downforce and tyre cooling, but also reduces wear itself; a one-stop strategy is most common, with the stadium section (Foro Sol) the slowest point of the lap.",
  },
};

// Dados reais do Las Vegas Strip Circuit, usados só na página de teste do GP de Las Vegas. Fonte: Wikipedia.
const VEGAS_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/vegas.png',
  lengthKm: 6.201,
  raceDistanceKm: 309.958,
  laps: 50,
  corners: 17,
  direction: 'counterclockwise',
  lapRecord: { time: '1:33.365', driver: 'M. Verstappen (Red Bull)', year: 2025 },
  firstGrandPrix: 2023,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada logo após a reta dos boxes, com temperaturas noturnas do deserto que deixam a pista e os pneus mais frios que o normal.',
      en: 'Heavy braking right after the pit straight, with cold desert night temperatures leaving the track and tyres cooler than usual.',
    },
    {
      turn: 'C14',
      name: 'Turn 14',
      pt: 'Frenada tardia ao fim da reta da Strip, vindo de mais de 340 km/h passando pelos cassinos e pela Torre Eiffel do Paris Las Vegas.',
      en: 'Late braking at the end of the Strip straight, arriving at over 340 km/h past the casinos and the Paris Las Vegas Eiffel Tower replica.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Corrida noturna com temperaturas de pista baixas para os padrões da F1, o que reduz drasticamente o desgaste térmico dos pneus e favorece a estratégia de uma única parada, apesar das longas retas em alta velocidade.',
    en: "A night race with track temperatures low by F1 standards, which drastically reduces thermal tyre degradation and favours a single-stop strategy despite the long, high-speed straights.",
  },
};

// Dados reais do Lusail International Circuit, usados só na página de teste do GP do Catar. Fonte: Wikipedia.
const QATAR_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/qatar.png',
  lengthKm: 5.419,
  raceDistanceKm: 308.611,
  laps: 57,
  corners: 16,
  direction: 'clockwise',
  lapRecord: { time: '1:22.384', driver: 'L. Norris (McLaren)', year: 2024 },
  firstGrandPrix: 2021,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada logo após a reta principal, sob luzes artificiais no deserto do Catar.',
      en: "Heavy braking right after the main straight, under floodlights in the Qatari desert.",
    },
    {
      turn: 'C12-C13',
      name: 'Turn 12-13',
      pt: 'Sequência rápida de curvas encadeadas que testa a resistência lateral dos pneus por vários segundos seguidos.',
      en: 'A fast, flowing sequence of linked corners that tests tyre lateral endurance for several seconds in a row.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Uma das pistas mais exigentes para os pneus do calendário, com curvas rápidas e de longa duração em sequência; a força-tarefa aerodinâmica e a energia lateral levaram a limites de idade de pneu em edições anteriores.',
    en: "One of the most tyre-demanding tracks on the calendar, with a sequence of fast, long-duration corners; the aerodynamic load and lateral energy led to tyre-age limits in previous editions.",
  },
};

// Dados reais do Yas Marina Circuit (traçado atual, pós-2021), usados só na página de teste do GP de Abu Dhabi. Fonte: Wikipedia.
const ABUDHABI_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/abudhabi.png',
  lengthKm: 5.281,
  raceDistanceKm: 306.188,
  laps: 58,
  corners: 16,
  direction: 'counterclockwise',
  lapRecord: { time: '1:25.637', driver: 'K. Magnussen (Haas)', year: 2024 },
  firstGrandPrix: 2009,
  brakingZones: [
    {
      turn: 'C1',
      name: 'Turn 1',
      pt: 'Frenada pesada logo após a reta principal, remodelada em 2021 para ser mais rápida e favorecer a ultrapassagem.',
      en: 'Heavy braking right after the main straight, reconfigured in 2021 to be faster and more overtaking-friendly.',
    },
    {
      turn: 'C7',
      name: 'Turn 7',
      pt: 'Ponto de frenada tardia criado na remodelagem de 2021, no lugar do antigo setor lento perto do hotel Yas Viceroy.',
      en: "A late-braking point created in the 2021 remodel, replacing the old slow sector near the Yas Viceroy hotel.",
    },
  ],
  tyreStrategyNote: {
    pt: 'Corrida noturna que encerra a temporada, com queda de temperatura ao longo da corrida; a remodelagem de 2021 reduziu curvas lentas e aumentou a velocidade média, mas o desgaste de pneu segue moderado, favorecendo uma parada.',
    en: "A night race that closes out the season, with falling temperatures as it progresses; the 2021 remodel removed slow corners and raised average speed, but tyre wear remains moderate, favouring a one-stop strategy.",
  },
};

// Dados reais do Autodromo Enzo e Dino Ferrari (Imola), usados na pagina de teste
// das etapas de Imola da F3 e da WEC -- a F1 nao corre la em 2026, entao os dados
// de prova (recorde de volta, distancia) sao os do GP da Emilia-Romagna de 2025
// (formula1.com/en/racing/2025/emiliaromagna). O mapa 2026 da F1 para Imola ainda e o
// do estilo antigo, sem zonas de Straight Mode, por isso nao ha contagem de zonas.
const IMOLA_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/imola.png',
  lengthKm: 4.909,
  raceDistanceKm: 309.049,
  laps: 63,
  corners: 19,
  direction: 'counterclockwise',
  lapRecord: { time: '1:15.484', driver: 'L. Hamilton (Mercedes)', year: 2020 },
  firstGrandPrix: 1980,
  brakingZones: [
    {
      turn: 'C2',
      name: 'Tamburello',
      pt: 'Frenada pesada logo após a reta principal, a reta mais longa da pista; ponto mais provável de ultrapassagem em Ímola.',
      en: "Heavy braking right after the main straight, the track's longest; the most likely overtaking point at Imola.",
    },
    {
      turn: 'C17',
      name: 'Rivazza',
      pt: 'Curva dupla à esquerda no fim da volta, estreita e apertada; tentativas de frenada tardia aqui são o principal plano B quando o ataque na reta principal não é suficiente.',
      en: 'A tight, narrow double-left near the end of the lap; late-braking lunges here are the main backup plan when an attack on the main straight is not enough.',
    },
  ],
  tyreStrategyNote: {
    pt: 'Traçado estreito e técnico, historicamente um dos mais difíceis do calendário para ultrapassar — a posição no grid pesa mais do que o ritmo de corrida, o que empurra as equipes para estratégias de um só pit stop e disputas decididas nos boxes (undercut) em vez de na pista.',
    en: 'A narrow, technical layout that is historically one of the hardest on the calendar to overtake on -- grid position matters more than race pace, which pushes teams toward one-stop strategies and battles decided in the pits (the undercut) rather than on track.',
  },
};

// Jeddah Corniche Circuit (GP da Arabia Saudita; cancelado em 2026, como as etapas de F2 e F1
// Academy). A F1 nao publicou mapa novo: o desenho e do OpenStreetMap, conferido com o mapa oficial
// 2026trackjeddahdetailed.png (scripts/circuits/verification/jeddah.json). Extensao, voltas,
// distancia, primeiro GP e recorde: formula1.com/en/racing/2025/saudi-arabia.
const JEDDAH_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/jeddah.png',
  osm: true,
  lengthKm: 6.174,
  raceDistanceKm: 308.45,
  laps: 50,
  lapRecord: { time: '1:30.734', driver: 'L. Hamilton (Mercedes)', year: 2021 },
  firstGrandPrix: 2021,
};

// Identifica GPs por texto (circuito/local/nome), nao pelo id estatico: o calendario de F1
// e substituido pelos dados ao vivo da Jolpica, que pode gerar um id diferente do id local
// quando o casamento por data/nome com a base local falha.
function raceHaystack(race: Race): string {
  return `${race.circuit} ${race.location} ${race.enLocation ?? ''} ${race.name} ${race.enName ?? ''}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function isInterlagosRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return (
    haystack.includes('interlagos') ||
    haystack.includes('jose carlos pace') ||
    haystack.includes('sao paulo')
  );
}

function isSilverstoneRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('silverstone') || haystack.includes('british grand prix') || haystack.includes('gra-bretanha');
}

function isAlbertParkRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('albert park') || haystack.includes('melbourne');
}

function isSpaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  // A GTWC chama a prova de "CrowdStrike 24 Hours of Spa" (local: Belgium/Stavelot).
  return haystack.includes('francorchamps') || haystack.includes('belgian grand prix') || /\bspa\b/.test(haystack) || haystack.includes('stavelot');
}

function isChinaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('shanghai') || haystack.includes('chinese grand prix');
}

function isJapanRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('suzuka') || haystack.includes('japanese grand prix');
}

// O nome do evento nao diz onde ele acontece: em 2026 o "Bahrain Grand Prix in Malaysia"
// foi disputado em Sepang. Por isso o local (circuito/cidade/pais) decide antes do nome.
function isSepangRace(race: Race): boolean {
  // inclui o pais (vem da Jolpica), normalizado do mesmo jeito que o resto
  const haystack = raceHaystack({ ...race, enName: `${race.enName ?? ''} ${race.country ?? ''}` });
  return (
    haystack.includes('sepang') ||
    haystack.includes('kuala lumpur') ||
    haystack.includes('malaysia') ||
    haystack.includes('malasia')
  );
}

function isSakhirRace(race: Race): boolean {
  if (isSepangRace(race)) return false;
  const haystack = raceHaystack(race);
  return (
    haystack.includes('sakhir') ||
    haystack.includes('bahrain international circuit') ||
    // sem local informado, o nome "Bahrein/Bahrain" ainda indica Sakhir
    haystack.includes('bahrain') ||
    haystack.includes('bahrein')
  );
}

function isMiamiRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  // Homestead-Miami Speedway (NASCAR) e outro circuito, fora de Miami.
  return haystack.includes('miami') && !haystack.includes('homestead');
}

function isCanadaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('gilles villeneuve') || haystack.includes('montreal') || haystack.includes('canadian grand prix');
}

function isMonacoRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('monaco') || haystack.includes('monte carlo');
}

function isSpainRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('barcelona') || haystack.includes('catalunya') || haystack.includes('spanish grand prix');
}

function isAustriaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('red bull ring') || haystack.includes('spielberg') || haystack.includes('austrian grand prix');
}

function isHungaryRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('hungaroring') || haystack.includes('budapest') || haystack.includes('hungarian grand prix');
}

function isNetherlandsRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('zandvoort') || haystack.includes('dutch grand prix');
}

function isItalyRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('monza') || haystack.includes('italian grand prix');
}

function isMadridRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('madrid') || haystack.includes('madring');
}

function isAzerbaijanRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('baku') || haystack.includes('azerbaijan');
}

function isSingaporeRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('marina bay') || haystack.includes('singapore');
}

function isUsaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('circuit of the americas') || haystack.includes('austin') || haystack.includes('united states grand prix');
}

function isMexicoRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('hermanos rodriguez') || haystack.includes('mexico city') || haystack.includes('mexican grand prix');
}

function isVegasRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  // "Las Vegas" tambem e o nome da NASCAR em Las Vegas Motor Speedway, um oval
  // permanente bem diferente do circuito de rua que a F1/F1 Academy usam na Strip.
  return haystack.includes('las vegas') && !haystack.includes('motor speedway');
}

function isQatarRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('lusail') || haystack.includes('qatar');
}

function isAbuDhabiRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('yas marina') || haystack.includes('abu dhabi');
}

function isJeddahRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('jeddah') || haystack.includes('saudi arabian grand prix') || haystack.includes('arabia saudita');
}

function isImolaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('imola') || haystack.includes('enzo e dino ferrari') || haystack.includes('emilia');
}

// Paginas de teste habilitadas ate agora: as pistas do calendario de F1 2026 (incluindo
// Sepang, que recebeu o GP do Bahrein, e Jeddah, cancelado em 2026), Sakhir
// (F2/F3/WEC e o GP de abril cancelado) e Imola -- fora do calendario da F1 em 2026, mas
// onde F3 e WEC ainda correm.
const RACE_TEST_CIRCUITS: { match: (race: Race) => boolean; info: CircuitInfo }[] = [
  { match: isInterlagosRace, info: INTERLAGOS_CIRCUIT_INFO },
  { match: isSilverstoneRace, info: SILVERSTONE_CIRCUIT_INFO },
  { match: isAlbertParkRace, info: ALBERT_PARK_CIRCUIT_INFO },
  { match: isSpaRace, info: SPA_CIRCUIT_INFO },
  { match: isChinaRace, info: SHANGHAI_CIRCUIT_INFO },
  { match: isJapanRace, info: SUZUKA_CIRCUIT_INFO },
  // Sepang antes de Sakhir: o GP "do Bahrein" de 2026 foi em Sepang (o local decide, nao o nome).
  { match: isSepangRace, info: SEPANG_CIRCUIT_INFO },
  { match: isSakhirRace, info: SAKHIR_CIRCUIT_INFO },
  { match: isMiamiRace, info: MIAMI_CIRCUIT_INFO },
  { match: isCanadaRace, info: CANADA_CIRCUIT_INFO },
  { match: isMonacoRace, info: MONACO_CIRCUIT_INFO },
  // Madrid antes de Barcelona: na Jolpica a prova do Madring se chama "Spanish Grand Prix".
  { match: isMadridRace, info: MADRID_CIRCUIT_INFO },
  { match: isSpainRace, info: SPAIN_CIRCUIT_INFO },
  { match: isAustriaRace, info: AUSTRIA_CIRCUIT_INFO },
  { match: isHungaryRace, info: HUNGARY_CIRCUIT_INFO },
  { match: isNetherlandsRace, info: NETHERLANDS_CIRCUIT_INFO },
  { match: isItalyRace, info: ITALY_CIRCUIT_INFO },
  { match: isAzerbaijanRace, info: AZERBAIJAN_CIRCUIT_INFO },
  { match: isSingaporeRace, info: SINGAPORE_CIRCUIT_INFO },
  { match: isUsaRace, info: USA_CIRCUIT_INFO },
  { match: isMexicoRace, info: MEXICO_CIRCUIT_INFO },
  { match: isVegasRace, info: VEGAS_CIRCUIT_INFO },
  { match: isQatarRace, info: QATAR_CIRCUIT_INFO },
  { match: isAbuDhabiRace, info: ABUDHABI_CIRCUIT_INFO },
  { match: isImolaRace, info: IMOLA_CIRCUIT_INFO },
  { match: isJeddahRace, info: JEDDAH_CIRCUIT_INFO },
];

// ---------------------------------------------------------------------------------------------
// Circuitos desenhados a partir do OpenStreetMap (src/circuit-drawings.ts). Um lugar pode ter
// mais de um tracado (oval e misto de Daytona e Indianapolis, Watkins Glen com e sem o Boot...):
// o tracado sai da prova (categoria + data), do texto (ex.: "misto", "Road Course") ou da categoria.

type Venue = {
  // Termos (sem acento, minusculos) que identificam o lugar; basta um.
  terms: (string | RegExp)[];
  // Termos que descartam o lugar mesmo quando um dos termos aparece.
  not?: string[];
  // So nestas categorias (ex.: "Las Vegas" sozinho so e o oval na NASCAR).
  categories?: string[];
  // Desenho padrao do lugar.
  layout: string;
  // Tracado por categoria, quando o lugar tem mais de um.
  byCategory?: Record<string, string>;
  // Tracado pelo texto da prova (vence a categoria).
  byText?: { terms: (string | RegExp)[]; layout: string }[];
  // Tracado de uma prova especifica (categoria + data da etapa, +-2 dias; vence o resto).
  byEvent?: { categoryId: string; date: string; layout: string }[];
};

function hasTerm(haystack: string, term: string | RegExp): boolean {
  return typeof term === 'string' ? haystack.includes(term) : term.test(haystack);
}

const VENUES: Venue[] = [
  // NASCAR / IndyCar / IMSA / GTWC America
  { terms: ['bowman gray', 'winston-salem'], layout: 'bowman-gray' },
  {
    terms: ['daytona'],
    layout: 'daytona-oval',
    byCategory: { imsa: 'daytona-road' },
    byText: [{ terms: ['rolex 24', 'road course'], layout: 'daytona-road' }],
  },
  { terms: ['road atlanta', 'braselton', 'petit le mans'], layout: 'road-atlanta' },
  { terms: ['echopark', 'atlanta motor speedway', 'hampton'], layout: 'atlanta' },
  { terms: ['circuit of the americas', 'austin', /\bcota\b/], categories: ['nascar'], layout: 'cota-national' },
  { terms: ['phoenix', 'avondale'], layout: 'phoenix' },
  { terms: ['las vegas motor speedway'], layout: 'las-vegas-motor-speedway' },
  { terms: ['las vegas'], categories: ['nascar'], layout: 'las-vegas-motor-speedway' },
  { terms: ['darlington'], layout: 'darlington' },
  { terms: ['martinsville'], layout: 'martinsville' },
  { terms: ['bristol'], layout: 'bristol' },
  { terms: ['kansas'], layout: 'kansas' },
  { terms: ['talladega'], layout: 'talladega' },
  { terms: ['texas motor speedway', 'fort worth'], layout: 'texas' },
  { terms: ['watkins glen'], layout: 'watkins-glen', byCategory: { nascar: 'watkins-glen-nascar' } },
  { terms: ['dover'], layout: 'dover' },
  {
    terms: ['charlotte', 'concord'],
    layout: 'charlotte-oval',
    // Em 2026 a corrida de outubro voltou para o oval; o Roval so quando a prova disser.
    byText: [{ terms: ['roval'], layout: 'charlotte-roval' }],
  },
  { terms: ['nashville', 'lebanon'], layout: 'nashville-superspeedway' },
  { terms: ['michigan international', 'brooklyn'], layout: 'michigan' },
  { terms: [/\bmichigan\b/], categories: ['nascar'], layout: 'michigan' },
  { terms: ['pocono', 'long pond'], layout: 'pocono' },
  { terms: ['san diego', 'coronado'], layout: 'san-diego' },
  { terms: ['sonoma'], layout: 'sonoma', byCategory: { 'gtwc-america': 'sonoma-gtwc' } },
  { terms: ['chicagoland', 'joliet'], layout: 'chicagoland' },
  { terms: ['north wilkesboro'], layout: 'north-wilkesboro' },
  {
    terms: ['indianapolis', 'indy 500', 'brickyard'],
    layout: 'indianapolis-oval',
    byCategory: { imsa: 'indianapolis-road', 'gtwc-america': 'indianapolis-road' },
    byText: [
      { terms: [/\b500\b/, 'brickyard'], layout: 'indianapolis-oval' },
      { terms: ['misto', 'road course', 'ims road', /\brc\b/, 'gp de indianapolis'], layout: 'indianapolis-road' },
    ],
  },
  { terms: [/\biowa\b/, 'newton'], layout: 'iowa' },
  { terms: ['richmond'], layout: 'richmond' },
  { terms: ['new hampshire', 'loudon'], layout: 'new-hampshire' },
  { terms: ['gateway', 'world wide technology', 'wwtr', 'madison'], layout: 'gateway' },
  { terms: ['homestead'], layout: 'homestead' },
  { terms: ['petersburg'], layout: 'st-petersburg' },
  { terms: ['arlington'], layout: 'arlington' },
  { terms: ['barber'], layout: 'barber' },
  { terms: ['long beach'], layout: 'long-beach' },
  { terms: ['detroit'], layout: 'detroit' },
  { terms: ['road america', 'elkhart lake'], layout: 'road-america' },
  { terms: ['mid-ohio', 'mid ohio'], layout: 'mid-ohio' },
  { terms: ['portland'], layout: 'portland' },
  { terms: ['markham'], layout: 'markham' },
  { terms: ['washington'], layout: 'washington-dc' },
  { terms: ['milwaukee', 'west allis'], layout: 'milwaukee' },
  { terms: ['laguna seca', 'monterey'], layout: 'laguna-seca' },
  { terms: ['sebring'], layout: 'sebring' },
  { terms: ['mosport', 'canadian tire', 'bowmanville'], layout: 'mosport' },
  { terms: ['virginia international', /\bvir\b/, /\balton\b/], layout: 'vir' },
  // Europa e Asia (DTM, WEC, GTWC)
  { terms: ['lausitz'], layout: 'lausitzring' },
  { terms: ['norisring'], layout: 'norisring' },
  { terms: ['oschersleben'], layout: 'oschersleben' },
  {
    terms: ['nurburg'],
    not: ['nordschleife'],
    layout: 'nurburgring-gp',
    byCategory: { dtm: 'nurburgring-sprint' },
    byText: [{ terms: ['sprint'], layout: 'nurburgring-sprint' }],
  },
  { terms: ['sachsenring'], layout: 'sachsenring' },
  { terms: ['hockenheim'], layout: 'hockenheim' },
  // "Petit Le Mans" (Road Atlanta, acima) e "Lone Star Le Mans" (COTA) nao sao em Le Mans.
  { terms: ['sarthe', /\ble mans\b/], not: ['petit le mans', 'lone star'], layout: 'le-mans' },
  { terms: ['fuji'], layout: 'fuji' },
  { terms: ['paul ricard', 'le castellet'], layout: 'paul-ricard' },
  { terms: ['brands hatch'], layout: 'brands-hatch' },
  { terms: ['misano'], layout: 'misano' },
  { terms: ['magny'], layout: 'magny-cours' },
  { terms: ['portimao', 'algarve'], layout: 'portimao' },
  { terms: ['mandalika'], layout: 'mandalika' },
  { terms: ['okayama'], layout: 'okayama' },
  { terms: ['beijing', 'pequim'], layout: 'beijing-street' },
  // Brasil
  { terms: ['velocitta', 'velo citta', 'mogi guacu'], layout: 'velocitta' },
  { terms: ['brasilia', 'nelson piquet'], layout: 'brasilia' },
  { terms: ['velopark', 'nova santa rita'], layout: 'velopark' },
  { terms: ['santa cruz'], layout: 'santa-cruz-do-sul' },
  { terms: ['goiania'], layout: 'goiania' },
  { terms: ['cascavel'], layout: 'cascavel' },
  { terms: ['cuiaba', 'mato grosso'], layout: 'cuiaba' },
  { terms: ['londrina'], layout: 'londrina' },
  { terms: ['curvelo', 'cristais'], layout: 'curvelo' },
  { terms: ['chapeco'], layout: 'chapeco' },
];

const DAY_MS = 86_400_000;

function sameWeekend(a: string, b: string): boolean {
  const gap = Math.abs(Date.parse(`${a.slice(0, 10)}T00:00:00Z`) - Date.parse(`${b.slice(0, 10)}T00:00:00Z`)) / DAY_MS;
  return Number.isFinite(gap) && gap <= 2;
}

function venueLayout(venue: Venue, race: Race, haystack: string, categoryId?: string): string {
  const event = venue.byEvent?.find((e) => e.categoryId === categoryId && sameWeekend(e.date, race.date));
  if (event) return event.layout;
  const text = venue.byText?.find((option) => option.terms.some((term) => hasTerm(haystack, term)));
  if (text) return text.layout;
  return (categoryId && venue.byCategory?.[categoryId]) || venue.layout;
}

/** undefined: nenhum lugar desenhado reconhecido; null: lugar reconhecido, mas sem desenho verificado do tracado. */
function findDrawnCircuit(race: Race, categoryId?: string): CircuitInfo | null | undefined {
  const haystack = raceHaystack({ ...race, enName: `${race.enName ?? ''} ${race.country ?? ''}` });
  for (const venue of VENUES) {
    if (venue.categories && !(categoryId && venue.categories.includes(categoryId))) continue;
    if (!venue.terms.some((term) => hasTerm(haystack, term))) continue;
    if (venue.not?.some((term) => haystack.includes(term))) continue;
    const drawn = DRAWN_CIRCUITS[venueLayout(venue, race, haystack, categoryId)];
    // Sem desenho verificado desse tracado: nenhum mapa, em vez do mapa de outro tracado (ex.: a
    // NASCAR em COTA usa o National Course de 2,4 milhas, nao o tracado da F1).
    if (!drawn) return null;
    return { trackImage: drawn.trackImage, osm: true, lengthKm: drawn.lengthKm, corners: drawn.corners, direction: drawn.direction };
  }
  return undefined;
}

// Voltas, distancia, recorde, primeiro GP, Straight Mode, frenagens e pneus sao dados do GP de F1:
// nas outras categorias fica so o que e do circuito.
function circuitOnly(info: CircuitInfo): CircuitInfo {
  return { trackImage: info.trackImage, osm: info.osm, lengthKm: info.lengthKm, corners: info.corners, direction: info.direction };
}

/**
 * Ficha do circuito de uma etapa. Com a categoria, escolhe o tracado certo do lugar (ex.: Daytona
 * oval na NASCAR, misto na IMSA) e deixa os dados do GP de F1 so na F1. O WRC nao tem ficha: o nome
 * da etapa cita cidades (Monte-Carlo...), mas o rali roda em estradas, nao num circuito.
 */
export function getRaceCircuitInfo(race: Race, categoryId?: string): CircuitInfo | null {
  if (categoryId === 'wrc') return null;
  const drawn = findDrawnCircuit(race, categoryId);
  if (drawn !== undefined) return drawn;
  const info = RACE_TEST_CIRCUITS.find(({ match }) => match(race))?.info ?? null;
  if (!info || !categoryId || categoryId === 'f1') return info;
  return circuitOnly(info);
}

export function hasCircuitPage(category: Category, race: Race): boolean {
  return getRaceCircuitInfo(race, category.id) != null;
}
