import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Timer,
  Flag,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  Info,
  XCircle,
  CheckCircle2,
  Sun,
  Moon,
  LayoutGrid,
  Menu,
  X,
  Languages,
  Heart,
  Download,
  Share2,
  Route,
  Zap,
  AlertTriangle,
  Film
} from 'lucide-react';
import { MOTORSPORT_DATA, Category } from './types';
import { OpenWheelCarIcon, HypercarIcon, GtCarIcon, RallyCarIcon, StockCarIcon } from './category-icons';
import { cn } from './lib/utils';
import { getUserSettings, saveUserSettings, type AuthUser } from './auth';
import { isIntroDisabled, setIntroDisabled } from './IntroGate';
import {
  fetchCategoryLiveData,
  fetchCategoryLiveSummary,
  fetchDriverSeasonResults,
  getSupportedLiveCategoryIds,
  isCategoryLiveSupported,
  mergeCategoryWithLiveData,
  type DriverResultRow,
  type JolpicaCategoryData,
} from './jolpica';
import {
  fetchSyncedCalendar,
  fetchSyncedStandings,
  getSyncedCategoryIds,
  mergeCategoryWithSyncedCalendar,
  mergeCategoryWithSyncedStandings,
} from './synced-races';
import type { Driver, Race, StandingItem } from './types';
import { FavoritesPicker, FavoritesOnboardingModal, NotificationsToggle } from './Favorites';

const IconMap: Record<string, React.ElementType> = {
  OpenWheelCar: OpenWheelCarIcon,
  Hypercar: HypercarIcon,
  GtCar: GtCarIcon,
  RallyCar: RallyCarIcon,
  StockCar: StockCarIcon,
};

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 };
const SPRING_SOFT = { type: 'spring' as const, stiffness: 280, damping: 28 };

const CATEGORY_BY_ID = new Map(MOTORSPORT_DATA.map(c => [c.id, c]));
const F1_STATIC_FALLBACK: Partial<Category> = {
  calendar: [],
  standings: undefined,
};

const CATEGORY_ACCENTS: Record<string, string> = {
  f1: '#e10600',
  f2: '#0093CC',
  f3: '#FF8700',
  'f1-academy': '#E91E8C',
  wec: '#00A19B',
  imsa: '#FFC107',
  dtm: '#6C63FF',
  'gt-world-challenge': '#2ECC71',
  indy: '#003DA5',
  nascar: '#D62828',
  wrc: '#2E7D32',
};

const getCategoryAccent = (id: string) => CATEGORY_ACCENTS[id] ?? '#e10600';

// Decide se texto branco ou escuro le melhor em cima da cor da categoria
// (algumas, como o amarelo da IMSA, sao claras demais pra texto branco).
function getAccentTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#12121a' : '#ffffff';
}

const NAV_GROUPS = [
  {
    name: { pt: 'Fórmulas', en: 'Formulas' },
    ids: ['f1', 'f2', 'f3', 'f1-academy']
  },
  {
    name: { pt: 'Endurance/GT', en: 'Endurance/GT' },
    ids: ['wec', 'imsa', 'dtm', 'gt-world-challenge']
  },
  {
    name: { pt: 'Americanas', en: 'American' },
    ids: ['indy', 'nascar']
  },
  {
    name: { pt: 'Rally', en: 'Rally' },
    ids: ['wrc']
  }
];

const UI_TRANSLATIONS = {
  pt: {
    home: 'Início',
    explore: 'Explorar',
    viewRules: 'Ver Regras',
    season2026: 'Temporada 2026',
    seasonLabel: 'Temporada',
    viewCalendar: 'Ver Calendário',
    rulesAndFormat: 'Regras e Formato',
    nextStage: 'Próxima Etapa',
    seasonEnd: 'Fim da Temporada',
    overview: 'Visão Geral',
    teams: 'Equipes',
    calendar: 'Calendário',
    standings: 'Classificação',
    accessCategory: 'Acessar Categoria',
    viewSummary: 'Ver Resumo',
    liveData: 'Dados ao Vivo',
    language: 'Idioma',
    appearance: 'Tema',
    introAnimation: 'Animação',
    introAnimationOn: 'Animação de abertura ativada. Clique para desativar.',
    introAnimationOff: 'Animação de abertura desativada. Clique para ativar.',
    tagline: 'Explore os calendários, equipes e pilotos das principais competições do automobilismo mundial em 2026.',
    drivers: 'Pilotos',
    constructors: 'Construtores',
    points: 'Pontos',
    position: 'Posição',
    team: 'Equipe',
    location: 'Local',
    date: 'Data',
    circuit: 'Circuito',
    winner: 'Vencedor',
    roundLabel: 'Etapa',
    upcoming: 'Próxima',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    result: 'Resultado',
    event: 'Evento',
    officialTeams: 'Equipes Oficiais',
    driversOnGrid: 'Pilotos no Grid',
    rounds: 'Etapas',
    racesInSeason: 'Corridas na Temporada',
    grid2026: 'Grid 2026',
    driversChampionship: 'Campeonato de Pilotos',
    constructorsChampionship: 'Campeonato de Construtores',
    teamsChampionship: 'Campeonato de Equipes',
    allRightsReserved: 'Todos os direitos reservados.',
    gotIt: 'Entendido',
    standingsNotAvailable: 'Pontuação não disponível',
    standingsNotAvailableDesc: 'As pontuações completas desta categoria não estão disponíveis publicamente no momento.',
    login: 'Entrar',
    logout: 'Sair',
    follow: 'Seguir',
    following: 'Seguindo',
    followCategory: 'Seguir categoria',
    followingCategory: 'Seguindo categoria',
    status: 'Status',
    notAvailableShort: 'N/A',
    fiaSanctioned: 'Homologado FIA',
    installApp: 'Instalar App',
    installingApp: 'Instalando...',
    iosInstallTitle: 'Instalar PitStopHub',
    iosInstallDesc: "Toque em Compartilhar e depois em 'Adicionar à Tela de Início'",
    iosInstallDismiss: 'Agora não',
    liveDataLoading: 'Sincronizando dados ao vivo...',
    liveDataError: 'Nao foi possivel carregar dados ao vivo agora.',
    liveDataFallback: 'Esta categoria segue usando a base local por enquanto.',
    liveNextEvent: 'Proximo evento ao vivo',
    liveLastResult: 'Ultimo resultado',
    liveSource: 'Fonte: OpenF1 API',
    championshipLeader: 'Lider do campeonato',
    constructorsLeader: 'Lider entre equipes',
    upNext: 'Próxima Largada',
    daysToGo: 'dias para a corrida',
    raceToday: 'É hoje!',
    daysLabel: 'Dias',
    hoursLabel: 'Horas',
    minsLabel: 'Min',
    noUpcomingRace: 'Nenhuma corrida agendada no momento.',
    featuredTitle: 'Destaques',
    latestWinner: 'Último Vencedor',
    seasonPanorama: 'Panorama 2026',
    categoriesLabel: 'Categorias',
    trackLayout: 'Traçado do Circuito',
    trackSpecs: 'Ficha Técnica',
    circuitLength: 'Extensão',
    raceDistance: 'Distância da Prova',
    laps: 'Voltas',
    corners: 'Curvas',
    direction: 'Sentido',
    counterclockwise: 'Anti-horário',
    clockwise: 'Horário',
    lapRecord: 'Recorde da Volta',
    firstGrandPrix: 'Primeiro GP',
    drsZones: 'Zonas de DRS',
    tyreStrategy: 'Estratégia de Pneus',
    criticalBrakingZones: 'Principais Zonas de Frenagem',
    dataSourceNote: 'Dados verificados publicamente (Wikipedia, RaceFans).',
    wins: 'Vitórias',
    teammate: 'Companheiro de Equipe',
    chassis: 'Chassi',
    winsThisSeason: 'Vitórias na Temporada',
    noWinsYet: 'Nenhuma vitória nesta temporada ainda.',
    driverProfile: 'Perfil do Piloto',
    careerOverview: 'Carreira',
    grid: 'Grid',
    finish: 'Chegada',
    recentResults: 'Resultados Recentes',
    podiums: 'Pódios',
    favorites: 'Favoritos',
    favoritesPageDesc: 'Escolha os times e pilotos que você quer acompanhar e defina a ordem de prioridade entre eles.',
    featuredRaces: 'Corridas Futuras',
    championshipLeaders: 'Líderes do Campeonato',
    raceLabel: 'Corrida',
    lapRecordPending: 'Ainda não disputado'
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    viewRules: 'View Rules',
    season2026: '2026 Season',
    seasonLabel: 'Season',
    viewCalendar: 'View Calendar',
    rulesAndFormat: 'Rules and Format',
    nextStage: 'Next Stage',
    seasonEnd: 'Season End',
    overview: 'Overview',
    teams: 'Teams',
    calendar: 'Calendar',
    standings: 'Standings',
    accessCategory: 'Access Category',
    viewSummary: 'View Summary',
    liveData: 'Live Data',
    language: 'Language',
    appearance: 'Theme',
    introAnimation: 'Intro',
    introAnimationOn: 'Boot animation enabled. Click to disable.',
    introAnimationOff: 'Boot animation disabled. Click to enable.',
    tagline: 'Explore the calendars, teams and drivers of the world\'s main motorsport competitions in 2026.',
    drivers: 'Drivers',
    constructors: 'Constructors',
    points: 'Points',
    position: 'Position',
    team: 'Team',
    location: 'Location',
    date: 'Date',
    circuit: 'Circuit',
    winner: 'Winner',
    roundLabel: 'Round',
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
    result: 'Result',
    event: 'Event',
    officialTeams: 'Official Teams',
    driversOnGrid: 'Drivers on Grid',
    rounds: 'Rounds',
    racesInSeason: 'Races in Season',
    grid2026: 'Grid 2026',
    driversChampionship: 'Drivers Championship',
    constructorsChampionship: 'Constructors Championship',
    teamsChampionship: 'Teams Championship',
    allRightsReserved: 'All rights reserved.',
    gotIt: 'Got it',
    standingsNotAvailable: 'Standings not available',
    standingsNotAvailableDesc: 'Full standings for this category are not publicly available at the moment.',
    login: 'Login',
    logout: 'Logout',
    follow: 'Follow',
    following: 'Following',
    followCategory: 'Follow category',
    followingCategory: 'Following category',
    status: 'Status',
    notAvailableShort: 'N/A',
    fiaSanctioned: 'FIA Sanctioned',
    installApp: 'Install App',
    installingApp: 'Installing...',
    iosInstallTitle: 'Install PitStopHub',
    iosInstallDesc: "Tap Share then 'Add to Home Screen'",
    iosInstallDismiss: 'Not now',
    liveDataLoading: 'Syncing live data...',
    liveDataError: 'Unable to load live data right now.',
    liveDataFallback: 'This category is still using the local dataset for now.',
    liveNextEvent: 'Next live event',
    liveLastResult: 'Latest result',
    liveSource: 'Source: OpenF1 API',
    championshipLeader: 'Championship leader',
    constructorsLeader: 'Team leader',
    upNext: 'Up Next',
    daysToGo: 'days to go',
    raceToday: 'Race day!',
    daysLabel: 'Days',
    hoursLabel: 'Hours',
    minsLabel: 'Min',
    noUpcomingRace: 'No races scheduled right now.',
    featuredTitle: 'Highlights',
    latestWinner: 'Latest Winner',
    seasonPanorama: '2026 Overview',
    categoriesLabel: 'Categories',
    trackLayout: 'Track Layout',
    trackSpecs: 'Track Specs',
    circuitLength: 'Circuit Length',
    raceDistance: 'Race Distance',
    laps: 'Laps',
    corners: 'Corners',
    direction: 'Direction',
    counterclockwise: 'Counterclockwise',
    clockwise: 'Clockwise',
    lapRecord: 'Lap Record',
    firstGrandPrix: 'First Grand Prix',
    drsZones: 'DRS Zones',
    tyreStrategy: 'Tyre Strategy',
    criticalBrakingZones: 'Critical Braking Zones',
    dataSourceNote: 'Publicly verified data (Wikipedia, RaceFans).',
    wins: 'Wins',
    teammate: 'Teammate',
    chassis: 'Chassis',
    winsThisSeason: 'Wins This Season',
    noWinsYet: 'No wins this season yet.',
    driverProfile: 'Driver Profile',
    careerOverview: 'Career Overview',
    grid: 'Grid',
    finish: 'Finish',
    recentResults: 'Recent Results',
    podiums: 'Podiums',
    favorites: 'Favorites',
    favoritesPageDesc: 'Choose the teams and drivers you want to follow and set the priority order between them.',
    featuredRaces: 'Upcoming Races',
    championshipLeaders: 'Championship Leaders',
    raceLabel: 'Race',
    lapRecordPending: 'Not raced yet'
  }
};

type CircuitInfo = {
  trackImage?: string;
  lengthKm: number;
  raceDistanceKm: number;
  laps: number;
  corners: number;
  direction: 'clockwise' | 'counterclockwise';
  // Ausente para pistas novas que ainda nao sediaram corrida (ex.: Madrid em 2026).
  lapRecord?: { time: string; driver: string; year: number };
  firstGrandPrix: number;
  drsZones: { pt: string; en: string }[];
  brakingZones: { turn: string; name: string; pt: string; en: string }[];
  tyreStrategyNote: { pt: string; en: string };
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
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Reta oposta, da Curva 12 até a Curva 13', en: 'Back straight, from Turn 12 into Turn 13' },
  ],
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
  drsZones: [
    { pt: 'Reta Wellington, de Aintree até Brooklands', en: 'Wellington Straight, from Aintree into Brooklands' },
    { pt: 'Reta Hangar, de Chapel até Stowe', en: 'Hangar Straight, from Chapel into Stowe' },
  ],
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
  raceDistanceKm: 308.052,
  laps: 44,
  corners: 19,
  direction: 'clockwise',
  lapRecord: { time: '1:44.701', driver: 'S. Pérez (Red Bull)', year: 2024 },
  firstGrandPrix: 1950,
  drsZones: [
    { pt: 'Reta Kemmel, de Raidillon até Les Combes', en: 'Kemmel Straight, from Raidillon into Les Combes' },
    { pt: 'Reta dos boxes, entrando na Curva 1 (La Source)', en: 'Pit straight, into Turn 1 (La Source)' },
  ],
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
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Da Curva 6 até a Curva 9', en: 'From Turn 6 into Turn 9' },
  ],
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
  raceDistanceKm: 305.256,
  laps: 56,
  corners: 16,
  direction: 'clockwise',
  lapRecord: { time: '1:32.238', driver: 'M. Schumacher (Ferrari)', year: 2004 },
  firstGrandPrix: 2004,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Reta oposta, entrando na Curva 14', en: 'Back straight, into Turn 14' },
  ],
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
  raceDistanceKm: 307.771,
  laps: 53,
  corners: 18,
  direction: 'clockwise',
  lapRecord: { time: '1:30.965', driver: 'K. Antonelli (Mercedes)', year: 2025 },
  firstGrandPrix: 1987,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
  ],
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

// Dados reais do Bahrain International Circuit, usados só na página de teste do GP do Bahrein. Fonte: Wikipedia.
const BAHRAIN_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/bahrain.png',
  lengthKm: 5.412,
  raceDistanceKm: 308.484,
  laps: 57,
  corners: 15,
  direction: 'clockwise',
  lapRecord: { time: '1:31.447', driver: 'P. de la Rosa (McLaren)', year: 2005 },
  firstGrandPrix: 2004,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Da Curva 3 até a Curva 4', en: 'From Turn 3 into Turn 4' },
  ],
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
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Da Curva 16 até a Curva 17', en: 'From Turn 16 into Turn 17' },
  ],
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
  drsZones: [
    { pt: 'Reta dos boxes, entrando na Curva 1', en: 'Pit straight, into Turn 1' },
    { pt: 'Reta oposta, entrando no Muro dos Campeões', en: 'Back straight, into the Wall of Champions' },
  ],
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
  drsZones: [
    { pt: 'Reta dos boxes, entrando na Curva 1 (Sainte Dévote)', en: 'Pit straight, into Turn 1 (Sainte Dévote)' },
  ],
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
  raceDistanceKm: 307.362,
  laps: 66,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:15.743', driver: 'O. Piastri (McLaren)', year: 2025 },
  firstGrandPrix: 1991,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Da Curva 10 até a Curva 11', en: 'From Turn 10 into Turn 11' },
  ],
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
  raceDistanceKm: 307.146,
  laps: 71,
  corners: 10,
  direction: 'clockwise',
  lapRecord: { time: '1:07.924', driver: 'O. Piastri (McLaren)', year: 2025 },
  firstGrandPrix: 1970,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Da Curva 2 até a Curva 3', en: 'From Turn 2 into Turn 3' },
  ],
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
  raceDistanceKm: 306.670,
  laps: 70,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:16.627', driver: 'L. Hamilton (Mercedes)', year: 2020 },
  firstGrandPrix: 1986,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
  ],
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
  raceDistanceKm: 306.648,
  laps: 72,
  corners: 14,
  direction: 'clockwise',
  lapRecord: { time: '1:11.097', driver: 'L. Hamilton (Mercedes)', year: 2021 },
  firstGrandPrix: 1952,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1 (Tarzan)', en: 'Main straight, into Turn 1 (Tarzan)' },
  ],
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
  raceDistanceKm: 307.029,
  laps: 53,
  corners: 11,
  direction: 'clockwise',
  lapRecord: { time: '1:20.901', driver: 'L. Norris (McLaren)', year: 2025 },
  firstGrandPrix: 1950,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1 (Rettifilo)', en: 'Main straight, into Turn 1 (Rettifilo)' },
    { pt: 'Reta de Curva Grande, entrando na chicane della Roggia', en: 'Curva Grande straight, into the Roggia chicane' },
  ],
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

// Dados do Madring (Madrid Street Circuit), estreante no calendário em 2026 -- ainda sem
// corrida disputada, entao sem recorde de volta. Fonte: The Race, Motorsport.com.
const MADRID_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/madrid.png',
  lengthKm: 5.474,
  raceDistanceKm: 308.0,
  laps: 57,
  corners: 22,
  direction: 'clockwise',
  firstGrandPrix: 2026,
  drsZones: [
    { pt: 'Reta dos boxes, entrando na chicane das Curvas 1-2', en: 'Pit straight, into the Turn 1-2 chicane' },
  ],
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
    pt: 'Traçado inédito com uma curva banked (inclinada a 24°) de 500 metros batizada de "La Monumental", inspirada na Arena de Las Ventas e na curva de Zandvoort; sem histórico de corridas, a estratégia ideal de pneus ainda é uma incógnita para todas as equipes.',
    en: 'A brand-new layout featuring a 500-metre, 24-degree banked corner nicknamed "La Monumental", inspired by the Las Ventas bullring and Zandvoort\'s banked turn; with no race history, the ideal tyre strategy remains an unknown for every team.',
  },
};

// Dados reais do Baku City Circuit, usados só na página de teste do GP do Azerbaijão. Fonte: Wikipedia.
const AZERBAIJAN_CIRCUIT_INFO: CircuitInfo = {
  trackImage: '/circuits/azerbaijan.png',
  lengthKm: 6.003,
  raceDistanceKm: 306.153,
  laps: 51,
  corners: 20,
  direction: 'counterclockwise',
  lapRecord: { time: '1:43.009', driver: 'C. Leclerc (Ferrari)', year: 2019 },
  firstGrandPrix: 2016,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Reta ao lado do Mar Cáspio, entrando na Curva 16', en: 'Straight alongside the Caspian Sea, into Turn 16' },
  ],
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
  raceDistanceKm: 305.474,
  laps: 62,
  corners: 19,
  direction: 'counterclockwise',
  lapRecord: { time: '1:33.808', driver: 'L. Hamilton (Ferrari)', year: 2025 },
  firstGrandPrix: 2008,
  drsZones: [
    { pt: 'Reta dos boxes, entrando na Curva 1', en: 'Pit straight, into Turn 1' },
    { pt: 'Da Curva 5 até a Curva 7', en: 'From Turn 5 into Turn 7' },
  ],
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
  raceDistanceKm: 308.728,
  laps: 56,
  corners: 20,
  direction: 'counterclockwise',
  lapRecord: { time: '1:36.169', driver: 'C. Leclerc (Ferrari)', year: 2019 },
  firstGrandPrix: 2012,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 12', en: 'Main straight, into Turn 12' },
    { pt: 'Da Curva 11 até a Curva 12', en: 'From Turn 11 into Turn 12' },
  ],
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
  raceDistanceKm: 305.584,
  laps: 71,
  corners: 17,
  direction: 'clockwise',
  lapRecord: { time: '1:17.774', driver: 'V. Bottas (Mercedes)', year: 2021 },
  firstGrandPrix: 1963,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Reta oposta, entrando na Curva 4', en: 'Back straight, into Turn 4' },
  ],
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
  raceDistanceKm: 310.050,
  laps: 50,
  corners: 17,
  direction: 'counterclockwise',
  lapRecord: { time: '1:33.365', driver: 'M. Verstappen (Red Bull)', year: 2025 },
  firstGrandPrix: 2023,
  drsZones: [
    { pt: 'Reta da Las Vegas Boulevard, entrando na Curva 14', en: 'Las Vegas Boulevard straight, into Turn 14' },
    { pt: 'Reta dos boxes, entrando na Curva 1', en: 'Pit straight, into Turn 1' },
  ],
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
  raceDistanceKm: 308.883,
  laps: 57,
  corners: 16,
  direction: 'clockwise',
  lapRecord: { time: '1:22.384', driver: 'L. Norris (McLaren)', year: 2024 },
  firstGrandPrix: 2021,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
  ],
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
  raceDistanceKm: 306.298,
  laps: 58,
  corners: 16,
  direction: 'counterclockwise',
  lapRecord: { time: '1:25.637', driver: 'K. Magnussen (Haas)', year: 2024 },
  firstGrandPrix: 2009,
  drsZones: [
    { pt: 'Reta principal, entrando na Curva 1', en: 'Main straight, into Turn 1' },
    { pt: 'Da Curva 6 até a Curva 7', en: 'From Turn 6 into Turn 7' },
  ],
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

// Biografia real do Lando Norris, usada só na página de teste do piloto.
// Fonte: Wikipedia (verificado até a etapa da Hungria de 2026).
const NORRIS_BIO = {
  pt: 'Lando Norris estreou na Fórmula 1 pela McLaren em 2019. Depois de anos acumulando pódios, conquistou sua primeira vitória no GP de Miami de 2024 e, em 2025, fechou a temporada como Campeão Mundial de Pilotos. Até a etapa da Hungria de 2026, soma 12 vitórias e 47 pódios na carreira, seguindo como piloto principal da McLaren.',
  en: 'Lando Norris made his Formula 1 debut with McLaren in 2019. After years of accumulating podiums, he claimed his first win at the 2024 Miami Grand Prix and, in 2025, closed the season as World Drivers\' Champion. As of the 2026 Hungarian Grand Prix, he has 12 career wins and 47 podiums, and remains McLaren\'s lead driver.',
};

// Biografia real do Oscar Piastri, usada só na página de teste do piloto.
// Fonte: Wikipedia (verificado até o encerramento da temporada de 2025).
const PIASTRI_BIO = {
  pt: 'Oscar Piastri estreou na Fórmula 1 pela McLaren em 2023, depois de vencer a Fórmula 3 em 2020 e a Fórmula 2 em 2021. Subiu ao pódio já na temporada de estreia, no GP do Japão de 2023, e conquistou sua primeira vitória no GP da Hungria de 2024. Em 2025, com um grand chelem (pole, volta mais rápida e vitória) no GP da Holanda, encerrou o campeonato em 3º lugar com 9 vitórias e 28 pódios na carreira — recordes para um piloto australiano na Fórmula 1.',
  en: 'Oscar Piastri made his Formula 1 debut with McLaren in 2023, after winning the Formula 3 title in 2020 and the Formula 2 title in 2021. He reached the podium in his rookie season at the 2023 Japanese Grand Prix and took his first win at the 2024 Hungarian Grand Prix. In 2025, with a grand chelem (pole, fastest lap and victory) at the Dutch Grand Prix, he closed the championship 3rd with 9 career wins and 28 podiums — records for an Australian driver in Formula 1.',
};

// Biografias reais de toda a grid de F1 2026. Fonte: Wikipedia (verificado ate a
// etapa da Hungria de 2026, mesmo corte usado na bio do Norris).
const DRIVER_BIOS: Record<string, { pt: string; en: string }> = {
  'f1:norris': NORRIS_BIO,
  'f1:piastri': PIASTRI_BIO,
  'f1:verstappen': {
    pt: 'Max Verstappen estreou na Fórmula 1 pela Toro Rosso em 2015, aos 17 anos, e no ano seguinte, já na Red Bull, se tornou o vencedor mais jovem da história da categoria. Conquistou quatro títulos mundiais seguidos, entre 2021 e 2024. Até a etapa da Hungria de 2026, soma 71 vitórias, 131 pódios e 48 poles na carreira, seguindo como piloto principal da equipe.',
    en: 'Max Verstappen made his Formula 1 debut with Toro Rosso in 2015 at age 17, and the following year, by then with Red Bull, became the youngest race winner in the sport\'s history. He won four consecutive World Championships, from 2021 to 2024. As of the 2026 Hungarian Grand Prix, he has 71 career wins, 131 podiums and 48 poles, and remains the team\'s lead driver.',
  },
  'f1:hadjar': {
    pt: 'Isack Hadjar chegou à Fórmula 1 em 2025 pela Racing Bulls, após ser vice-campeão da Fórmula 2 em 2024, e conquistou seu primeiro pódio logo na temporada de estreia, no GP da Holanda. Promovido à Red Bull Racing para 2026, ao lado de Max Verstappen, teve um início de temporada de altos e baixos, incluindo um abandono por falha de motor em Melbourne mesmo largando em 3º. Até a etapa da Hungria de 2026, ocupa a 8ª posição no campeonato, com 68 pontos.',
    en: 'Isack Hadjar arrived in Formula 1 in 2025 with Racing Bulls, after finishing runner-up in the 2024 Formula 2 championship, and scored his first podium in his rookie season at the Dutch Grand Prix. Promoted to Red Bull Racing for 2026 alongside Max Verstappen, he has had an up-and-down start to the season, including an engine-failure retirement at Melbourne despite qualifying third. As of the 2026 Hungarian Grand Prix, he sits 8th in the championship with 68 points.',
  },
  'f1:leclerc': {
    pt: 'Charles Leclerc estreou na Fórmula 1 pela Sauber em 2018, sendo campeão da GP3 em 2016 e da Fórmula 2 em 2017 logo na temporada de estreia na categoria. Subiu para a Ferrari em 2019, onde se tornou o primeiro monegasco a vencer o GP de Mônaco em 93 anos, em 2024. Até a etapa da Hungria de 2026, soma 9 vitórias, 54 pódios e 27 poles na carreira — recorde de poles sem título mundial —, e ocupa a 5ª posição no campeonato ao lado de Lewis Hamilton, após vencer o GP da Grã-Bretanha.',
    en: 'Charles Leclerc made his Formula 1 debut with Sauber in 2018, having won the GP3 title in 2016 and the Formula 2 title in his rookie season in 2017. He moved up to Ferrari in 2019, where he became the first Monégasque driver to win the Monaco Grand Prix in 93 years, in 2024. As of the 2026 Hungarian Grand Prix, he has 9 career wins, 54 podiums and 27 poles — a record for most poles without a title — and sits 5th in the championship alongside Lewis Hamilton, after winning the British Grand Prix.',
  },
  'f1:hamilton': {
    pt: 'Lewis Hamilton estreou na Fórmula 1 pela McLaren em 2007 e conquistou sete títulos mundiais (2008, 2014, 2015, 2017, 2018, 2019 e 2020), o maior número da história da categoria. Somando 106 vitórias, 207 pódios e 104 poles na carreira, mudou-se para a Ferrari em 2025. Após um início difícil na nova equipe, voltou a subir ao pódio em 2026 na China, no Canadá e em Mônaco, e conquistou sua primeira vitória pela Ferrari na primeira edição do GP de Barcelona-Catalunya. Até a etapa da Hungria de 2026, terminou em 5º lugar na corrida mais recente após uma penalidade de cinco segundos por excesso de velocidade no pit lane.',
    en: 'Lewis Hamilton made his Formula 1 debut with McLaren in 2007 and won a record seven World Championships (2008, 2014, 2015, 2017, 2018, 2019 and 2020), the most in the sport\'s history. With 106 career wins, 207 podiums and 104 poles, he moved to Ferrari in 2025. After a difficult start with the new team, he returned to the podium in 2026 in China, Canada and Monaco, and claimed his first win for Ferrari at the inaugural Barcelona-Catalunya Grand Prix. As of the 2026 Hungarian Grand Prix, he finished 5th in the most recent race after a five-second penalty for speeding in the pit lane.',
  },
  'f1:russell': {
    pt: 'George Russell estreou na Fórmula 1 pela Williams em 2019, depois de ser campeão da GP3 e da Fórmula 2 em anos de estreia consecutivos (2017 e 2018). Subiu para a Mercedes em 2022 e venceu sua primeira corrida naquele mesmo ano, no GP de São Paulo. Em 2026, venceu a abertura da temporada, na Austrália, e assumiu a liderança do campeonato, mas passou a sofrer para acompanhar o companheiro Kimi Antonelli. Até a etapa da Hungria, soma 7 vitórias, 29 pódios e 11 poles na carreira, com uma segunda vitória na temporada conquistada na Áustria.',
    en: 'George Russell made his Formula 1 debut with Williams in 2019, after winning the GP3 and Formula 2 titles in consecutive rookie seasons (2017 and 2018). He moved up to Mercedes in 2022 and won his first race that same year, at the São Paulo Grand Prix. In 2026, he won the season-opening Australian Grand Prix and took the championship lead, but struggled to keep pace with teammate Kimi Antonelli as the season progressed. As of the Hungarian Grand Prix, he has 7 career wins, 29 podiums and 11 poles, with a second win of the season coming in Austria.',
  },
  'f1:antonelli': {
    pt: 'Kimi Antonelli chegou à Fórmula 1 em 2025 pela Mercedes, aos 18 anos, após conquistar títulos de kart, Fórmula 4 e Fórmula Regional ainda muito jovem. Em 2026, teve uma temporada de estreia completa avassaladora: tornou-se o mais jovem pole position da história na China, onde também venceu sua primeira corrida, e encadeou cinco vitórias seguidas a partir dali — a maior sequência já feita por um piloto logo após sua estreia como vencedor. Também cravou um grand chelem em Mônaco e assumiu a liderança do campeonato após o Japão, tornando-se o mais jovem líder da história. Apesar de problemas de motor em Barcelona e Silverstone, chega à etapa da Hungria de 2026 na liderança, com 6 vitórias, 12 pódios e 369 pontos.',
    en: 'Kimi Antonelli arrived in Formula 1 in 2025 with Mercedes at age 18, after winning karting, Formula 4 and Formula Regional titles at a young age. In 2026, he had a dominant first full season: he became the youngest pole-sitter in the sport\'s history in China, where he also won his first race, then reeled off five consecutive wins from there — the most ever by a driver right after their maiden win. He also scored a grand chelem in Monaco and took the championship lead after Japan, becoming the youngest leader in history. Despite engine failures in Barcelona and Silverstone, he arrives at the 2026 Hungarian Grand Prix leading the championship, with 6 wins, 12 podiums and 369 points.',
  },
  'f1:alonso': {
    pt: 'Fernando Alonso estreou na Fórmula 1 pela Minardi em 2001 e conquistou dois títulos mundiais consecutivos pela Renault, em 2005 e 2006, quando se tornou o campeão mais jovem da história até então, aos 24 anos. É o único piloto a vencer tanto o Mundial de Pilotos quanto o Mundial de Endurance da FIA, com duas vitórias nas 24 Horas de Le Mans (2018 e 2019). Somando 32 vitórias, 106 pódios e 22 poles — e um recorde de 436 largadas na carreira —, está na Aston Martin desde 2023. A temporada de 2026 tem sido difícil: o AMR26, motorizado pela Honda, sofre com falta de confiabilidade, e Alonso só pontuou pela primeira vez em Mônaco, terminando em 10º após penalidades de rivais.',
    en: 'Fernando Alonso made his Formula 1 debut with Minardi in 2001 and won two consecutive World Championships with Renault, in 2005 and 2006, becoming the youngest champion in the sport\'s history at the time, aged 24. He is the only driver to have won both the F1 World Championship and the FIA World Endurance Championship, with two 24 Hours of Le Mans wins (2018 and 2019). With 32 career wins, 106 podiums and 22 poles — and a record 436 career starts — he has driven for Aston Martin since 2023. The 2026 season has been difficult: the Honda-powered AMR26 has suffered from reliability issues, and Alonso only scored his first points of the year in Monaco, finishing 10th after penalties to other drivers.',
  },
  'f1:stroll': {
    pt: 'Lance Stroll estreou na Fórmula 1 pela Williams em 2017, ano em que se tornou o segundo piloto mais jovem a subir ao pódio na história da categoria, com o 3º lugar no GP do Azerbaijão. Antes disso, foi campeão da Fórmula 3 Europeia de 2016 de forma dominante. Soma 3 pódios e 1 pole position na carreira, e segue na Aston Martin, equipe pela qual compete desde 2019, com contrato válido até o fim de 2026.',
    en: 'Lance Stroll made his Formula 1 debut with Williams in 2017, the year he became the second-youngest driver to reach the podium in the sport\'s history, with a 3rd-place finish at the Azerbaijan Grand Prix. Before that, he dominated the 2016 European Formula 3 championship. He has 3 career podiums and 1 pole position, and continues to race for Aston Martin, the team he has driven for since 2019, under contract through the end of 2026.',
  },
  'f1:gasly': {
    pt: 'Pierre Gasly estreou na Fórmula 1 pela Toro Rosso em 2017, após ser campeão da Fórmula Renault Eurocup em 2013 e da GP2 em 2016. Em 2020, já pela AlphaTauri, venceu o GP da Itália e se tornou o primeiro piloto francês a vencer uma corrida desde Olivier Panis, em 1996. Está na Alpine desde 2023, somando 1 vitória e 6 pódios na carreira. Em 2026, chegou ao pódio no GP de Mônaco e ocupa a 10ª posição no campeonato, com 42 pontos até a etapa da Hungria.',
    en: 'Pierre Gasly made his Formula 1 debut with Toro Rosso in 2017, after winning the Formula Renault Eurocup title in 2013 and the GP2 title in 2016. In 2020, by then with AlphaTauri, he won the Italian Grand Prix and became the first French driver to win a race since Olivier Panis in 1996. He has driven for Alpine since 2023, with 1 career win and 6 podiums. In 2026, he reached the podium at the Monaco Grand Prix and sits 10th in the championship with 42 points as of the Hungarian Grand Prix.',
  },
  'f1:colapinto': {
    pt: 'Franco Colapinto estreou na Fórmula 1 em 2024 pela Williams, substituindo Logan Sargeant no meio da temporada, após passagens pela Fórmula 3 e Fórmula 2. Foi reserva da Alpine em 2025 e assumiu vaga de titular após o GP de Miami daquele ano. Sem vitórias ou pódios até agora, seu melhor resultado é o 6º lugar no GP do Canadá de 2026 — ano em que também chamou atenção com uma defesa elogiada pelo próprio George Russell como "a manobra do ano" na abertura da temporada, na Austrália.',
    en: 'Franco Colapinto made his Formula 1 debut in 2024 with Williams, replacing Logan Sargeant mid-season, after stints in Formula 3 and Formula 2. He was Alpine\'s reserve driver in 2025 and was promoted to a race seat after that year\'s Miami Grand Prix. Without a win or podium so far, his best result is 6th place at the 2026 Canadian Grand Prix — a season in which he also drew attention for a defensive move at the Australian season opener that George Russell himself called "the save of the season."',
  },
  'f1:ocon': {
    pt: 'Esteban Ocon estreou na Fórmula 1 pela Manor em 2016, depois de ser campeão da Fórmula 3 Europeia em 2014 e da GP3 em 2015 como parte do programa de jovens pilotos da Mercedes. Conquistou sua única vitória na carreira em 2021, no GP da Hungria, pela Alpine. Está na Haas desde 2025, ao lado de Oliver Bearman, somando 1 vitória e 4 pódios na carreira. Até a etapa da Hungria de 2026, ocupa a 17ª posição no campeonato, com 3 pontos.',
    en: 'Esteban Ocon made his Formula 1 debut with Manor in 2016, after winning the European Formula 3 title in 2014 and the GP3 title in 2015 as part of Mercedes\' young driver programme. He scored his only career win in 2021, at the Hungarian Grand Prix, driving for Alpine. He has been with Haas since 2025, alongside Oliver Bearman, with 1 career win and 4 podiums. As of the 2026 Hungarian Grand Prix, he sits 17th in the championship with 3 points.',
  },
  'f1:bearman': {
    pt: 'Oliver Bearman fez sua estreia na Fórmula 1 em 2024 no GP da Arábia Saudita, substituindo Carlos Sainz na Ferrari, e se tornou o piloto mais jovem da história da equipe — terminou em 7º e foi eleito o piloto do dia. Assumiu vaga fixa na Haas em 2025, ao lado de Esteban Ocon, com melhor resultado o 4º lugar no México daquele ano. Em 2026, soma 18 pontos, com destaque para o 7º lugar na Austrália e o 5º lugar na China, até a etapa da Hungria.',
    en: 'Oliver Bearman made his Formula 1 debut in 2024 at the Saudi Arabian Grand Prix, substituting for Carlos Sainz at Ferrari, becoming the youngest driver in the team\'s history — he finished 7th and was named Driver of the Day. He took a full-time seat with Haas in 2025, alongside Esteban Ocon, with a best finish of 4th in Mexico that year. In 2026, he has scored 18 points, highlighted by a 7th place in Australia and a 5th place in China, as of the Hungarian Grand Prix.',
  },
  'f1:lawson': {
    pt: 'Liam Lawson estreou na Fórmula 1 em 2023, no GP da Holanda, substituindo Daniel Ricciardo na então AlphaTauri, depois de ser vice-campeão da Super Fórmula japonesa naquele ano. Foi promovido à Red Bull Racing para 2025, mas voltou à Racing Bulls já após duas corridas. Sem vitórias ou pódios na carreira, teve como melhor resultado o 6º lugar no GP da Áustria de 2026, além de pontuar na China (sprint e corrida principal) e terminar em 9º no Japão.',
    en: 'Liam Lawson made his Formula 1 debut in 2023 at the Dutch Grand Prix, substituting for Daniel Ricciardo at what was then AlphaTauri, after finishing runner-up in Japan\'s Super Formula championship that year. He was promoted to Red Bull Racing for 2025 but was moved back to Racing Bulls after just two rounds. Without a career win or podium, his best result is a 6th place at the 2026 Austrian Grand Prix, on top of points finishes in China (sprint and main race) and a 9th place in Japan.',
  },
  'f1:lindblad': {
    pt: 'Arvid Lindblad é membro do programa de jovens pilotos da Red Bull desde 2021 e chegou à Fórmula 1 em 2026 pela Racing Bulls, aos 18 anos. Antes disso, quebrou recordes de precocidade: foi o vencedor mais jovem de uma corrida principal na história da Fórmula 3, em 2024, e o vencedor mais jovem da história da Fórmula 2, aos 17 anos e 254 dias, em 2025 — ano em que também foi campeão da Fórmula Regional da Oceania. Estreou classificando em 9º e pontuando em 8º, e teve o 7º lugar, em Mônaco e em Silverstone, como melhor resultado. Até a etapa da Hungria de 2026, soma 23 pontos na carreira.',
    en: 'Arvid Lindblad has been part of Red Bull\'s junior driver programme since 2021 and arrived in Formula 1 in 2026 with Racing Bulls, aged 18. Before that, he set precocious records: he became the youngest feature race winner in Formula 3 history in 2024, and the youngest race winner in Formula 2 history, at 17 years and 254 days, in 2025 — a year in which he also won the Formula Regional Oceania championship. He qualified 9th and scored points in 8th on his debut, and has taken 7th place, at Monaco and Silverstone, as his best result. As of the 2026 Hungarian Grand Prix, he has 23 career points.',
  },
  'f1:sainz': {
    pt: 'Carlos Sainz estreou na Fórmula 1 pela Toro Rosso em 2015, após ser campeão da Fórmula Renault 3.5 em 2014 como parte do programa de jovens da Red Bull. Correu pela Ferrari entre 2021 e 2024, no lugar de Sebastian Vettel, e está na Williams desde 2025. Soma 4 vitórias, 29 pódios e 6 poles na carreira. A temporada de 2026 com o novo FW48 tem sido difícil: só pontuou pela primeira vez na China, somando pontos em Miami e no Canadá, mas abandonou em Mônaco e na Áustria por problemas técnicos.',
    en: 'Carlos Sainz made his Formula 1 debut with Toro Rosso in 2015, after winning the Formula Renault 3.5 title in 2014 as part of Red Bull\'s young driver programme. He drove for Ferrari between 2021 and 2024, replacing Sebastian Vettel, and has been with Williams since 2025. He has 4 career wins, 29 podiums and 6 poles. The 2026 season with the new FW48 has been difficult: he only scored his first points in China, added more in Miami and Canada, but retired in Monaco and Austria with technical issues.',
  },
  'f1:albon': {
    pt: 'Alex Albon estreou na Fórmula 1 pela Toro Rosso em 2019 e foi promovido à Red Bull ainda naquela temporada, a partir do GP da Bélgica, conquistando seus primeiros pódios em 2020. Está na Williams desde 2022, quando substituiu George Russell. Soma 2 pódios na carreira, sem vitórias ou poles. Em 2026, chegou a 5 pontos até a etapa da Hungria, com destaque para o 10º lugar em Miami e o 8º em Mônaco.',
    en: 'Alex Albon made his Formula 1 debut with Toro Rosso in 2019 and was promoted to Red Bull that same season, from the Belgian Grand Prix onward, scoring his first podiums in 2020. He has been with Williams since 2022, when he replaced George Russell. He has 2 career podiums, without a win or pole. In 2026, he reached 5 points as of the Hungarian Grand Prix, highlighted by a 10th place in Miami and an 8th in Monaco.',
  },
  'f1:hulkenberg': {
    pt: 'Nico Hülkenberg estreou na Fórmula 1 pela Williams em 2010, depois de ser campeão da Fórmula 3 Euro Series em 2008 e da GP2 em 2009 — o terceiro campeão estreante da categoria, depois de Nico Rosberg e Lewis Hamilton. Detém o recorde de mais largadas na história sem vencer uma corrida (260) e só subiu ao primeiro pódio da carreira em 2025, no GP da Grã-Bretanha, depois de 239 corridas de espera — outro recorde. Segue na Audi, projeto que assumiu a antiga Sauber para 2026.',
    en: 'Nico Hülkenberg made his Formula 1 debut with Williams in 2010, after winning the European Formula 3 title in 2008 and the GP2 title in 2009 — the championship\'s third rookie champion, after Nico Rosberg and Lewis Hamilton. He holds the record for most career starts without a win (260) and only reached his first career podium in 2025, at the British Grand Prix, after 239 races of waiting — another record. He continues with Audi, the project that took over the former Sauber squad for 2026.',
  },
  'f1:bortoleto': {
    pt: 'Gabriel Bortoleto chegou à Fórmula 1 em 2025 pela Sauber, depois de conquistar os títulos de Fórmula 3 em 2023 e de Fórmula 2 em 2024 em sua temporada de estreia na categoria. Segue no projeto em 2026, agora sob a bandeira da Audi. Sem vitórias ou pódios na carreira, seu melhor resultado é o 6º lugar no GP da Hungria de 2025. Em 2026, somou pontos em corridas como a Austrália (9º) e a Grã-Bretanha (8º), ocupando a 14ª posição no campeonato com 10 pontos até a etapa da Hungria.',
    en: 'Gabriel Bortoleto arrived in Formula 1 in 2025 with Sauber, after winning the Formula 3 title in 2023 and the Formula 2 title in 2024 in his rookie season in that category. He continues with the project in 2026, now under the Audi banner. Without a career win or podium, his best result is a 6th place at the 2025 Hungarian Grand Prix. In 2026, he scored points in races such as Australia (9th) and Britain (8th), sitting 14th in the championship with 10 points as of the Hungarian Grand Prix.',
  },
  'f1:perez': {
    pt: 'Sergio Pérez estreou na Fórmula 1 pela Sauber em 2011. Correu pela Red Bull Racing entre 2021 e 2024, ao lado de Max Verstappen, período em que conquistou sua primeira pole no GP da Arábia Saudita de 2022 e terminou como vice-campeão mundial em 2023. Depois de uma temporada de 2024 sem vitórias, deixou a equipe por acordo mútuo. Soma 6 vitórias, 39 pódios e 3 poles na carreira, e estreou pela Cadillac em 2026, equipe estreante na categoria, com a qual luta na parte de trás do grid — melhor resultado até a etapa da Hungria é um 14º lugar.',
    en: 'Sergio Pérez made his Formula 1 debut with Sauber in 2011. He drove for Red Bull Racing between 2021 and 2024, alongside Max Verstappen, a period in which he took his maiden pole position at the 2022 Saudi Arabian Grand Prix and finished championship runner-up in 2023. After a winless 2024 season, he and the team parted ways by mutual agreement. He has 6 career wins, 39 podiums and 3 poles, and joined debutant team Cadillac for 2026, where he has been fighting near the back of the grid — his best result as of the Hungarian Grand Prix is a 14th place.',
  },
  'f1:bottas': {
    pt: 'Valtteri Bottas estreou na Fórmula 1 pela Williams em 2013. Foi companheiro de Lewis Hamilton na Mercedes entre 2017 e 2021, período em que terminou vice-campeão mundial duas vezes (2019 e 2020) e ajudou a equipe a conquistar cinco títulos de construtores seguidos. Depois, correu pela Alfa Romeo e, mais tarde, pela Sauber, entre 2022 e 2024. Soma 10 vitórias, 67 pódios e 20 poles na carreira, e estreou pela Cadillac em 2026 com o número 77 — assim como o companheiro Sérgio Pérez, ainda busca os primeiros pontos da equipe estreante, com melhor resultado um 13º lugar até a etapa da Hungria.',
    en: 'Valtteri Bottas made his Formula 1 debut with Williams in 2013. He was Lewis Hamilton\'s teammate at Mercedes between 2017 and 2021, finishing championship runner-up twice (2019 and 2020) and helping the team win five consecutive Constructors\' Championships. He later drove for Alfa Romeo and then Sauber, from 2022 to 2024. He has 10 career wins, 67 podiums and 20 poles, and joined debutant team Cadillac for 2026 with car number 77 — like teammate Sergio Pérez, he is still chasing the new team\'s first points, with a best finish of 13th as of the Hungarian Grand Prix.',
  },

  // WRC — biografias reais, fonte: WRC.com, Hyundai/Toyota/M-Sport press, DirtFish,
  // RACER, Motorsport.com (verificado ate a Rally da Estonia de 2026).
  'wrc:neuville': {
    pt: 'Thierry Neuville estreou no WRC em 2009 pelo programa de jovens da Peugeot e chegou à Hyundai em 2014, equipe pela qual corre desde então. Foi vice-campeão mundial um recorde de cinco vezes antes de finalmente conquistar seu primeiro título, em 2024 — o primeiro da história da Bélgica no WRC. Está em sua 13ª temporada seguida com a equipe coreana e, em 2026, ocupa a 7ª posição do campeonato até a Rally da Estônia, com 125 pontos.',
    en: 'Thierry Neuville made his WRC debut in 2009 through Peugeot\'s junior programme and joined Hyundai in 2014, the team he has driven for ever since. He finished championship runner-up a record five times before finally claiming his first title in 2024 — Belgium\'s first-ever in the WRC. He is in his 13th consecutive season with the Korean manufacturer and, in 2026, sits 7th in the championship as of Rally Estonia, with 125 points.',
  },
  'wrc:fourmaux': {
    pt: 'Adrien Fourmaux chegou ao WRC pelo programa jovem da M-Sport Ford, correndo pela equipe até ser contratado pela Hyundai para 2025 — temporada de estreia pela marca coreana em que somou quatro pódios. Segue no time em 2026, buscando a primeira vitória da carreira: chegou perto com o 2º lugar no Quênia e o 3º na Estônia, dez pódios no total, e ocupa a 6ª posição do campeonato com 129 pontos até a Rally da Estônia.',
    en: 'Adrien Fourmaux came up through Ford\'s M-Sport junior programme, racing for the team before signing with Hyundai for 2025 — a debut season with the Korean marque in which he scored four podiums. He continues with the team in 2026, still chasing his maiden win: he came close with 2nd place in Kenya and 3rd in Estonia, ten career podiums in total, and sits 6th in the championship with 129 points as of Rally Estonia.',
  },
  'wrc:lappi': {
    pt: 'Esapekka Lappi tem uma carreira longa no WRC, já tendo corrido por Citroën, Toyota, Ford e Hyundai, com títulos finlandês, europeu e de WRC2 na bagagem, além da vitória no Rally da Suécia de 2024. Em 2026, divide o terceiro carro da Hyundai com Dani Sordo e Hayden Paddon, revezando entradas ao longo da temporada. Capotou o carro no Rally da Finlândia, sua rodada de casa, mas terminou em 8º na Estônia em seu primeiro WRC desde o Quênia, em março.',
    en: 'Esapekka Lappi has had a long WRC career, having driven for Citroën, Toyota, Ford and Hyundai, with Finnish, European and WRC2 titles to his name, plus a Rally Sweden win in 2024. In 2026, he shares Hyundai\'s third car with Dani Sordo and Hayden Paddon, rotating entries across the season. He rolled his car at Rally Finland, his home round, but finished 8th at Rally Estonia on his first WRC start since Kenya in March.',
  },
  'wrc:sordo': {
    pt: 'Dani Sordo é um dos pilotos mais experientes do grid, com 19 temporadas de WRC e vínculo de longa data com a Hyundai, pela qual soma duas vitórias e 20 pódios na carreira, sem nunca ter disputado o título em programa integral. Em 2026, divide o terceiro carro da equipe com Esapekka Lappi e Hayden Paddon, e venceu o Campeonato de Rali de Portugal de 2025 ao lado do copiloto Carrera.',
    en: 'Dani Sordo is one of the grid\'s most experienced drivers, with 19 WRC seasons and a long-standing relationship with Hyundai, for whom he has two career wins and 20 podiums, without ever mounting a full-time title campaign. In 2026, he shares the team\'s third car with Esapekka Lappi and Hayden Paddon, and won the 2025 Portuguese Rally Championship alongside co-driver Carrera.',
  },
  'wrc:paddon': {
    pt: 'Hayden Paddon foi piloto oficial da Hyundai entre 2014 e 2018, período em que venceu o Rally da Argentina de 2016, e voltou a um carro Rally1 em 2026 após oito anos fora da elite, depois de conquistar o título do Campeonato Europeu de Rali (ERC) em 2025. Divide o terceiro carro da Hyundai com Dani Sordo e Esapekka Lappi, com papel voltado ao desenvolvimento e à coleta de dados da equipe.',
    en: 'Hayden Paddon was a Hyundai works driver between 2014 and 2018, a period in which he won the 2016 Rally Argentina, and returned to a Rally1 car in 2026 after eight years away from the top tier, having won the 2025 European Rally Championship (ERC) title. He shares Hyundai\'s third car with Dani Sordo and Esapekka Lappi, in a role geared toward development and data-gathering for the team.',
  },
  'wrc:ogier': {
    pt: 'Sébastien Ogier é o piloto mais vitorioso da história do WRC, com nove títulos mundiais — seis pela M-Sport/Volkswagen (2013 a 2018) e três pela Toyota (2020, 2021 e 2025) — e busca em 2026 se tornar o primeiro a chegar a dez. Roda em programa parcial, disputando cerca de 10 das etapas da temporada, mas segue extremamente competitivo: venceu 6 das 11 corridas que disputou em 2025. Até a Rally da Estônia de 2026, ocupa a 5ª posição do campeonato com 139 pontos, mesmo correndo menos etapas que os rivais.',
    en: 'Sébastien Ogier is the most successful driver in WRC history, with nine World Championships — six with M-Sport/Volkswagen (2013 to 2018) and three with Toyota (2020, 2021 and 2025) — and is chasing a record tenth title in 2026. He runs a part-time programme, contesting around 10 rounds of the season, but remains extremely competitive: he won 6 of the 11 rallies he entered in 2025. As of Rally Estonia 2026, he sits 5th in the championship with 139 points despite starting fewer rounds than his rivals.',
  },
  'wrc:pajari': {
    pt: 'Sami Pajari, finlandês de 24 anos, foi campeão da WRC2 em 2024 e ganhou vaga fixa na Toyota na temporada seguinte, sua primeira completa na elite. Em 2026, conquistou a primeira vitória da carreira no Rally da Estônia e repetiu o feito duas semanas depois, em casa, no Rally da Finlândia — sequência que o colocou entre os líderes do campeonato, com 171 pontos e cinco pódios nas últimas seis corridas.',
    en: 'Sami Pajari, a 24-year-old Finn, won the WRC2 title in 2024 and earned a full-time Toyota seat the following season, his first full year at the top level. In 2026, he claimed his maiden career win at Rally Estonia and repeated the feat two weeks later on home soil at Rally Finland — a run that put him among the championship leaders, with 171 points and five podiums in the last six rallies.',
  },
  'wrc:katsuta': {
    pt: 'Takamoto Katsuta é o primeiro piloto formado pelo programa de jovens da Toyota (TOYOTA GAZOO Racing WRC Challenge Program) e o primeiro piloto japonês a ter vaga fixa na elite do WRC na era moderna. Em 2026, na sua 94ª largada na categoria, conquistou a primeira vitória da carreira no Rally Safari do Quênia — tornando-se o primeiro japonês a vencer no mais alto nível do rali desde Kenjiro Shinozuka, em 1992 — e repetiu o resultado na Croácia, assumindo a liderança do campeonato. Chega à Rally da Estônia de 2026 na 3ª posição, com 160 pontos.',
    en: 'Takamoto Katsuta is the first graduate of Toyota\'s junior programme (the TOYOTA GAZOO Racing WRC Challenge Program) and the first Japanese driver to hold a full-time top-level WRC seat in the modern era. In 2026, on his 94th start in the category, he claimed his maiden career win at Safari Rally Kenya — becoming the first Japanese driver to win at the top level of rallying since Kenjiro Shinozuka in 1992 — and repeated the result in Croatia, taking the championship lead. He arrives at Rally Estonia 2026 in 3rd place, with 160 points.',
  },
  'wrc:evans': {
    pt: 'Elfyn Evans, galês, passou por uma temporada na WRC2 para se firmar antes de voltar à elite em 2017, ano em que venceu o Rally da Grã-Bretanha em casa. A mudança para a Toyota em 2020 o transformou em candidato permanente ao título, com vice-campeonatos em 2020, 2021, 2023 e 2024. Chega à Rally da Estônia de 2026 na liderança do campeonato, com 201 pontos, em busca do primeiro título da carreira.',
    en: 'Welshman Elfyn Evans spent a season in WRC2 to sharpen his skills before returning to the top tier in 2017, the year he won his home Rally GB. The move to Toyota in 2020 turned him into a perennial title contender, with runner-up finishes in 2020, 2021, 2023 and 2024. He arrives at Rally Estonia 2026 leading the championship, with 201 points, still chasing his first career title.',
  },
  'wrc:solberg': {
    pt: 'Oliver Solberg, filho do campeão mundial de 2003 Petter Solberg, foi campeão da WRC2 antes de assumir uma vaga fixa na Toyota para 2026, no lugar do bicampeão Kalle Rovanperä, que migrou para o automobilismo de circuito. Começou da melhor forma possível: venceu o Rallye Monte-Carlo logo em sua primeira corrida como titular, tornando-se o vencedor mais jovem da prova na era moderna. Chega à Rally da Estônia de 2026 na 4ª posição do campeonato, com 156 pontos.',
    en: 'Oliver Solberg, son of 2003 world champion Petter Solberg, won the WRC2 title before taking a full-time Toyota seat for 2026, replacing two-time champion Kalle Rovanperä, who moved into circuit racing. He couldn\'t have started better: he won the Monte-Carlo Rally on his very first outing as a full-time driver, becoming the event\'s youngest winner in the modern era. He arrives at Rally Estonia 2026 4th in the championship, with 156 points.',
  },
  'wrc:munster': {
    pt: 'Grégoire Munster, de Luxemburgo, é piloto da M-Sport Ford desde 2022, período em que se firmou como um dos pilotos regulares da equipe britânica na categoria Rally1, com melhores resultados girando em torno do top 5. Segue na equipe em 2026, formando a dupla titular ao lado de Josh McErlean.',
    en: 'Luxembourg\'s Grégoire Munster has driven for M-Sport Ford since 2022, establishing himself as one of the British team\'s regular Rally1 drivers, with best results typically around the top five. He continues with the team in 2026, forming the lead pairing alongside Josh McErlean.',
  },
  'wrc:mcerlean': {
    pt: 'Josh McErlean, norte-irlandês, subiu à Rally1 pela M-Sport Ford em 2025 vindo da WRC2, onde já havia mostrado velocidade de ponta, e causou boa impressão em sua temporada de estreia na elite. Segue na equipe em 2026, agora em sua segunda campanha completa na categoria principal, ocupando a 9ª posição do campeonato com 21 pontos até a Rally da Estônia.',
    en: 'Northern Ireland\'s Josh McErlean stepped up to Rally1 with M-Sport Ford in 2025 after showing frontrunning pace in WRC2, and made a strong impression in his rookie top-tier season. He continues with the team in 2026, now in his second full campaign in the premier category, sitting 9th in the championship with 21 points as of Rally Estonia.',
  },
  'wrc:armstrong': {
    pt: 'Jon Armstrong, norte-irlandês, é bicampeão vice do WRC Júnior e terminou em 2º lugar no Campeonato Europeu de Rali (ERC) de 2025, incluindo sua primeira vitória geral na temporada, ao lado do copiloto Shane Byrne. A boa campanha rendeu a promoção à M-Sport Ford para 2026, sua estreia na categoria Rally1.',
    en: 'Northern Ireland\'s Jon Armstrong is a two-time WRC Junior runner-up and finished 2nd in the 2025 European Rally Championship (ERC), including his first-ever overall win that season, alongside co-driver Shane Byrne. That strong campaign earned him a promotion to M-Sport Ford for 2026, his Rally1 category debut.',
  },
  'wrc:sesks': {
    pt: 'Mārtiņš Sesks, letão, é campeão da WRC2 de 2023 e vem construindo a carreira através do programa de jovens pilotos da FIA e de entradas pontuais em Rally1 pela M-Sport Ford. Segue como parte do programa de desenvolvimento da equipe em 2026, somando pontos em etapas selecionadas do calendário.',
    en: 'Latvia\'s Mārtiņš Sesks is the 2023 WRC2 champion and has built his career through the FIA\'s junior driver programme and selected Rally1 outings with M-Sport Ford. He continues as part of the team\'s development programme in 2026, scoring points in select rounds of the calendar.',
  },

  // F1 Academy — biografias reais, fonte: F1academy.com, F1.com, Mercedes/Aston
  // Martin, dive-bomb.com, Motorsport Week (verificado ate Silverstone de 2026).
  'f1-academy:felbermayr': {
    pt: 'Emma Felbermayr, austríaca, estreou na F1 Academy em 2025 pela Rodin Motorsport e fechou a temporada em 10º lugar, com a vitória na Corrida 2 de Montreal como ponto alto. Sua força é o giro único: um dos pilotos mais rápidos do grid na classificação. Em 2026, já converteu pole em vitória na Corrida de Grid Invertido em Silverstone e lidera a temporada.',
    en: 'Austria\'s Emma Felbermayr made her F1 Academy debut in 2025 with Rodin Motorsport and closed the season 10th, with a Race 2 win in Montreal as the highlight. Her strength is single-lap pace: one of the grid\'s fastest qualifiers. In 2026, she has already converted pole into a Reverse Grid Race win at Silverstone and leads the championship.',
  },
  'f1-academy:palmowski': {
    pt: 'Alisha Palmowski, britânica, foi duas vezes vice-campeã júnior da Daniel Ricciardo Series (2020 e 2021), depois disputou o Ginetta Junior Championship em 2023, com 10 pódios, e terminou vice-campeã da GB4 em 2024. Chamou atenção com uma wild card em Lusail em 2024 e, na temporada seguinte, venceu logo a corrida de abertura em Xangai. Em 2026, com apoio da Red Bull, já somou três vitórias, incluindo a Corrida Principal de Silverstone.',
    en: 'Britain\'s Alisha Palmowski was twice runner-up in the Daniel Ricciardo Series junior category (2020 and 2021), then contested the Ginetta Junior Championship in 2023, taking 10 podiums, and finished runner-up in GB4 in 2024. She caught attention with a wildcard outing in Lusail in 2024 and, the following season, won the season-opening race in Shanghai. In 2026, backed by Red Bull, she has already taken three wins, including the Silverstone Feature Race.',
  },
  'f1-academy:granada': {
    pt: 'Natalia Granada, espanhola, é uma das novidades da grid de 2026 da F1 Academy, correndo pela Prema Racing.',
    en: 'Spain\'s Natalia Granada is one of the new faces on the 2026 F1 Academy grid, racing for Prema Racing.',
  },
  'f1-academy:bruce': {
    pt: 'Megan Bruce, britânica, começou no automobilismo pela Caterham Academy, subiu para a GB4 em 2024 e ganhou experiência também na F4 Saudita antes de estrear na F1 Academy em 2025 pela Hitech. Segue na categoria em 2026, agora pela Campos Racing, com apoio da TAG Heuer.',
    en: 'Britain\'s Megan Bruce started out through the Caterham Academy, moved up to GB4 in 2024 and also gained experience in Saudi F4 before making her F1 Academy debut in 2025 with Hitech. She continues in the series in 2026, now with Campos Racing, backed by TAG Heuer.',
  },
  'f1-academy:ferreira': {
    pt: 'Rafaela Ferreira, brasileira, estreou na F1 Academy em 2025 longe de casa, com um 5º lugar na Corrida 1 de Xangai como melhor resultado da temporada, terminando em 12º no campeonato. No mesmo ano, venceu na Fórmula 4 brasileira durante o fim de semana do GP do Brasil. Segue com apoio da Racing Bulls em 2026, agora pela Campos Racing, em busca de resultados mais consistentes.',
    en: 'Brazil\'s Rafaela Ferreira made her F1 Academy debut in 2025 away from home, with a 5th place in Shanghai Race 1 as her best result of the season, finishing 12th in the championship. That same year, she won in Brazilian Formula 4 during the Brazilian Grand Prix weekend. She continues with Racing Bulls backing in 2026, now with Campos Racing, looking for more consistent results.',
  },
  'f1-academy:gademan': {
    pt: 'Nina Gademan começou a andar de kart aos cinco anos e, em 2020, venceu a Karting Slalom Cup nos FIA Motorsport Games. Estreou na F1 Academy como wild card em 2024, na etapa de casa em Zandvoort, tornando-se a primeira wild card da história da categoria a pontuar. Depois de uma boa primeira temporada completa em 2025, conquistou sua primeira vitória justamente em Zandvoort. Segue na MP Motorsport em 2026.',
    en: 'Nina Gademan first climbed into a go-kart aged five and, in 2020, won the Karting Slalom Cup at the FIA Motorsport Games. She made her F1 Academy debut as a wildcard in 2024, at her home round in Zandvoort, becoming the series\' first-ever wildcard to score points. After a strong first full season in 2025, she claimed her maiden win, fittingly, at Zandvoort. She continues with MP Motorsport in 2026.',
  },
  'f1-academy:larsen': {
    pt: 'Alba Larsen, dinamarquesa, se firmou como uma das pilotos mais regulares do grid, com sete resultados entre os cinco primeiros e o 7º lugar no campeonato de 2025 — incluindo dois 4º lugares, em Xangai e Las Vegas. Aos 17 anos, ainda não subiu ao pódio, mas segue pela MP Motorsport em 2026 com apoio da Ferrari, em busca do primeiro resultado de destaque.',
    en: 'Denmark\'s Alba Larsen has established herself as one of the grid\'s most consistent drivers, with seven top-five finishes and 7th place in the 2025 championship — including two 4th places, in Shanghai and Las Vegas. At 17, she has yet to reach the podium, but continues with MP Motorsport in 2026 backed by Ferrari, looking for her breakthrough result.',
  },
  'f1-academy:kosterman': {
    pt: 'Esmee Kosterman, holandesa, disputou etapas como wild card antes de assumir vaga fixa na F1 Academy em 2026, pela MP Motorsport. Correr em casa, em Zandvoort, é motivação extra para ganhar experiência ao longo do calendário.',
    en: 'The Netherlands\' Esmee Kosterman contested wildcard rounds before taking a full-time F1 Academy seat in 2026, with MP Motorsport. Racing on home soil at Zandvoort adds extra motivation as she builds experience across the calendar.',
  },
  'f1-academy:lloyd': {
    pt: 'Ella Lloyd, galesa, foi eleita a melhor estreante (Top Rookie) da F1 Academy em 2025, mostrando consistência e uma pilotagem destemida ao longo da temporada. Corre pela Rodin Motorsport com apoio da McLaren e é uma das favoritas ao título de 2026.',
    en: 'Wales\' Ella Lloyd was named F1 Academy\'s Top Rookie for 2025, showing consistency and fearless racecraft throughout the season. She drives for Rodin Motorsport backed by McLaren and is one of the favourites for the 2026 title.',
  },
  'f1-academy:stevens': {
    pt: 'Ella Stevens é uma nova integrante do programa de jovens da McLaren (McLaren Oxagon) e está fazendo sua estreia em monopostos na F1 Academy de 2026, depois de terminar em 1º no teste de estreantes de 2025. Corre pela Rodin Motorsport.',
    en: 'Ella Stevens is a new member of McLaren\'s junior programme (McLaren Oxagon) and is making her single-seater debut in the 2026 F1 Academy season, after topping the 2025 rookie test. She races for Rodin Motorsport.',
  },
  'f1-academy:billard': {
    pt: 'Lola Billard, francesa, corre pela ART Grand Prix com apoio da Gatorade na temporada de 2026 da F1 Academy.',
    en: 'France\'s Lola Billard races for ART Grand Prix backed by Gatorade in the 2026 F1 Academy season.',
  },
  'f1-academy:countryman': {
    pt: 'Kaylee Countryman, americana, foi contratada pela Haas para a temporada de 2026 e completou 16 anos no início daquele ano — uma das estreantes mais jovens do grid da F1 Academy, correndo pela ART Grand Prix.',
    en: 'America\'s Kaylee Countryman was signed by Haas for the 2026 season and turned 16 at the start of that year — one of the youngest rookies on the F1 Academy grid, racing for ART Grand Prix.',
  },
  'f1-academy:jacquet': {
    pt: 'Jade Jacquet, francesa, é uma das estreantes da F1 Academy em 2026, correndo pela ART Grand Prix com apoio da Williams.',
    en: 'France\'s Jade Jacquet is one of the rookies in the 2026 F1 Academy season, racing for ART Grand Prix backed by Williams.',
  },
  'f1-academy:dobson': {
    pt: 'Ava Dobson, americana, é uma das estreantes da temporada de 2026 da F1 Academy, correndo pela Hitech Pulse-Eight com apoio da American Express.',
    en: 'America\'s Ava Dobson is one of the rookies in the 2026 F1 Academy season, racing for Hitech Pulse-Eight backed by American Express.',
  },
  'f1-academy:robertson': {
    pt: 'Rachel Robertson, britânica, é uma das estreantes do grid de 2026 da F1 Academy, correndo pela Hitech Pulse-Eight.',
    en: 'Britain\'s Rachel Robertson is one of the rookies on the 2026 F1 Academy grid, racing for Hitech Pulse-Eight.',
  },
  'f1-academy:paatz': {
    pt: 'Mathilda Paatz, alemã, começou a competir em 2019 e subiu rapidamente pelas categorias nacionais e internacionais de kart antes de estrear na F4 em 2025. Fez sua estreia na F1 Academy como wild card em Montreal naquele ano, ligada à Aston Martin, e, aos 17 anos, assumiu vaga fixa na Prema Racing para 2026 depois de um bom desempenho no programa de avaliação da equipe.',
    en: 'Germany\'s Mathilda Paatz started competing in 2019 and quickly climbed through national and international karting ranks before making her F4 debut in 2025. She made her F1 Academy debut as a wildcard in Montreal that year, linked to Aston Martin, and, at 17, took a full-time seat with Prema Racing for 2026 after a strong showing in the team\'s evaluation programme.',
  },
  'f1-academy:westcott': {
    pt: 'Payton Westcott, californiana, começou no kart aos seis anos e se destacou no United States Pro Kart Series e no Challenge of the Americas, terminando em 3º. Em 2025, subiu aos monopostos, disputando a Formula Winter Series, a F4 Italiana e a E4 Championship, com vários pódios. É a primeira piloto formada pelo programa DISCOVER YOUR DRIVE da F1 Academy a conquistar vaga fixa na categoria, correndo pela Prema com apoio da Mercedes em 2026.',
    en: 'California\'s Payton Westcott began karting aged six and impressed in the United States Pro Kart Series and the Challenge of the Americas, finishing 3rd. In 2025, she moved up to single-seaters, contesting the Formula Winter Series, Italian F4 and the E4 Championship, with several podiums. She is the first driver from F1 Academy\'s DISCOVER YOUR DRIVE programme to earn a full-time seat in the series, racing for Prema with Mercedes backing in 2026.',
  },

  // DTM — biografias reais, fonte: DTM.com, Porsche/Lamborghini/BMW/Mercedes-AMG
  // newsroom, Motorsport.com, GT Report (verificado ate meados de 2026).
  'dtm:thiim': {
    pt: 'Nicki Thiim, dinamarquês, é piloto de fábrica da Aston Martin e um dos nomes mais decorados do WEC: venceu a classe LM GTE-Am nas 24 Horas de Le Mans de 2014 e foi campeão mundial de GT no WEC, somando 12 vitórias de classe, 21 pódios e 12 poles na categoria entre 2014 e 2020. Estreou na DTM em 2026 pela Comtoyou Racing, num Aston Martin Vantage GT3.',
    en: 'Denmark\'s Nicki Thiim is an Aston Martin factory driver and one of the most decorated names in WEC: he won the LM GTE-Am class at the 2014 24 Hours of Le Mans and was a WEC GT world champion, with 12 class wins, 21 podiums and 12 poles in the category between 2014 and 2020. He made his DTM debut in 2026 with Comtoyou Racing, in an Aston Martin Vantage GT3.',
  },
  'dtm:baert': {
    pt: 'Nicolas Baert, belga, corre pela Comtoyou Racing num Aston Martin Vantage GT3 Evo na temporada de 2026 da DTM, ao lado do companheiro Nicki Thiim.',
    en: 'Belgium\'s Nicolas Baert races for Comtoyou Racing in an Aston Martin Vantage GT3 Evo in the 2026 DTM season, alongside teammate Nicki Thiim.',
  },
  'dtm:vanderlinde': {
    pt: 'Kelvin van der Linde, sul-africano, é piloto de fábrica da Audi, múltiplo campeão da ADAC GT Masters e vencedor de provas de endurance como a Spa 24 Horas. É irmão de Sheldon van der Linde, campeão da DTM em 2022. Voltou à categoria em 2026 pela Schubert Motorsport, ao lado de Marco Wittmann, num BMW M4 GT3 Evo.',
    en: 'South Africa\'s Kelvin van der Linde is an Audi factory driver, a multiple ADAC GT Masters champion and an endurance race winner, including the Spa 24 Hours. He is the brother of Sheldon van der Linde, the 2022 DTM champion. He returned to the series in 2026 with Schubert Motorsport, alongside Marco Wittmann, in a BMW M4 GT3 Evo.',
  },
  'dtm:wittmann': {
    pt: 'Marco Wittmann é bicampeão da DTM (2014 e 2016) e um dos pilotos mais vitoriosos da história da categoria, com 18 vitórias na carreira, todas pela BMW. Segue na Schubert Motorsport em 2026, ao lado de Kelvin van der Linde, num BMW M4 GT3 Evo.',
    en: 'Marco Wittmann is a two-time DTM champion (2014 and 2016) and one of the series\' most successful drivers ever, with 18 career wins, all for BMW. He continues with Schubert Motorsport in 2026, alongside Kelvin van der Linde, in a BMW M4 GT3 Evo.',
  },
  'dtm:cairoli': {
    pt: 'Matteo Cairoli, italiano, foi campeão da Porsche Carrera Cup Itália em 2014, venceu as 24 Horas de Nürburgring em 2021 e cravou a pole das 24 Horas de Spa em 2023. Estreou na DTM em 2026 pela Emil Frey Racing, num Ferrari 296 GT3 Evo, e se tornou o primeiro piloto a vencer mais de uma corrida na temporada.',
    en: 'Italy\'s Matteo Cairoli won the Porsche Carrera Cup Italia title in 2014, took victory at the 24 Hours of Nürburgring in 2021 and set pole for the 2023 24 Hours of Spa. He made his DTM debut in 2026 with Emil Frey Racing, in a Ferrari 296 GT3 Evo, and became the first driver to win more than one race in the season.',
  },
  'dtm:vermeulen': {
    pt: 'Thierry Vermeulen, holandês, tem apoio do tetracampeão mundial de F1 Max Verstappen na carreira e corre pela Emil Frey Racing na DTM de 2026, num Ferrari 296 GT3 Evo, ao lado de Matteo Cairoli.',
    en: 'The Netherlands\' Thierry Vermeulen is backed by four-time F1 world champion Max Verstappen and races for Emil Frey Racing in the 2026 DTM season, in a Ferrari 296 GT3 Evo, alongside Matteo Cairoli.',
  },
  'dtm:maini': {
    pt: 'Arjun Maini, indiano, foi o primeiro piloto do país a vencer uma corrida na GP3, em Barcelona, correndo pela Jenzer Motorsport. Depois de anos nas categorias de acesso da Europa, migrou para os carros GT e chega à DTM de 2026 pela HRT Ford Racing. É irmão de Kush Maini, piloto da F2.',
    en: 'India\'s Arjun Maini became the first driver from his country to win a GP3 race, in Barcelona, racing for Jenzer Motorsport. After years in Europe\'s junior single-seater categories, he moved into GT racing and joins the 2026 DTM grid with HRT Ford Racing. He is the brother of F2 driver Kush Maini.',
  },
  'dtm:wiebelhaus': {
    pt: 'Finn Wiebelhaus, alemão de 20 anos, foi o primeiro vencedor do programa de acesso Road to DTM a conquistar vaga na categoria principal, com apoio da lenda Manuel Reuter. Chega à DTM de 2026 pela HRT Ford Racing depois de dois anos de experiência na ADAC GT Masters.',
    en: 'Germany\'s Finn Wiebelhaus, 20, is the first winner of the Road to DTM feeder programme to earn a seat in the main category, backed by DTM legend Manuel Reuter. He joins the 2026 DTM grid with HRT Ford Racing after two years of experience in ADAC GT Masters.',
  },
  'dtm:mapelli': {
    pt: 'Marco Mapelli, italiano, é piloto de fábrica da Lamborghini e participou diretamente do desenvolvimento do novo Lamborghini Temerario GT3. Estreou na DTM em 2026 pela ABT Sportsline, um dos quatro pilotos a debutar na categoria naquela temporada, trazendo experiência técnica valiosa para a equipe.',
    en: 'Italy\'s Marco Mapelli is a Lamborghini factory driver and was directly involved in developing the new Lamborghini Temerario GT3. He made his DTM debut in 2026 with ABT Sportsline, one of four drivers debuting in the category that season, bringing valuable technical insight to the team.',
  },
  'dtm:engstler': {
    pt: 'Luca Engstler, alemão, é piloto de fábrica da Lamborghini e já soma vários anos de experiência na DTM. Corre pela ABT Sportsline em 2026, ao lado de Marco Mapelli, num Lamborghini Temerario GT3.',
    en: 'Germany\'s Luca Engstler is a Lamborghini factory driver with several years of DTM experience already under his belt. He races for ABT Sportsline in 2026, alongside Marco Mapelli, in a Lamborghini Temerario GT3.',
  },
  'dtm:paul': {
    pt: 'Maximilian Paul, alemão, é piloto de fábrica da Lamborghini e deu à Grasser Racing Team sua primeira vitória na DTM em 2023, quando o programa da equipe foi reduzido a dois carros. Segue na GRT em 2026, ao lado de Mirko Bortolotti.',
    en: 'Germany\'s Maximilian Paul is a Lamborghini factory driver who delivered Grasser Racing Team\'s first DTM win in 2023, when the team\'s programme was scaled back to two cars. He continues with GRT in 2026, alongside Mirko Bortolotti.',
  },
  'dtm:bortolotti': {
    pt: 'Mirko Bortolotti, italiano, é campeão da DTM de 2024, título histórico que deu à Lamborghini sua primeira coroa de pilotos na categoria. Um dos GT3 mais decorados do mundo, com múltiplos títulos na GT World Challenge Europe, segue na Grasser Racing Team em 2026, buscando defender o título.',
    en: 'Italy\'s Mirko Bortolotti is the 2024 DTM champion, a historic title that gave Lamborghini its first drivers\' crown in the series. One of the most decorated GT3 drivers in the world, with multiple GT World Challenge Europe titles, he continues with Grasser Racing Team in 2026, looking to defend his title.',
  },
  'dtm:auer': {
    pt: 'Lucas Auer, austríaco e sobrinho do ex-piloto de F1 Gerhard Berger, passou pelo programa de jovens da Mercedes antes de se firmar no automobilismo de GT. Foi vice-campeão da DTM em 2022 e segue na Mercedes-AMG Team Landgraf em 2026.',
    en: 'Austria\'s Lucas Auer, nephew of former F1 driver Gerhard Berger, came through Mercedes\' junior programme before establishing himself in GT racing. He was DTM runner-up in 2022 and continues with Mercedes-AMG Team Landgraf in 2026.',
  },
  'dtm:kalender': {
    pt: 'Tom Kalender, alemão, é o piloto mais jovem do grid da DTM de 2026, com apenas 18 anos, e chega à categoria como campeão da ADAC GT Masters de 2024. Divide a Mercedes-AMG Team Landgraf com o vice-campeão de 2022, Lucas Auer.',
    en: 'Germany\'s Tom Kalender is the youngest driver on the 2026 DTM grid, at just 18, and arrives in the category as the 2024 ADAC GT Masters champion. He shares Mercedes-AMG Team Landgraf with 2022 runner-up Lucas Auer.',
  },
  'dtm:gounon': {
    pt: 'Jules Gounon, francês, é um dos pilotos de GT3 mais vitoriosos em provas de endurance: venceu as 24 Horas de Spa em 2017 e 2022, as 12 Horas de Bathurst em 2020, 2022 e 2023, e as 24 Horas de Daytona (categoria GTD Pro) em 2023. Corre pela Winward Racing na DTM de 2026, num Mercedes-AMG.',
    en: 'France\'s Jules Gounon is one of the most successful GT3 drivers in endurance racing: he won the 24 Hours of Spa in 2017 and 2022, the Bathurst 12 Hour in 2020, 2022 and 2023, and the 24 Hours of Daytona (GTD Pro class) in 2023. He races for Winward Racing in the 2026 DTM season, in a Mercedes-AMG.',
  },
  'dtm:engel': {
    pt: 'Maro Engel, alemão, é piloto de fábrica da Mercedes-AMG com diversas vitórias na DTM ao longo da carreira, incluindo triunfos em Zandvoort e no Red Bull Ring em 2026. Corre pela Winward Racing, cravando também a primeira pole position da equipe na temporada.',
    en: 'Germany\'s Maro Engel is a Mercedes-AMG factory driver with several DTM wins across his career, including victories at Zandvoort and the Red Bull Ring in 2026. He races for Winward Racing, also setting the team\'s first pole position of the season.',
  },
  'dtm:glock': {
    pt: 'Timo Glock, alemão, correu na Fórmula 1 pela Jordan, Toyota e Marussia entre 2004 e 2013, com um 2º lugar no GP de Cingapura de 2008 como melhor resultado. Depois de anos como comentarista e, mais tarde, dono de equipe, voltou aos carros como piloto na DTM em 2025, agora pela Dörr Motorsport, e segue na categoria em 2026 aos 44 anos, o piloto mais velho do grid.',
    en: 'Germany\'s Timo Glock raced in Formula 1 for Jordan, Toyota and Marussia between 2004 and 2013, with a 2nd place at the 2008 Singapore Grand Prix as his best result. After years as a broadcaster and, later, a team owner, he returned to the cockpit as a DTM driver in 2025, now with Dörr Motorsport, and continues in the category in 2026 at age 44, the oldest driver on the grid.',
  },
  'dtm:dorr-ben': {
    pt: 'Ben Dörr, alemão, é filho do dono da equipe, Rainer Dörr, e corre pela Dörr Motorsport desde que a estrutura estreou na DTM. Em sua terceira temporada na categoria, já cravou a primeira pole position de um McLaren no Nürburgring e subiu ao pódio no Sachsenring.',
    en: 'Germany\'s Ben Dörr is the son of team owner Rainer Dörr and has raced for Dörr Motorsport since the outfit\'s DTM debut. In his third season in the category, he has already set the first-ever McLaren pole position at the Nürburgring and reached the podium at the Sachsenring.',
  },
  'dtm:buus': {
    pt: 'Bastian Buus, dinamarquês, é piloto contratado da Porsche e estreou na DTM em 2026 pela Land-Motorsport, equipe que retornou à categoria trocando a Audi pela Porsche e sucedendo Ricardo Feller. Já impressionou nos testes de pré-temporada, com o segundo tempo mais rápido do grid.',
    en: 'Denmark\'s Bastian Buus is a Porsche contracted driver and made his DTM debut in 2026 with Land-Motorsport, the team that returned to the category by switching from Audi to Porsche and succeeding Ricardo Feller. He already impressed in pre-season testing, setting the second-fastest time on the grid.',
  },
  'dtm:feller': {
    pt: 'Ricardo Feller, suíço, construiu a carreira como piloto de fábrica da Audi em GT3, com passagens de destaque pela DTM e pela ADAC GT Masters, antes de assinar com a Porsche para 2026. Chega à Manthey Racing como companheiro do campeão da categoria em 2023, Thomas Preining.',
    en: 'Switzerland\'s Ricardo Feller built his career as an Audi factory driver in GT3, with standout stints in DTM and ADAC GT Masters, before signing with Porsche for 2026. He joins Manthey Racing alongside 2023 series champion Thomas Preining.',
  },
  'dtm:preining': {
    pt: 'Thomas Preining, austríaco, é piloto de fábrica da Porsche e campeão da DTM de 2023, o primeiro título da marca alemã na era moderna da categoria. Natural de Linz, segue na Manthey Racing em 2026, já com uma vitória na abertura da temporada e outra no meio do ano.',
    en: 'Austria\'s Thomas Preining is a Porsche factory driver and the 2023 DTM champion, the German brand\'s first title in the modern era of the series. Born in Linz, he continues with Manthey Racing in 2026, already with a season-opening win and another mid-season victory.',
  },

  // F2 — biografias reais, fonte: FIA Formula 2 (fiaformula2.com), Formula Scout,
  // The Race, Trident/Rodin/Prema/DAMS releases (verificado ate meados de 2026).
  'f2:camara': {
    pt: 'Rafael Câmara, brasileiro, é campeão da Fórmula 3 e subiu à F2 em 2026 pela Invicta Racing, sendo apontado como um dos principais candidatos a uma vaga futura na Fórmula 1 saindo desta geração da categoria.',
    en: 'Brazil\'s Rafael Câmara is the Formula 3 champion and stepped up to F2 in 2026 with Invicta Racing, seen as one of the leading candidates for a future Formula 1 seat coming out of this generation of the category.',
  },
  'f2:durksen': {
    pt: 'Joshua Dürksen, paraguaio, é piloto de desenvolvimento da Mercedes na Fórmula 1 e venceu a Corrida Sprint de Melbourne em sua temporada de estreia na F2, em 2026, pela Invicta Racing.',
    en: 'Paraguay\'s Joshua Dürksen is a Mercedes Formula 1 development driver and won the Melbourne Sprint Race in his rookie F2 season, in 2026, with Invicta Racing.',
  },
  'f2:miyata': {
    pt: 'Ritomo Miyata, japonês de 26 anos, venceu os títulos da Super Formula e da Super GT japonesas na mesma temporada de 2023, além de ter sido campeão da F4 Japonesa (2016 e 2017) e da Super Formula Lights (2020). Estreou na F2 em 2024 pela Rodin Motorsport e segue na categoria em 2026 pela Hitech TGR.',
    en: 'Japan\'s Ritomo Miyata, 26, won both the Japanese Super Formula and Super GT titles in the same 2023 season, on top of Japanese F4 titles (2016 and 2017) and a Super Formula Lights title (2020). He made his F2 debut in 2024 with Rodin Motorsport and continues in the category in 2026 with Hitech TGR.',
  },
  'f2:herta': {
    pt: 'Colton Herta, americano de 25 anos, é uma das principais estrelas da IndyCar e decidiu disputar a F2 europeia em 2026 para reunir os pontos de Super Licença que faltam para um assento na Fórmula 1, correndo pela Hitech TGR enquanto também atua como piloto de testes da Cadillac na F1.',
    en: 'America\'s Colton Herta, 25, is one of IndyCar\'s leading stars and chose to contest European F2 in 2026 to gather the remaining Super Licence points needed for a Formula 1 seat, racing for Hitech TGR while also serving as Cadillac\'s F1 test driver.',
  },
  'f2:leon-f2': {
    pt: 'Noel León, mexicano, corre pela Campos Racing na F2 de 2026 e chegou a terminar em 2º lugar na Corrida Sprint de Melbourne.',
    en: 'Mexico\'s Noel León races for Campos Racing in the 2026 F2 season and has already finished 2nd in the Melbourne Sprint Race.',
  },
  'f2:tsolov-f2': {
    pt: 'Nikola Tsolov, búlgaro, é o único piloto do programa de jovens da Red Bull na F2 de 2026, correndo pela Campos Racing.',
    en: 'Bulgaria\'s Nikola Tsolov is the sole Red Bull junior driver in the 2026 F2 season, racing for Campos Racing.',
  },
  'f2:beganovic': {
    pt: 'Dino Beganovic, sueco de 22 anos, estreou na F2 nas duas últimas etapas de uma temporada, já conquistando um pódio, e disputa em 2026 sua primeira campanha completa na categoria, agora pela DAMS Lucas Oil depois de deixar a Hitech.',
    en: 'Sweden\'s Dino Beganovic, 22, made his F2 debut in the last two rounds of a season, already scoring a podium, and contests his first full campaign in the category in 2026, now with DAMS Lucas Oil after leaving Hitech.',
  },
  'f2:bilinski': {
    pt: 'Roman Bilinski, polonês-britânico, subiu à F2 em 2026 vindo da Fórmula 3, onde terminou em 11º em sua temporada de estreia pela Rodin Motorsport, com um pódio logo na abertura, outro em Mônaco e vitória na sprint de Monza. Antes disso, disputou três temporadas da Fórmula Regional Europeia pela Trident e foi campeão da Fórmula Regional da Oceania em 2024. Corre pela DAMS Lucas Oil.',
    en: 'Anglo-Polish driver Roman Bilinski stepped up to F2 in 2026 from Formula 3, where he finished 11th in his rookie season with Rodin Motorsport, with a podium straight out of the gate, another in Monaco and a sprint win at Monza. Before that, he spent three seasons in Formula Regional European with Trident and was the 2024 Formula Regional Oceania champion. He races for DAMS Lucas Oil.',
  },
  'f2:mini': {
    pt: 'Gabriele Minì, italiano de 20 anos, terminou em 2º lugar na Fórmula 3 de 2024, depois de ter sido 3º no GP de Macau e 7º na F3 em 2023. Fez sua primeira temporada de F2 em 2024, terminando em 27º, e segue pela MP Motorsport em 2026, buscando evolução.',
    en: 'Italy\'s Gabriele Minì, 20, finished 2nd in the 2024 Formula 3 championship, after finishing 3rd at the Macau Grand Prix and 7th in F3 in 2023. He had his first F2 season in 2024, finishing 27th, and continues with MP Motorsport in 2026, looking to build on that.',
  },
  'f2:goethe': {
    pt: 'Oliver Goethe, alemão de 21 anos, vem evoluindo ano após ano na F2 e mostrou progresso constante ao longo da temporada de 2025 pela MP Motorsport, equipe pela qual segue em 2026.',
    en: 'Germany\'s Oliver Goethe, 21, has been improving year after year in F2 and showed steady progress throughout the 2025 season with MP Motorsport, the team he continues with in 2026.',
  },
  'f2:montoya': {
    pt: 'Sebastián Montoya, colombiano, é filho do ex-piloto de F1 e duas vezes vencedor das 500 Milhas de Indianápolis Juan Pablo Montoya. Subiu à F2 em tempo integral em 2026 vindo da Fórmula 3, correndo pela Prema Racing.',
    en: 'Colombia\'s Sebastián Montoya is the son of former F1 driver and two-time Indianapolis 500 winner Juan Pablo Montoya. He stepped up to F2 full-time in 2026 from Formula 3, racing for Prema Racing.',
  },
  'f2:boya': {
    pt: 'Mari Boya, espanhol, brigou pelo título da Fórmula 3 em 2025, com cinco pódios — incluindo vitória na Corrida Principal de Silverstone — e terminou em 3º no campeonato, além de 2º no GP de Macau daquele ano. Subiu à F2 em 2026 pela Prema Racing, com apoio da Aston Martin.',
    en: 'Spain\'s Mari Boya fought for the Formula 3 title in 2025, with five podiums — including a Feature Race win at Silverstone — and finished 3rd in the championship, plus 2nd at that year\'s Macau Grand Prix. He stepped up to F2 in 2026 with Prema Racing, backed by Aston Martin.',
  },
  'f2:stenshorne-f2': {
    pt: 'Martinius Stenshorne, norueguês, fez sua estreia na F2 em Baku qualificando entre os 10 primeiros e brigando por bons resultados nas duas corridas. Na Fórmula 3 de 2025, venceu duas corridas e somou mais três segundos lugares, terminando em 5º no campeonato. Corre pela Rodin Motorsport em 2026, ao lado de Alex Dunne.',
    en: 'Norway\'s Martinius Stenshorne made his F2 debut in Baku, qualifying inside the top 10 and fighting for strong results in both races. In the 2025 Formula 3 season, he won two races and added three more runner-up finishes, ending 5th in the championship. He races for Rodin Motorsport in 2026, alongside Alex Dunne.',
  },
  'f2:dunne-f2': {
    pt: 'Alex Dunne, irlandês, foi vice-campeão da Fórmula 3, uma das campanhas mais fortes da categoria em anos recentes, e passou pelo programa de jovens da McLaren antes de migrar para o da Alpine. Corre pela Rodin Motorsport na F2 de 2026.',
    en: 'Ireland\'s Alex Dunne was Formula 3 runner-up, one of the category\'s strongest campaigns in recent years, and came through McLaren\'s junior programme before moving to Alpine\'s. He races for Rodin Motorsport in the 2026 F2 season.',
  },
  'f2:maini': {
    pt: 'Kush Maini, indiano, é o único representante do país tanto na F2 quanto na F3 e está ligado à academia de jovens da Alpine desde 2023. Seguiu os passos do irmão mais velho, Arjun Maini (hoje na DTM), estreando nos monopostos em 2016 na F4 Italiana. Disputou a GB3 em 2018 e 2020 (3º e 2º lugares) e a Fórmula 3 em 2022 pela MP Motorsport, terminando em 14º com um pódio. Corre pela ART Grand Prix na F2.',
    en: 'India\'s Kush Maini is the country\'s sole representative in both F2 and F3, and has been with Alpine\'s junior academy since 2023. He followed in the footsteps of older brother Arjun Maini (now in DTM), making his single-seater debut in 2016 in Italian F4. He contested GB3 in 2018 and 2020 (3rd and 2nd) and Formula 3 in 2022 with MP Motorsport, finishing 14th with one podium. He races for ART Grand Prix in F2.',
  },
  'f2:inthraphuvasak-f2': {
    pt: 'Tasanapol Inthraphuvasak, tailandês, subiu à F2 em 2026 vindo da Fórmula 3, categoria em que terminou em 7º no campeonato com três vitórias e mais dois top 5. Corre pela ART Grand Prix.',
    en: 'Thailand\'s Tasanapol Inthraphuvasak stepped up to F2 in 2026 from Formula 3, where he finished 7th in the championship with three wins and two more top-five finishes. He races for ART Grand Prix.',
  },
  'f2:fittipaldi-jr': {
    pt: 'Emerson Fittipaldi Jr., brasileiro, é neto do bicampeão mundial de Fórmula 1 Emerson Fittipaldi. Chegou à F2 em 2026 vindo da Eurocup-3, correndo pela AIX Racing.',
    en: 'Brazil\'s Emerson Fittipaldi Jr. is the grandson of two-time Formula 1 world champion Emerson Fittipaldi. He arrived in F2 in 2026 coming from Eurocup-3, racing for AIX Racing.',
  },
  'f2:shields': {
    pt: 'Cian Shields, escocês-irlandês, chegou à AIX Racing nas duas últimas etapas de 2024, vindo da Fórmula 3 pela Hitech, e está em sua segunda temporada completa de F2 em 2026. Antes, terminou vice-campeão da Euroformula Open de 2023, com quatro vitórias.',
    en: 'Scottish-Irish driver Cian Shields joined AIX Racing for the final two rounds of 2024, coming from Formula 3 with Hitech, and is in his second full F2 season in 2026. Before that, he finished runner-up in the 2023 Euroformula Open, with four wins.',
  },
  'f2:varrone': {
    pt: 'Nico Varrone, argentino, corre pela Van Amersfoort Racing na F2 de 2026.',
    en: 'Argentina\'s Nico Varrone races for Van Amersfoort Racing in the 2026 F2 season.',
  },
  'f2:villagomez': {
    pt: 'Rafael Villagómez, mexicano, garantiu a última vaga disponível na Van Amersfoort Racing para 2026, correndo ao lado de Nico Varrone.',
    en: 'Mexico\'s Rafael Villagómez secured the last available seat at Van Amersfoort Racing for 2026, racing alongside Nico Varrone.',
  },
  'f2:vanhoepen': {
    pt: 'Laurens van Hoepen, holandês, correu parte da temporada de 2025 de F2 pela Trident, nas etapas de Baku, Lusail e Abu Dhabi, ganhando experiência antes da promoção a tempo integral em 2026. Na Fórmula 3, somou cinco pódios e uma pole em sua segunda temporada. Já em 2026, cravou sua primeira pole na F2 em Montreal.',
    en: 'The Netherlands\' Laurens van Hoepen raced part of the 2025 F2 season with Trident, in the Baku, Lusail and Abu Dhabi rounds, gaining experience ahead of his full-time promotion in 2026. In Formula 3, he collected five podiums and a pole in his second season. Already in 2026, he claimed his maiden F2 pole in Montreal.',
  },
  'f2:bennett': {
    pt: 'John Bennett, britânico, corre pela Trident na F2 de 2026.',
    en: 'Britain\'s John Bennett races for Trident in the 2026 F2 season.',
  },

  // F3 — biografias reais, fonte: FIA Formula 3 (fiaformula3.com), Formula Scout,
  // Pit Debrief, F1.com (verificado ate meados de 2026).
  'f3:theophile-nael': {
    pt: 'Théophile Naël, francês, está em sua segunda temporada de F3 em 2026, agora pela Campos Racing depois de estrear em 2025 pela Van Amersfoort Racing, ano em que terminou em 8º lugar com três pódios na Feature Race (Melbourne, Barcelona e Silverstone). Em 2026, já venceu a Sprint de Budapeste saindo do 6º lugar no grid.',
    en: 'France\'s Théophile Naël is in his second F3 season in 2026, now with Campos Racing after making his debut in 2025 with Van Amersfoort Racing, a year in which he finished 8th with three Feature Race podiums (Melbourne, Barcelona and Silverstone). In 2026, he has already won the Budapest Sprint Race from 6th on the grid.',
  },
  'f3:ugochukwu': {
    pt: 'Ugo Ugochukwu, americano, é piloto do programa de desenvolvimento da McLaren e está em sua segunda temporada de F3 em 2026 pela Campos Racing, depois de terminar em 16º em 2025 com dois pódios seguidos de Sprint, em Spa e Budapeste.',
    en: 'America\'s Ugo Ugochukwu is a McLaren Driver Development programme driver and is in his second F3 season in 2026 with Campos Racing, after finishing 16th in 2025 with back-to-back Sprint Race podiums, at Spa and Budapest.',
  },
  'f3:rivera-f3': {
    pt: 'Ernesto Rivera, mexicano, corre pela Campos Racing na F3 de 2026 e já se destacou como uma referência de ritmo nos treinos livres da etapa da Grã-Bretanha, em Silverstone.',
    en: 'Mexico\'s Ernesto Rivera races for Campos Racing in the 2026 F3 season and has already stood out as a pace benchmark in free practice at the British round in Silverstone.',
  },
  'f3:stromsted': {
    pt: 'Noah Strømsted, dinamarquês, está em sua segunda temporada de F3 em 2026 pela Trident, depois de terminar em 6º lugar em 2025. Chega vindo de uma boa campanha na Fórmula Regional da Oceania, em que terminou em 2º.',
    en: 'Denmark\'s Noah Strømsted is in his second F3 season in 2026 with Trident, after finishing 6th in 2025. He arrives off the back of a strong Formula Regional Oceania campaign, in which he finished 2nd.',
  },
  'f3:slater-f3': {
    pt: 'Freddie Slater, britânico de 17 anos, é piloto júnior da Audi desde janeiro de 2026 e venceu o título da Fórmula Regional Europeia de 2025 com folga, somando oito vitórias. No mesmo ano, também venceu três vezes na GB3, faturou a corrida de qualificação para o GP de Macau e começou 2026 com uma sequência vitoriosa que o levou ao vice-campeonato da Fórmula Regional da Oceania. Corre pela Trident na F3.',
    en: 'Britain\'s Freddie Slater, 17, has been an Audi junior driver since January 2026 and comfortably won the 2025 Formula Regional European title, with eight wins. That same year, he also won three times in GB3, took the Macau Grand Prix qualifying race and began 2026 with a winning run that took him to the Formula Regional Oceania runner-up spot. He races for Trident in F3.',
  },
  'f3:depalo-f3': {
    pt: 'Matteo De Palo, italiano, garantiu vaga no programa de desenvolvimento da McLaren por ser o principal rival de Freddie Slater na Fórmula Regional Europeia de 2025, temporada em que venceu quatro corridas, subiu ao pódio outras sete vezes e cravou três poles. Corre pela Trident na F3 de 2026.',
    en: 'Italy\'s Matteo De Palo earned a place in the McLaren Driver Development Programme by being Freddie Slater\'s closest rival in the 2025 Formula Regional European Championship, a season in which he won four races, added seven more podiums and took three poles. He races for Trident in the 2026 F3 season.',
  },
  'f3:colnaghi-f3': {
    pt: 'Mattia Colnaghi, ítalo-argentino, é piloto do programa de jovens da Red Bull. Foi campeão da Fórmula 4 Espanhola em 2024 e da Eurocup-3 em 2025, título que o credenciou à MP Motorsport na F3 de 2026.',
    en: 'Italian-Argentine Mattia Colnaghi is a Red Bull junior driver. He won the Spanish Formula 4 title in 2024 and the Eurocup-3 title in 2025, an achievement that earned him a seat with MP Motorsport in the 2026 F3 season.',
  },
  'f3:taponen-f3': {
    pt: 'Tuukka Taponen, finlandês de 18 anos, foi campeão mundial de kart na categoria OK sênior em 2021, vice-campeão da F4 dos Emirados em 2023 e campeão da Fórmula Regional do Oriente Médio em 2024, ano em que também terminou em 3º na Fórmula Regional Europeia. Como piloto da academia da Ferrari, teve uma boa temporada de estreia na F3 em 2025, com três pódios e o 9º lugar no campeonato, e cravou sua primeira pole em 2026, na Hungria. Corre pela MP Motorsport.',
    en: 'Finland\'s Tuukka Taponen, 18, was karting world champion in the senior OK category in 2021, runner-up in the 2023 UAE F4 championship and Formula Regional Middle East champion in 2024, a year in which he also finished 3rd in Formula Regional European. As a Ferrari Driver Academy member, he had a strong F3 rookie season in 2025, with three podiums and 9th in the championship, and took his maiden pole in 2026, in Hungary. He races for MP Motorsport.',
  },
  'f3:giusti-f3': {
    pt: 'Alessandro Giusti, francês, integra a academia de jovens da Williams desde janeiro de 2024. Venceu o título da F4 Francesa em sua segunda temporada, em 2022, e somou cinco vitórias em duas temporadas de Fórmula Regional Europeia antes de ter uma boa temporada de estreia na F3. Corre pela MP Motorsport em 2026.',
    en: 'France\'s Alessandro Giusti has been part of Williams\' junior academy since January 2024. He won the French F4 title in his second season, in 2022, and collected five wins across two Formula Regional European seasons before a strong F3 rookie campaign. He races for MP Motorsport in 2026.',
  },
  'f3:kato-f3': {
    pt: 'Taito Kato, japonês, é piloto do Honda Formula Dream Project e foi campeão da F4 Francesa de 2024. Corre pela ART Grand Prix na F3 de 2026.',
    en: 'Japan\'s Taito Kato is part of the Honda Formula Dream Project and won the 2024 French F4 title. He races for ART Grand Prix in the 2026 F3 season.',
  },
  'f3:gladysz-f3': {
    pt: 'Maciej Gładysz, polonês, começou nos monopostos em 2024 na F4 Espanhola pela MP Motorsport, terminando em 3º, e subiu para a Eurocup-3 em 2025, temporada em que venceu a série de inverno. Estreia na F3 em 2026 pela ART Grand Prix.',
    en: 'Poland\'s Maciej Gładysz began in single-seaters in 2024 in Spanish F4 with MP Motorsport, finishing 3rd, and moved up to Eurocup-3 in 2025, a season in which he won the winter series. He makes his F3 debut in 2026 with ART Grand Prix.',
  },
  'f3:kanato-le-f3': {
    pt: 'Kanato Le, japonês, faz sua temporada de estreia na F3 em 2026, correndo pela ART Grand Prix.',
    en: 'Japan\'s Kanato Le is in his rookie F3 season in 2026, racing for ART Grand Prix.',
  },
  'f3:yamakoshi-f3': {
    pt: 'Hiyu Yamakoshi, japonês, se destacou na F4 Italiana em 2025, terminando em 3º lugar, e chega à F3 de 2026 pela Van Amersfoort Racing, equipe com a qual já está ligado há alguns anos.',
    en: 'Japan\'s Hiyu Yamakoshi impressed in Italian F4 in 2025, finishing 3rd, and joins the 2026 F3 grid with Van Amersfoort Racing, a team he has already been associated with for a few years.',
  },
  'f3:deligny-f3': {
    pt: 'Enzo Deligny, franco-chinês, integrou o programa de jovens da Red Bull entre 2023 e 2024. Estreou nos monopostos em 2023 na F4 Espanhola, onde já se destacou vencendo o título de estreante, e terminou em 4º lugar geral naquela temporada. Corre pela Van Amersfoort Racing na F3 de 2026.',
    en: 'French-Chinese driver Enzo Deligny was part of the Red Bull junior programme between 2023 and 2024. He made his single-seater debut in 2023 in Spanish F4, immediately making an impression by securing the rookie title, and finished 4th overall that season. He races for Van Amersfoort Racing in the 2026 F3 season.',
  },
  'f3:delpino': {
    pt: 'Bruno del Pino, espanhol, disputou a Eurocup-3 de 2024 pela MP Motorsport, terminando em 3º lugar, e sobe à F3 em 2026 pela Van Amersfoort Racing.',
    en: 'Spain\'s Bruno del Pino contested the 2024 Eurocup-3 season with MP Motorsport, finishing 3rd, and steps up to F3 in 2026 with Van Amersfoort Racing.',
  },
  'f3:clerot-f3': {
    pt: 'Pedro Clerot, brasileiro, foi tricampeão de Brasília (2018, 2019 e 2021) e bicampeão da Brazil Open Cup (2020 e 2021) no kart, além de campeão da F4 Brasileira em 2022. Corre pela Rodin Motorsport na F3 de 2026.',
    en: 'Brazil\'s Pedro Clerot was a three-time Brasília karting champion (2018, 2019 and 2021) and two-time Brazil Open Cup winner (2020 and 2021), on top of winning the 2022 Brazilian F4 title. He races for Rodin Motorsport in the 2026 F3 season.',
  },
  'f3:badoer': {
    pt: 'Brando Badoer, italiano, é filho do ex-piloto de Fórmula 1 Luca Badoer. Foi convidado pela Ferrari Driver Academy para o acampamento de observação de talentos ainda no kart, ao lado de Andrea Kimi Antonelli, e estreou nos monopostos em 2022, na F4 dos Emirados e na F4 Italiana. Corre pela Rodin Motorsport na F3 de 2026.',
    en: 'Italy\'s Brando Badoer is the son of former Formula 1 driver Luca Badoer. He was invited by the Ferrari Driver Academy to its talent-scouting camp while still karting, alongside Andrea Kimi Antonelli, and made his single-seater debut in 2022, in UAE F4 and Italian F4. He races for Rodin Motorsport in the 2026 F3 season.',
  },
  'f3:ho-f3': {
    pt: 'Christian Ho, cingapurense, foi vice-campeão da F4 Espanhola em 2023 e campeão da Eurocup-3 em 2024. Corre pela Rodin Motorsport na F3 de 2026.',
    en: 'Singapore\'s Christian Ho was runner-up in the 2023 Spanish F4 championship and won the 2024 Eurocup-3 title. He races for Rodin Motorsport in the 2026 F3 season.',
  },
  'f3:sharp': {
    pt: 'Louis Sharp, neozelandês, foi campeão da F4 Britânica em 2023 e da GB3 em 2024. Corre pela Prema Racing na F3 de 2026.',
    en: 'New Zealand\'s Louis Sharp won the British F4 title in 2023 and the GB3 title in 2024. He races for Prema Racing in the 2026 F3 season.',
  },
  'f3:wharton': {
    pt: 'James Wharton, australiano de 19 anos, entrou para a Prema Racing em 2022, disputando a F4 dos Emirados e a F4 Italiana. Foi vice-campeão da Euro 4 em 2023 e repetiu o resultado na Fórmula Regional Europeia em 2024, sempre pela equipe italiana. Já na F3, venceu uma sprint em Spielberg em 2025 e está em sua segunda temporada completa em 2026, ainda pela Prema.',
    en: 'Australia\'s James Wharton, 19, joined Prema Racing in 2022, contesting UAE F4 and Italian F4. He was runner-up in Euro 4 in 2023 and repeated the feat in Formula Regional Europe in 2024, both times with the Italian team. In F3, he won a sprint race in Spielberg in 2025 and is in his second full season in 2026, still with Prema.',
  },
  'f3:garfias-f3': {
    pt: 'José Garfias, mexicano de 21 anos, disputou a Euroformula e a Eurocup-3 nos últimos anos antes de subir à F3, categoria em que corre pela Prema Racing em 2026.',
    en: 'Mexico\'s José Garfias, 21, contested Euroformula and Eurocup-3 in recent years before stepping up to F3, the category he races in for Prema Racing in 2026.',
  },
  'f3:shin-f3': {
    pt: 'Michael Shin, sul-coreano, correu na F3 em 2023 pela PHM Racing sem pontuar, e desde então disputou outras categorias pela Motopark, com uma vitória em 2024 e quatro em 2025. Retorna à F3 em 2026 pela Hitech TGR.',
    en: 'South Korea\'s Michael Shin last raced in F3 in 2023 with PHM Racing without scoring points, and has since competed in other categories with Motopark, with one win in 2024 and four in 2025. He returns to F3 in 2026 with Hitech TGR.',
  },
  'f3:mclaughlin-f3': {
    pt: 'Fionn McLaughlin, irlandês de 18 anos, foi campeão da F4 Britânica em 2025 e terminou em 3º na Fórmula de Inverno naquele mesmo ano. Estreia na F3 em 2026 pela Hitech TGR.',
    en: 'Ireland\'s Fionn McLaughlin, 18, won the 2025 British F4 title and finished 3rd in the Winter Series that same year. He makes his F3 debut in 2026 with Hitech TGR.',
  },
  'f3:nakamura-f3': {
    pt: 'Jin Nakamura, japonês, é piloto do TOYOTA GAZOO Racing Driver Challenge Program e começou a carreira com duas temporadas na F4 Japonesa, terminando em 4º e depois em 2º. Corre pela Hitech TGR na F3 de 2026, ano em que já conquistou sua primeira vitória na categoria, na Sprint da Bélgica.',
    en: 'Japan\'s Jin Nakamura is part of the TOYOTA GAZOO Racing Driver Challenge Program and began his career with two seasons in Japanese F4, finishing 4th and then 2nd. He races for Hitech TGR in the 2026 F3 season, a year in which he already claimed his first win in the category, in the Belgian Sprint Race.',
  },
  'f3:benavides-f3': {
    pt: 'Brad Benavides, americano, corre pela AIX Racing na F3 de 2026.',
    en: 'America\'s Brad Benavides races for AIX Racing in the 2026 F3 season.',
  },
  'f3:yevan-david-f3': {
    pt: 'Yevan David é o primeiro piloto do Sri Lanka a disputar a F3, correndo pela AIX Racing em 2026. Antes, terminou vice-campeão da Euroformula Open com seis vitórias e 14 pódios.',
    en: 'Yevan David is the first driver from Sri Lanka to compete in F3, racing for AIX Racing in 2026. Before that, he finished runner-up in the Euroformula Open with six wins and 14 podiums.',
  },
  'f3:barrichello-f3': {
    pt: 'Fernando Barrichello, brasileiro, é filho caçula do vencedor de GPs de Fórmula 1 Rubens Barrichello e irmão mais novo de Eduardo Barrichello, também piloto. Começou no kart em 2015, no Florida Winter Tour, e corre pela AIX Racing na F3 de 2026.',
    en: 'Brazil\'s Fernando Barrichello is the youngest son of Formula 1 race winner Rubens Barrichello and younger brother of fellow driver Eduardo Barrichello. He started karting in 2015, in the Florida Winter Tour, and races for AIX Racing in the 2026 F3 season.',
  },
  'f3:lacorte-f3': {
    pt: 'Nicola Lacorte, italiano, corre pela DAMS Lucas Oil na F3 de 2026.',
    en: 'Italy\'s Nicola Lacorte races for DAMS Lucas Oil in the 2026 F3 season.',
  },
  'f3:bhirombhakdi-f3': {
    pt: 'Nandhavud Bhirombhakdi, tailandês, nasceu na família fundadora e dona da cervejaria Boon Rawd e começou a correr de kart aos 12 anos. Estreia na F3 em 2026 pela DAMS Lucas Oil.',
    en: 'Thailand\'s Nandhavud Bhirombhakdi was born into the family that founded and owns Boon Rawd Brewery and began competitive karting at age 12. He makes his F3 debut in 2026 with DAMS Lucas Oil.',
  },
  'f3:gerrard-xie-f3': {
    pt: 'Gerrard Xie, de Hong Kong, venceu o título da F4 Chinesa logo em sua estreia nos monopostos, em 2022, junto com a Fórmula Renault Super Challenge. Está em sua segunda temporada de F3 em 2026, pela DAMS Lucas Oil, buscando aproveitar os aprendizados da campanha de estreia.',
    en: 'Hong Kong\'s Gerrard Xie won the Chinese F4 title in his very first single-seater season, in 2022, alongside the Formula Renault Super Challenge. He is in his second F3 season in 2026, with DAMS Lucas Oil, looking to build on the lessons from his rookie campaign.',
  },

  // IndyCar — biografias reais, fonte: IndyCar.com, ESPN, Fox Sports, Wikipedia
  // (verificado ate meados de 2026).
  'indy:collet': {
    pt: 'Caio Collet, brasileiro, veio da academia de jovens da Alpine, onde disputou a Fórmula 3 e a Fórmula 2 europeias, antes de migrar para a Indy NXT. Subiu à IndyCar em 2026 pela A.J. Foyt Racing, assumindo a vaga de David Malukas.',
    en: 'Brazil\'s Caio Collet came through Alpine\'s junior academy, where he raced in European Formula 3 and Formula 2, before moving to Indy NXT. He stepped up to IndyCar in 2026 with A.J. Foyt Racing, taking over David Malukas\' seat.',
  },
  'indy:ferrucci': {
    pt: 'Santino Ferrucci, americano, é conhecido por seu estilo agressivo e por bons resultados em ovais, incluindo pódios na Indy 500. Corre pela A.J. Foyt Racing na IndyCar.',
    en: 'America\'s Santino Ferrucci is known for his aggressive style and strong results on ovals, including Indy 500 podiums. He races for A.J. Foyt Racing in IndyCar.',
  },
  'indy:power': {
    pt: 'Will Power, australiano, é campeão da IndyCar de 2022, vencedor da Indy 500 de 2018 e detentor do recorde histórico de mais poles da categoria. Depois de mais de uma década na Team Penske, mudou-se para a Andretti Global em 2026.',
    en: 'Australia\'s Will Power is the 2022 IndyCar champion, the 2018 Indy 500 winner and holds the series\' all-time record for most poles. After more than a decade at Team Penske, he moved to Andretti Global in 2026.',
  },
  'indy:kirkwood': {
    pt: 'Kyle Kirkwood, americano, é o único piloto da história a vencer o USF2000, o Indy Pro 2000 e a Indy Lights em anos de estreia consecutivos — a chamada Tríplice Coroa da Road to Indy. Corre pela Andretti Global na IndyCar, somando diversas vitórias na categoria.',
    en: 'America\'s Kyle Kirkwood is the only driver in history to win USF2000, Indy Pro 2000 and Indy Lights in consecutive rookie seasons — the so-called Road to Indy Triple Crown. He races for Andretti Global in IndyCar, with several wins in the series.',
  },
  'indy:ericsson': {
    pt: 'Marcus Ericsson, sueco, correu na Fórmula 1 pela Caterham e pela Sauber entre 2014 e 2018, sem pontuar de forma marcante, antes de migrar para a IndyCar. Venceu a Indy 500 de 2022 e corre pela Andretti Global.',
    en: 'Sweden\'s Marcus Ericsson raced in Formula 1 for Caterham and Sauber between 2014 and 2018, without major points finishes, before moving to IndyCar. He won the 2022 Indy 500 and races for Andretti Global.',
  },
  'indy:siegel': {
    pt: 'Nolan Siegel, americano, foi eleito novato do ano da Indy NXT em 2023 e já venceu corridas em todas as categorias de acesso da Road to Indy. Também tem uma vitória de classe nas 24 Horas de Le Mans, na LMP2, em 2024. Corre pela Arrow McLaren na IndyCar.',
    en: 'America\'s Nolan Siegel was named Indy NXT Rookie of the Year in 2023 and has won races in every category of the Road to Indy ladder. He also has a class win at the 24 Hours of Le Mans, in LMP2, in 2024. He races for Arrow McLaren in IndyCar.',
  },
  'indy:lundgaard': {
    pt: 'Christian Lundgaard, dinamarquês, integrou a academia de jovens da Alpine na Fórmula 2 antes de migrar para a IndyCar em 2022. Corre pela Arrow McLaren desde 2026.',
    en: 'Denmark\'s Christian Lundgaard was part of Alpine\'s junior academy in Formula 2 before moving to IndyCar in 2022. He has raced for Arrow McLaren since 2026.',
  },
  'indy:hunterreay': {
    pt: 'Ryan Hunter-Reay, americano, é campeão da IndyCar de 2012 e venceu a Indy 500 de 2014. Um dos pilotos mais experientes do grid, segue correndo pela Arrow McLaren.',
    en: 'America\'s Ryan Hunter-Reay is the 2012 IndyCar champion and won the 2014 Indy 500. One of the grid\'s most experienced drivers, he continues racing for Arrow McLaren.',
  },
  'indy:simpson-indy': {
    pt: 'Kyffin Simpson, das Ilhas Cayman, subiu pela Road to Indy antes de assumir vaga na Chip Ganassi Racing, uma das equipes mais vitoriosas da IndyCar.',
    en: 'The Cayman Islands\' Kyffin Simpson came up through the Road to Indy ladder before earning a seat with Chip Ganassi Racing, one of IndyCar\'s most successful teams.',
  },
  'indy:dixon-indy': {
    pt: 'Scott Dixon, neozelandês, é hexacampeão da IndyCar (2003, 2008, 2013, 2015, 2018 e 2020) e venceu a Indy 500 de 2008 — o piloto ativo mais vitorioso da história da categoria. Segue na Chip Ganassi Racing, equipe pela qual corre desde 2002.',
    en: 'New Zealand\'s Scott Dixon is a six-time IndyCar champion (2003, 2008, 2013, 2015, 2018 and 2020) and won the 2008 Indy 500 — the winningest active driver in series history. He continues with Chip Ganassi Racing, the team he has raced for since 2002.',
  },
  'indy:palou-indy': {
    pt: 'Álex Palou, espanhol, se tornou um dos maiores nomes da IndyCar recente, com múltiplos títulos da categoria conquistados pela Chip Ganassi Racing desde sua estreia em 2021.',
    en: 'Spain\'s Álex Palou has become one of the biggest names in recent IndyCar, with multiple championship titles won with Chip Ganassi Racing since his debut in 2021.',
  },
  'indy:grosjean': {
    pt: 'Romain Grosjean, francês, correu na Fórmula 1 pela Lotus e pela Haas entre 2009 e 2020, sobrevivendo a um grave acidente com fogo no GP do Bahrein daquele ano. Migrou para a IndyCar em 2021 e corre pela Dale Coyne Racing.',
    en: 'France\'s Romain Grosjean raced in Formula 1 for Lotus and Haas between 2009 and 2020, surviving a serious fiery crash at that year\'s Bahrain Grand Prix. He moved to IndyCar in 2021 and races for Dale Coyne Racing.',
  },
  'indy:hauger': {
    pt: 'Dennis Hauger, norueguês, veio do programa de jovens da Red Bull na Fórmula 2 e Fórmula 3 antes de migrar para os Estados Unidos. Foi campeão da Indy NXT de 2025 e subiu à IndyCar em 2026 pela Dale Coyne Racing.',
    en: 'Norway\'s Dennis Hauger came from Red Bull\'s junior programme in Formula 2 and Formula 3 before moving to the United States. He was the 2025 Indy NXT champion and stepped up to IndyCar in 2026 with Dale Coyne Racing.',
  },
  'indy:daly': {
    pt: 'Conor Daly, americano, é um dos pilotos mais experientes do grid da IndyCar, com passagens por diversas equipes ao longo da carreira. Corre pela Dreyer & Reinbold Racing.',
    en: 'America\'s Conor Daly is one of the most experienced drivers on the IndyCar grid, having driven for several teams throughout his career. He races for Dreyer & Reinbold Racing.',
  },
  'indy:harvey': {
    pt: 'Jack Harvey, britânico, já correu pela Meyer Shank Racing e pela Rahal Letterman Lanigan na IndyCar, com bons resultados em circuitos mistos e de rua. Segue na categoria pela Dreyer & Reinbold Racing.',
    en: 'Britain\'s Jack Harvey has driven for Meyer Shank Racing and Rahal Letterman Lanigan in IndyCar, with strong results on road and street courses. He continues in the category with Dreyer & Reinbold Racing.',
  },
  'indy:rossi': {
    pt: 'Alexander Rossi, americano, venceu a Indy 500 de 2016 logo em sua temporada de estreia na IndyCar, depois de uma breve passagem pela Fórmula 1 com a Manor em 2015. Corre pela Ed Carpenter Racing.',
    en: 'America\'s Alexander Rossi won the 2016 Indy 500 in his rookie IndyCar season, after a brief Formula 1 stint with Manor in 2015. He races for Ed Carpenter Racing.',
  },
  'indy:rasmussen': {
    pt: 'Christian Rasmussen, dinamarquês, foi campeão da Indy NXT em 2023 antes de subir à IndyCar. Corre pela Ed Carpenter Racing.',
    en: 'Denmark\'s Christian Rasmussen was the 2023 Indy NXT champion before stepping up to IndyCar. He races for Ed Carpenter Racing.',
  },
  'indy:carpenter-driver': {
    pt: 'Ed Carpenter, americano, é dono e piloto de sua própria equipe, a Ed Carpenter Racing, e é conhecido como um dos maiores especialistas em ovais do grid atual, correndo principalmente as etapas nesse tipo de pista.',
    en: 'America\'s Ed Carpenter is the owner-driver of his own team, Ed Carpenter Racing, and is known as one of the current grid\'s foremost oval specialists, typically racing only the oval rounds of the calendar.',
  },
  'indy:veekay': {
    pt: 'Rinus VeeKay, holandês, chegou a ser o mais jovem pole position da história da Indy 500. Corre pela Juncos Hollinger Racing na IndyCar.',
    en: 'The Netherlands\' Rinus VeeKay was once the youngest polesitter in Indy 500 history. He races for Juncos Hollinger Racing in IndyCar.',
  },
  'indy:robb': {
    pt: 'Sting Ray Robb, americano, subiu pela Road to Indy antes de chegar à IndyCar, correndo pela Juncos Hollinger Racing.',
    en: 'America\'s Sting Ray Robb came up through the Road to Indy ladder before reaching IndyCar, racing for Juncos Hollinger Racing.',
  },
  'indy:castroneves-indy': {
    pt: 'Hélio Castroneves, brasileiro, é um dos quatro pilotos da história a vencer a Indy 500 quatro vezes (2001, 2002, 2009 e 2021), famoso também por escalar a proteção da pista para comemorar cada vitória. Corre pela Meyer Shank Racing.',
    en: 'Brazil\'s Hélio Castroneves is one of only four drivers in history to win the Indy 500 four times (2001, 2002, 2009 and 2021), also famous for climbing the catch fence to celebrate each win. He races for Meyer Shank Racing.',
  },
  'indy:rosenqvist': {
    pt: 'Felix Rosenqvist, sueco, foi piloto de testes e reserva na Fórmula 1 antes de migrar para a IndyCar, onde já correu pela Ganassi, Arrow McLaren e agora Meyer Shank Racing.',
    en: 'Sweden\'s Felix Rosenqvist was a Formula 1 test and reserve driver before moving to IndyCar, where he has raced for Ganassi, Arrow McLaren and now Meyer Shank Racing.',
  },
  'indy:armstrong-indy': {
    pt: 'Marcus Armstrong, neozelandês, foi piloto da academia de jovens da Ferrari na Fórmula 2 e Fórmula 3 antes de migrar para a IndyCar. Corre pela Meyer Shank Racing.',
    en: 'New Zealand\'s Marcus Armstrong was a Ferrari Driver Academy driver in Formula 2 and Formula 3 before moving to IndyCar. He races for Meyer Shank Racing.',
  },
  'indy:rahal-driver': {
    pt: 'Graham Rahal, americano, é filho de Bobby Rahal, vencedor da Indy 500 de 1986, e corre pela equipe da família, a Rahal Letterman Lanigan Racing, desde 2009.',
    en: 'America\'s Graham Rahal is the son of Bobby Rahal, winner of the 1986 Indy 500, and has raced for the family team, Rahal Letterman Lanigan Racing, since 2009.',
  },
  'indy:foster': {
    pt: 'Louis Foster, britânico, veio da Indy NXT, categoria de acesso da IndyCar, e corre pela Rahal Letterman Lanigan Racing.',
    en: 'Britain\'s Louis Foster came up through Indy NXT, IndyCar\'s feeder series, and races for Rahal Letterman Lanigan Racing.',
  },
  'indy:schumacher': {
    pt: 'Mick Schumacher, alemão e filho do heptacampeão mundial de Fórmula 1 Michael Schumacher, correu na F1 pela Haas entre 2021 e 2022 e passou os dois anos seguintes no WEC. Mudou para a IndyCar em 2026, assinando pela Rahal Letterman Lanigan Racing.',
    en: 'Germany\'s Mick Schumacher, son of seven-time F1 world champion Michael Schumacher, raced in F1 for Haas between 2021 and 2022 and spent the following two years in the WEC. He switched to IndyCar in 2026, signing with Rahal Letterman Lanigan Racing.',
  },
  'indy:sato': {
    pt: 'Takuma Sato, japonês, correu na Fórmula 1 pela Jordan, BAR e Super Aguri entre 2002 e 2008 antes de migrar para a IndyCar, onde venceu a Indy 500 duas vezes (2017 e 2020). Corre pela Rahal Letterman Lanigan Racing.',
    en: 'Japan\'s Takuma Sato raced in Formula 1 for Jordan, BAR and Super Aguri between 2002 and 2008 before moving to IndyCar, where he won the Indy 500 twice (2017 and 2020). He races for Rahal Letterman Lanigan Racing.',
  },
  'indy:newgarden': {
    pt: 'Josef Newgarden, americano, é bicampeão da IndyCar (2017 e 2019) e o único piloto da história a vencer a Indy 500 em anos consecutivos (2023 e 2024). Corre pela Team Penske.',
    en: 'America\'s Josef Newgarden is a two-time IndyCar champion (2017 and 2019) and the only driver in history to win back-to-back Indy 500s (2023 and 2024). He races for Team Penske.',
  },
  'indy:mclaughlin': {
    pt: 'Scott McLaughlin, neozelandês, é tricampeão da Supercars australiana antes de migrar para a IndyCar em 2021. Corre pela Team Penske.',
    en: 'New Zealand\'s Scott McLaughlin is a three-time Australian Supercars champion who moved to IndyCar in 2021. He races for Team Penske.',
  },
  'indy:malukas': {
    pt: 'David Malukas, americano, veio da Indy Lights e se firmou como uma das jovens promessas da IndyCar antes de um grave acidente de moto o afastar das pistas por um tempo. Mudou-se para a Team Penske em 2026.',
    en: 'America\'s David Malukas came up through Indy Lights and established himself as one of IndyCar\'s young prospects before a serious motorcycle accident sidelined him for a time. He moved to Team Penske in 2026.',
  },

  // NASCAR — biografias reais, fonte: NASCAR.com, ESPN, Fox Sports, Jayski
  // (verificado ate meados de 2026).
  'nascar:wallace': {
    pt: 'Bubba Wallace, americano, é o primeiro piloto negro a competir em tempo integral na Cup Series desde Wendell Scott, décadas atrás. Corre pela 23XI Racing, equipe co-fundada por Michael Jordan e Denny Hamlin, com vitórias na categoria.',
    en: 'America\'s Bubba Wallace is the first Black driver to compete full-time in the Cup Series since Wendell Scott, decades earlier. He races for 23XI Racing, the team co-founded by Michael Jordan and Denny Hamlin, with wins in the category.',
  },
  'nascar:herbst': {
    pt: 'Riley Herbst, americano, subiu à Cup Series em 2025 pela 23XI Racing depois de vencer a corrida final da temporada de Xfinity Series em Phoenix. Em cinco temporadas completas na Xfinity, somou 175 largadas e três vitórias.',
    en: 'America\'s Riley Herbst stepped up to the Cup Series in 2025 with 23XI Racing after winning the season finale of the Xfinity Series at Phoenix. Across five full Xfinity seasons, he made 175 starts with three wins.',
  },
  'nascar:reddick': {
    pt: 'Tyler Reddick, americano, se firmou como um dos pilotos mais rápidos da Cup Series nos últimos anos, com múltiplas vitórias. Corre pela 23XI Racing.',
    en: 'America\'s Tyler Reddick has established himself as one of the fastest drivers in the Cup Series in recent years, with multiple wins. He races for 23XI Racing.',
  },
  'nascar:cindric': {
    pt: 'Austin Cindric, americano, é filho do presidente da Team Penske, Tim Cindric, e venceu a Daytona 500 de 2022 logo em sua temporada de estreia como titular na Cup Series. Corre pela Team Penske.',
    en: 'America\'s Austin Cindric is the son of Team Penske president Tim Cindric and won the 2022 Daytona 500 in his rookie season as a full-time Cup Series driver. He races for Team Penske.',
  },
  'nascar:blaney': {
    pt: 'Ryan Blaney, americano, é campeão da Cup Series de 2023 e corre pela Team Penske, equipe pela qual disputa desde 2018.',
    en: 'America\'s Ryan Blaney is the 2023 Cup Series champion and races for Team Penske, the team he has driven for since 2018.',
  },
  'nascar:logano': {
    pt: 'Joey Logano, americano, é bicampeão da Cup Series (2018 e 2022) e venceu a Daytona 500 de 2015. Corre pela Team Penske.',
    en: 'America\'s Joey Logano is a two-time Cup Series champion (2018 and 2022) and won the 2015 Daytona 500. He races for Team Penske.',
  },
  'nascar:hamlin': {
    pt: 'Denny Hamlin, americano, é um dos pilotos mais vitoriosos da história da Cup Series, com três vitórias na Daytona 500 (2016, 2019 e 2020), mas nunca conquistou o título de pilotos. É também co-proprietário da 23XI Racing, ao lado de Michael Jordan, mas segue correndo pela Joe Gibbs Racing.',
    en: 'America\'s Denny Hamlin is one of the most successful drivers in Cup Series history, with three Daytona 500 wins (2016, 2019 and 2020), but has never won the drivers\' championship. He is also co-owner of 23XI Racing, alongside Michael Jordan, but continues racing for Joe Gibbs Racing.',
  },
  'nascar:briscoe': {
    pt: 'Chase Briscoe, americano, correu pela Stewart-Haas Racing antes de a equipe encerrar as atividades, e se mudou para a Joe Gibbs Racing, somando vitórias na Cup Series.',
    en: 'America\'s Chase Briscoe raced for Stewart-Haas Racing before the team shut down operations, and moved to Joe Gibbs Racing, adding Cup Series wins along the way.',
  },
  'nascar:bell': {
    pt: 'Christopher Bell, americano, é um dos pilotos mais rápidos da atual geração da Cup Series, com múltiplas vitórias e presenças constantes nos playoffs. Corre pela Joe Gibbs Racing.',
    en: 'America\'s Christopher Bell is one of the fastest drivers of the current Cup Series generation, with multiple wins and regular playoff appearances. He races for Joe Gibbs Racing.',
  },
  'nascar:gibbs': {
    pt: 'Ty Gibbs, americano, é neto do dono da equipe, Joe Gibbs, e foi campeão da Xfinity Series em 2022 antes de subir à Cup Series pela Joe Gibbs Racing.',
    en: 'America\'s Ty Gibbs is the grandson of team owner Joe Gibbs and won the 2022 Xfinity Series championship before stepping up to the Cup Series with Joe Gibbs Racing.',
  },
  'nascar:larson': {
    pt: 'Kyle Larson, americano, é campeão da Cup Series de 2021 e um dos pilotos mais versáteis do automobilismo americano, competindo também em provas de sprint car fora da NASCAR e tentando a dobradinha com a Indy 500 em alguns anos. Corre pela Hendrick Motorsports.',
    en: 'America\'s Kyle Larson is the 2021 Cup Series champion and one of the most versatile drivers in American motorsport, also competing in sprint car races outside NASCAR and attempting the Indy 500 double in some years. He races for Hendrick Motorsports.',
  },
  'nascar:elliott': {
    pt: 'Chase Elliott, americano, é campeão da Cup Series de 2020 e filho do piloto do Hall da Fama da NASCAR Bill Elliott. É também um dos pilotos mais populares da categoria, com múltiplos prêmios de piloto mais popular. Corre pela Hendrick Motorsports.',
    en: 'America\'s Chase Elliott is the 2020 Cup Series champion and the son of NASCAR Hall of Famer Bill Elliott. He is also one of the category\'s most popular drivers, with multiple Most Popular Driver awards. He races for Hendrick Motorsports.',
  },
  'nascar:byron': {
    pt: 'William Byron, americano, é um dos pilotos em ascensão da Cup Series, com vitórias na Daytona 500. Corre pela Hendrick Motorsports.',
    en: 'America\'s William Byron is one of the Cup Series\' rising stars, with Daytona 500 wins. He races for Hendrick Motorsports.',
  },
  'nascar:bowman': {
    pt: 'Alex Bowman, americano, veio da JR Motorsports, equipe de Xfinity de Dale Earnhardt Jr., antes de subir à Hendrick Motorsports na Cup Series.',
    en: 'America\'s Alex Bowman came from JR Motorsports, Dale Earnhardt Jr.\'s Xfinity team, before moving up to Hendrick Motorsports in the Cup Series.',
  },
  'nascar:keselowski': {
    pt: 'Brad Keselowski, americano, é campeão da Cup Series de 2012 e hoje é piloto e co-proprietário da RFK Racing, ao lado da família Roush.',
    en: 'America\'s Brad Keselowski is the 2012 Cup Series champion and is now both a driver and co-owner of RFK Racing, alongside the Roush family.',
  },
  'nascar:buescher': {
    pt: 'Chris Buescher, americano, vem somando vitórias consistentes nos últimos anos pela RFK Racing na Cup Series.',
    en: 'America\'s Chris Buescher has been racking up consistent wins in recent years with RFK Racing in the Cup Series.',
  },
  'nascar:preece': {
    pt: 'Ryan Preece, americano, sobreviveu a um grave acidente em alta velocidade em Daytona em 2023, capotando várias vezes, e voltou às pistas pouco depois. Corre pela RFK Racing.',
    en: 'America\'s Ryan Preece survived a serious high-speed crash at Daytona in 2023, flipping multiple times, and returned to racing shortly after. He races for RFK Racing.',
  },
  'nascar:chastain': {
    pt: 'Ross Chastain, americano, veio de uma família de produtores de melancia e ficou conhecido pelo apelido "Watermelon Man". Chamou atenção mundial em 2022 ao "colar" o carro no muro em alta velocidade em Martinsville para ganhar posições nos metros finais de uma corrida, manobra apelidada de "Hail Melon". Corre pela Trackhouse Racing.',
    en: 'America\'s Ross Chastain comes from a family of watermelon farmers and became known by the nickname "Watermelon Man." He drew worldwide attention in 2022 by riding his car along the wall at high speed at Martinsville to gain positions in a race\'s final laps, a move nicknamed the "Hail Melon." He races for Trackhouse Racing.',
  },
  'nascar:suarez': {
    pt: 'Daniel Suárez, mexicano, foi o primeiro piloto nascido no México a vencer na Cup Series, em 2022. Corre pela Trackhouse Racing.',
    en: 'Mexico\'s Daniel Suárez was the first Mexican-born driver to win in the Cup Series, in 2022. He races for Trackhouse Racing.',
  },
  'nascar:zilisch-nascar': {
    pt: 'Connor Zilisch, americano, foi promovido à Cup Series em 2026 pela Trackhouse Racing depois de uma temporada de estreia avassaladora na Xfinity Series, com 10 vitórias correndo pela JR Motorsports.',
    en: 'America\'s Connor Zilisch was promoted to the Cup Series in 2026 with Trackhouse Racing after a dominant rookie Xfinity Series season, with 10 wins driving for JR Motorsports.',
  },
  'nascar:svg': {
    pt: 'Shane van Gisbergen, neozelandês, é um dos maiores nomes da história da Supercars australiana, com múltiplos títulos da categoria, antes de migrar para a NASCAR. Venceu de forma surpreendente em sua estreia na Cup Series, em 2023, no circuito de rua de Chicago. Corre pela Trackhouse Racing.',
    en: 'New Zealand\'s Shane van Gisbergen is one of the biggest names in Australian Supercars history, with multiple championship titles, before moving to NASCAR. He won in stunning fashion on his Cup Series debut, in 2023, on the Chicago street course. He races for Trackhouse Racing.',
  },
  'nascar:mcdowell': {
    pt: 'Michael McDowell, americano, venceu a Daytona 500 de 2021 como um dos maiores azarões da história da prova. Corre pela Spire Motorsports.',
    en: 'America\'s Michael McDowell won the 2021 Daytona 500 as one of the biggest underdogs in the race\'s history. He races for Spire Motorsports.',
  },
  'nascar:hocevar': {
    pt: 'Carson Hocevar, americano, conquistou sua primeira vitória na Cup Series em 2026, em Talladega, já em sua 91ª largada na categoria, e assinou contrato de longo prazo com a Spire Motorsports.',
    en: 'America\'s Carson Hocevar claimed his first Cup Series win in 2026, at Talladega, in his 91st start in the category, and signed a long-term contract with Spire Motorsports.',
  },
  'nascar:tydillon': {
    pt: 'Ty Dillon, americano, é neto do dono da Richard Childress Racing, Richard Childress, e irmão de Austin Dillon. Corre pela Kaulig Racing.',
    en: 'America\'s Ty Dillon is the grandson of Richard Childress Racing owner Richard Childress and brother of Austin Dillon. He races for Kaulig Racing.',
  },
  'nascar:allmendinger-nascar': {
    pt: 'AJ Allmendinger, americano, é um dos pilotos mais versáteis do grid, com passagens por IndyCar antes da NASCAR e reconhecido especialmente por seu desempenho em circuitos mistos. Corre pela Kaulig Racing.',
    en: 'America\'s AJ Allmendinger is one of the grid\'s most versatile drivers, having raced in IndyCar before NASCAR and particularly known for his road-course performances. He races for Kaulig Racing.',
  },
  'nascar:gragson': {
    pt: 'Noah Gragson, americano, é conhecido por seu estilo agressivo nas pistas. Corre pela Front Row Motorsports.',
    en: 'America\'s Noah Gragson is known for his aggressive on-track style. He races for Front Row Motorsports.',
  },
  'nascar:gilliland': {
    pt: 'Todd Gilliland, americano, é filho do ex-piloto de NASCAR David Gilliland. Corre pela Front Row Motorsports.',
    en: 'America\'s Todd Gilliland is the son of former NASCAR driver David Gilliland. He races for Front Row Motorsports.',
  },
  'nascar:zanesmith': {
    pt: 'Zane Smith, americano, foi campeão da Truck Series antes de subir à Cup Series. Corre pela Front Row Motorsports.',
    en: 'America\'s Zane Smith was a Truck Series champion before stepping up to the Cup Series. He races for Front Row Motorsports.',
  },
  'nascar:nemechek-nascar': {
    pt: 'John Hunter Nemechek, americano, é filho do ex-piloto de NASCAR Joe Nemechek. Corre pela Legacy Motor Club.',
    en: 'America\'s John Hunter Nemechek is the son of former NASCAR driver Joe Nemechek. He races for Legacy Motor Club.',
  },
  'nascar:jones': {
    pt: 'Erik Jones, americano, já correu pela Furniture Row Racing e pela Joe Gibbs Racing antes de chegar à Legacy Motor Club, somando vitórias na Cup Series ao longo da carreira.',
    en: 'America\'s Erik Jones has raced for Furniture Row Racing and Joe Gibbs Racing before joining Legacy Motor Club, with Cup Series wins across his career.',
  },
  'nascar:adillon': {
    pt: 'Austin Dillon, americano, é neto do dono da equipe, Richard Childress, e venceu a Daytona 500 de 2018 num final de corrida contestado, com uma batida no último giro. Corre pela Richard Childress Racing.',
    en: 'America\'s Austin Dillon is the grandson of team owner Richard Childress and won the 2018 Daytona 500 in a contested finish, with a last-lap crash. He races for Richard Childress Racing.',
  },
  'nascar:austinhill': {
    pt: 'Austin Hill, americano, foi novato do ano da Xfinity Series em 2022 e campeão da temporada regular em 2023, com 14 vitórias na categoria ao longo da carreira. Subiu à Cup Series pela Richard Childress Racing.',
    en: 'America\'s Austin Hill was Xfinity Series Rookie of the Year in 2022 and regular-season champion in 2023, with 14 career wins in the category. He stepped up to the Cup Series with Richard Childress Racing.',
  },
  'nascar:berry': {
    pt: 'Josh Berry, americano, correu pela Stewart-Haas Racing antes de a equipe encerrar as atividades, migrando para a Wood Brothers Racing em 2025, ano em que conquistou sua primeira vitória na Cup Series, em Las Vegas.',
    en: 'America\'s Josh Berry raced for Stewart-Haas Racing before the team shut down operations, moving to Wood Brothers Racing in 2025, the year he claimed his first Cup Series win, at Las Vegas.',
  },
  'nascar:custer': {
    pt: 'Cole Custer, americano, venceu na Cup Series em Kentucky em 2020, ainda em sua temporada de estreia como titular. Corre pela Haas Factory Team.',
    en: 'America\'s Cole Custer won in the Cup Series at Kentucky in 2020, in his rookie season as a full-time driver. He races for Haas Factory Team.',
  },
  'nascar:stenhouse': {
    pt: 'Ricky Stenhouse Jr., americano, foi bicampeão da Xfinity Series (2011 e 2012) antes de subir à Cup Series, onde venceu a Daytona 500 de 2023.',
    en: 'America\'s Ricky Stenhouse Jr. was a two-time Xfinity Series champion (2011 and 2012) before stepping up to the Cup Series, where he won the 2023 Daytona 500.',
  },
  'nascar:ware': {
    pt: 'Cody Ware, americano, corre pela Rick Ware Racing, equipe de propriedade de sua família.',
    en: 'America\'s Cody Ware races for Rick Ware Racing, the team owned by his family.',
  },
};

// As chaves de DRIVER_BIOS levam o prefixo "categoria:" porque o id de piloto
// so e unico dentro da propria categoria -- varias categorias reaproveitam o
// mesmo id para pessoas diferentes (ex.: "maini" e o Kush Maini na F2 mas o
// irmao dele, Arjun Maini, na DTM), e ate quando e a mesma pessoa em duas
// categorias (comum em GT3/endurance) as bios podem divergir por contexto.
function getDriverBio(categoryId: string, driverId: string): { pt: string; en: string } | undefined {
  return DRIVER_BIOS[`${categoryId}:${driverId}`];
}

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
  return haystack.includes('francorchamps') || haystack.includes('belgian grand prix');
}

function isChinaRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('shanghai') || haystack.includes('chinese grand prix');
}

function isJapanRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('suzuka') || haystack.includes('japanese grand prix');
}

function isBahrainRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('bahrain') || haystack.includes('sakhir');
}

function isMiamiRace(race: Race): boolean {
  const haystack = raceHaystack(race);
  return haystack.includes('miami');
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

// Paginas de teste habilitadas ate agora: as 23 pistas do calendario de F1 2026, exceto a
// Arabia Saudita (Jeddah Corniche), que segue sem pagina dedicada.
const RACE_TEST_CIRCUITS: { match: (race: Race) => boolean; info: CircuitInfo }[] = [
  { match: isInterlagosRace, info: INTERLAGOS_CIRCUIT_INFO },
  { match: isSilverstoneRace, info: SILVERSTONE_CIRCUIT_INFO },
  { match: isAlbertParkRace, info: ALBERT_PARK_CIRCUIT_INFO },
  { match: isSpaRace, info: SPA_CIRCUIT_INFO },
  { match: isChinaRace, info: SHANGHAI_CIRCUIT_INFO },
  { match: isJapanRace, info: SUZUKA_CIRCUIT_INFO },
  { match: isBahrainRace, info: BAHRAIN_CIRCUIT_INFO },
  { match: isMiamiRace, info: MIAMI_CIRCUIT_INFO },
  { match: isCanadaRace, info: CANADA_CIRCUIT_INFO },
  { match: isMonacoRace, info: MONACO_CIRCUIT_INFO },
  { match: isSpainRace, info: SPAIN_CIRCUIT_INFO },
  { match: isAustriaRace, info: AUSTRIA_CIRCUIT_INFO },
  { match: isHungaryRace, info: HUNGARY_CIRCUIT_INFO },
  { match: isNetherlandsRace, info: NETHERLANDS_CIRCUIT_INFO },
  { match: isItalyRace, info: ITALY_CIRCUIT_INFO },
  { match: isMadridRace, info: MADRID_CIRCUIT_INFO },
  { match: isAzerbaijanRace, info: AZERBAIJAN_CIRCUIT_INFO },
  { match: isSingaporeRace, info: SINGAPORE_CIRCUIT_INFO },
  { match: isUsaRace, info: USA_CIRCUIT_INFO },
  { match: isMexicoRace, info: MEXICO_CIRCUIT_INFO },
  { match: isVegasRace, info: VEGAS_CIRCUIT_INFO },
  { match: isQatarRace, info: QATAR_CIRCUIT_INFO },
  { match: isAbuDhabiRace, info: ABUDHABI_CIRCUIT_INFO },
];

function getRaceCircuitInfo(race: Race): CircuitInfo | null {
  return RACE_TEST_CIRCUITS.find(({ match }) => match(race))?.info ?? null;
}

// Categorias que, em pesquisa, realmente correm em algum dos 23 circuitos acima
// (mesmo tracado fisico, nao so a mesma cidade). F2/F3/F1 Academy dividem varios
// finais de semana com a F1; WEC, DTM, GT World Challenge e NASCAR passam por
// algumas dessas pistas em seus proprios calendarios. IMSA e IndyCar, nos
// calendarios atuais do site, nao tocam nenhuma delas. WRC fica de fora de
// proposito: mesmo quando o nome da etapa cita a mesma cidade (ex.: Rallye
// Monte-Carlo), a prova roda em estradas de montanha, nao no circuito de verdade.
const CIRCUIT_PAGE_CATEGORY_IDS = new Set([
  'f1', 'f2', 'f3', 'f1-academy', 'wec', 'dtm', 'gt-world-challenge', 'nascar',
]);

function hasCircuitPage(category: Category, race: Race): boolean {
  return CIRCUIT_PAGE_CATEGORY_IDS.has(category.id) && getRaceCircuitInfo(race) != null;
}

function formatOrdinal(position: number, language: 'pt' | 'en'): { number: string; suffix: string } {
  if (language === 'pt') return { number: String(position), suffix: 'º' };
  const mod100 = position % 100;
  const mod10 = position % 10;
  let suffix = 'TH';
  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = 'ST';
    else if (mod10 === 2) suffix = 'ND';
    else if (mod10 === 3) suffix = 'RD';
  }
  return { number: String(position), suffix };
}

function getIsIOSInstallable(): boolean {
  if (typeof navigator === 'undefined') return false;
  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
  return !isStandalone;
}

// Guarda em qual pagina o usuario estava (view/categoria/aba/corrida) para
// sobreviver a um refresh (F5/recarregar), mas voltar para a home quando o
// app for fechado e reaberto. sessionStorage sozinho nao da conta disso de
// forma confiavel: em PWA instalado (principalmente iOS), o que a pessoa
// sente como "atualizar a pagina" as vezes reinicia o processo do WebView e
// perde o sessionStorage do mesmo jeito que um fechar/reabrir de verdade --
// nesse caso, a pagina voltaria pra home mesmo sendo so um refresh.
//
// Por isso guardamos o estado em localStorage (sobrevive a qualquer coisa) e
// so restauramos ele quando a Navigation Timing API confirma que ESTA carga
// de pagina foi mesmo um reload (type === 'reload') -- e o unico sinal que o
// navegador da que independe de sessionStorage ter sobrevivido ou nao. Uma
// abertura nova do app (icone, apos fechado) chega como "navigate", nunca
// como "reload", entao cai na home normalmente.
const NAV_STORAGE_KEY = 'pitstophub_nav_state';

type StoredNav = {
  view: 'home' | 'category' | 'race' | 'driver' | 'favorites';
  categoryId: string;
  activeTab: 'overview' | 'teams' | 'calendar' | 'standings';
  raceId: string | null;
  driverId: string | null;
};

function isReloadNavigation(): boolean {
  if (typeof window === 'undefined' || !window.performance) return false;
  try {
    const [entry] = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entry) return entry.type === 'reload';
  } catch {
    // Navigation Timing L2 indisponivel -- cai no fallback legado abaixo.
  }
  const legacyNavigation = (window.performance as unknown as { navigation?: { type: number } }).navigation;
  return legacyNavigation?.type === 1; // PerformanceNavigation.TYPE_RELOAD
}

function readStoredNav(): StoredNav | null {
  if (typeof window === 'undefined' || !isReloadNavigation()) return null;
  try {
    const raw = window.localStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredNav;
  } catch {
    return null;
  }
}

type AppProps = {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onLoginRequest: () => void;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function App({ currentUser, onLogout, onLoginRequest }: AppProps) {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [introEnabled, setIntroEnabled] = useState(() => !isIntroDisabled());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'home' | 'category' | 'race' | 'driver' | 'favorites'>(() => readStoredNav()?.view ?? 'home');
  const [selectedCategoryBase, setSelectedCategoryBase] = useState<Category>(() => {
    const stored = readStoredNav();
    return (stored && CATEGORY_BY_ID.get(stored.categoryId)) || MOTORSPORT_DATA[0];
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'calendar' | 'standings'>(
    () => readStoredNav()?.activeTab ?? 'overview'
  );
  const [showRules, setShowRules] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(() => {
    const stored = readStoredNav();
    if (!stored?.raceId) return null;
    const category = CATEGORY_BY_ID.get(stored.categoryId);
    return category?.calendar.find((r) => r.id === stored.raceId) ?? null;
  });
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(() => {
    const stored = readStoredNav();
    if (!stored?.driverId) return null;
    const category = CATEGORY_BY_ID.get(stored.categoryId);
    return category?.drivers.find((d) => d.id === stored.driverId) ?? null;
  });
  const [activeHomeGroup, setActiveHomeGroup] = useState<string>(NAV_GROUPS[0].name.en);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [followedCategoryIds, setFollowedCategoryIds] = useState<string[]>([]);
  const [followedTeamIds, setFollowedTeamIds] = useState<string[]>([]);
  const [followedDriverIds, setFollowedDriverIds] = useState<string[]>([]);
  const [favoritesOnboarded, setFavoritesOnboarded] = useState(false);
  const [priorityFollowIds, setPriorityFollowIds] = useState<string[]>([]);
  const [showFavoritesOnboarding, setShowFavoritesOnboarding] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installingApp, setInstallingApp] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(
    () => getIsIOSInstallable() && localStorage.getItem('pitstophub_ios_install_dismissed') !== '1'
  );
  const [liveCategorySummaries, setLiveCategorySummaries] = useState<Partial<Record<Category['id'], JolpicaCategoryData | null>>>({});
  const [liveCategoryData, setLiveCategoryData] = useState<JolpicaCategoryData | null>(null);
  const [liveCategoryState, setLiveCategoryState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [syncedCalendars, setSyncedCalendars] = useState<Partial<Record<Category['id'], Race[] | null>>>({});
  const [driverSeasonResults, setDriverSeasonResults] = useState<DriverResultRow[] | null>(null);
  const [driverResultsState, setDriverResultsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  React.useEffect(() => {
    try {
      const payload: StoredNav = {
        view,
        categoryId: selectedCategoryBase.id,
        activeTab,
        raceId: selectedRace?.id ?? null,
        driverId: selectedDriver?.id ?? null,
      };
      window.localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage indisponivel (modo privado, etc.) -- ignora, so afeta a persistencia.
    }
  }, [view, selectedCategoryBase.id, activeTab, selectedRace?.id, selectedDriver?.id]);
  const [syncedStandings, setSyncedStandings] = useState<Partial<Record<Category['id'], StandingItem[] | null>>>({});

  React.useEffect(() => {
    if (!currentUser) {
      setLanguage('pt');
      setIsDarkMode(true);
      setFollowedCategoryIds([]);
      setFollowedTeamIds([]);
      setFollowedDriverIds([]);
      setFavoritesOnboarded(true);
      setPriorityFollowIds([]);
      setSelectedCategoryBase(MOTORSPORT_DATA[0]);
      setSettingsLoaded(true);
      return;
    }

    let isMounted = true;
    setSettingsLoaded(false);
    (async () => {
      try {
        const settings = await getUserSettings(currentUser.id);
        if (!isMounted) return;
        if (settings) {
          setLanguage(settings.language);
          setIsDarkMode(settings.theme === 'dark');
          setFollowedCategoryIds(settings.followedCategoryIds);
          setFollowedTeamIds(settings.followedTeamIds);
          setFollowedDriverIds(settings.followedDriverIds);
          setFavoritesOnboarded(settings.favoritesOnboarded);
          setPriorityFollowIds(settings.priorityFollowIds);
          const category = CATEGORY_BY_ID.get(settings.favoriteCategoryId);
          if (category) setSelectedCategoryBase(category);
        } else {
          setFavoritesOnboarded(false);
          setPriorityFollowIds([]);
        }
      } catch (error) {
        console.error('Falha ao aplicar configuracoes do usuario.', error);
      } finally {
        if (isMounted) {
          setSettingsLoaded(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  React.useEffect(() => {
    if (!currentUser || !settingsLoaded) return;
    const t = window.setTimeout(() => {
      void saveUserSettings(currentUser.id, {
        theme: isDarkMode ? 'dark' : 'light',
        language,
        favoriteCategoryId: selectedCategoryBase.id,
        followedCategoryIds,
        followedTeamIds,
        followedDriverIds,
        favoritesOnboarded,
        priorityFollowIds,
      }).catch((error) => {
        console.error('Falha ao salvar configuracoes do usuario.', error);
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [currentUser, settingsLoaded, isDarkMode, language, selectedCategoryBase.id, followedCategoryIds, followedTeamIds, followedDriverIds, favoritesOnboarded, priorityFollowIds]);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setInstallingApp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const syncSummaries = async (force = false) => {
      await Promise.allSettled(
        getSupportedLiveCategoryIds().map(async (categoryId) => {
          const category = CATEGORY_BY_ID.get(categoryId);
          if (!category) return;
          try {
            const data = await fetchCategoryLiveSummary(category, force);
            if (!isMounted) return;
            setLiveCategorySummaries((prev) => ({ ...prev, [categoryId]: data }));
          } catch (error) {
            console.error(`Falha ao sincronizar resumo ao vivo de ${categoryId}.`, error);
          }
        }),
      );
    };

    void syncSummaries();

    const intervalId = window.setInterval(() => {
      void syncSummaries(true);
    }, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncSummaries(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const syncCalendars = async (force = false) => {
      await Promise.allSettled(
        getSyncedCategoryIds().map(async (categoryId) => {
          try {
            const [calendar, standings] = await Promise.all([
              fetchSyncedCalendar(categoryId, force),
              fetchSyncedStandings(categoryId, force),
            ]);
            if (!isMounted) return;
            setSyncedCalendars((prev) => ({ ...prev, [categoryId]: calendar }));
            setSyncedStandings((prev) => ({ ...prev, [categoryId]: standings }));
          } catch (error) {
            console.error(`Falha ao sincronizar dados de ${categoryId}.`, error);
          }
        }),
      );
    };

    void syncCalendars();

    const intervalId = window.setInterval(() => {
      void syncCalendars(true);
    }, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    if (!isCategoryLiveSupported(selectedCategoryBase.id)) {
      setLiveCategoryData(null);
      setLiveCategoryState('idle');
      return;
    }

    const syncCategoryDetail = async (force = false) => {
      try {
        const data = await fetchCategoryLiveData(selectedCategoryBase, force);
        if (!isMounted) return;
        setLiveCategoryData(data);
        setLiveCategoryState('ready');
        setLiveCategorySummaries((prev) => ({ ...prev, [selectedCategoryBase.id]: data }));
      } catch (error) {
        console.error('Falha ao sincronizar dados da Jolpica F1.', error);
        if (!isMounted) return;
        setLiveCategoryData(null);
        setLiveCategoryState('error');
      }
    };

    setLiveCategoryState('loading');
    void syncCategoryDetail();

    const intervalId = window.setInterval(() => {
      if (view === 'category') {
        void syncCategoryDetail(true);
      }
    }, 10 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && view === 'category') {
        void syncCategoryDetail(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedCategoryBase, view]);

  const allCategories = useMemo(
    () => MOTORSPORT_DATA.map((category) => {
      const normalizedCategory = category.id === 'f1'
        ? { ...category, ...F1_STATIC_FALLBACK }
        : category;
      const summaryData = liveCategorySummaries[category.id] ?? null;
      const detailData = selectedCategoryBase.id === category.id ? liveCategoryData : null;
      const liveMerged = mergeCategoryWithLiveData(mergeCategoryWithLiveData(normalizedCategory, summaryData), detailData);
      const calendarMerged = mergeCategoryWithSyncedCalendar(liveMerged, syncedCalendars[category.id] ?? null);
      return mergeCategoryWithSyncedStandings(calendarMerged, syncedStandings[category.id] ?? null);
    }),
    [liveCategorySummaries, selectedCategoryBase.id, liveCategoryData, syncedCalendars, syncedStandings]
  );

  const allCategoriesById = useMemo(
    () => new Map(allCategories.map((category) => [category.id, category])),
    [allCategories]
  );

  const selectedCategory = useMemo(
    () => allCategoriesById.get(selectedCategoryBase.id) ?? selectedCategoryBase,
    [allCategoriesById, selectedCategoryBase]
  );

  const categoryAccent = getCategoryAccent(selectedCategory.id);
  const categoryAccentInk = getAccentTextColor(categoryAccent);

  React.useEffect(() => {
    if (view !== 'driver' || !selectedDriver || selectedCategory.id !== 'f1') {
      setDriverSeasonResults(null);
      setDriverResultsState('idle');
      return;
    }
    let isMounted = true;
    setDriverResultsState('loading');
    const year = selectedCategory.calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
    fetchDriverSeasonResults(selectedDriver.id, year)
      .then((rows) => {
        if (!isMounted) return;
        setDriverSeasonResults(rows);
        setDriverResultsState(rows ? 'ready' : 'error');
      })
      .catch((error: unknown) => {
        console.error('Falha ao buscar resultados do piloto.', error);
        if (!isMounted) return;
        setDriverSeasonResults(null);
        setDriverResultsState('error');
      });
    return () => {
      isMounted = false;
    };
  }, [view, selectedDriver, selectedCategory.id, selectedCategory.calendar]);

  const handleCategorySelect = useCallback((cat: Category) => {
    setSelectedCategoryBase(cat);
    setView('category');
    setActiveTab('overview');
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }, []);

  const followedCategorySet = useMemo(() => new Set(followedCategoryIds), [followedCategoryIds]);
  const followedTeamSet = useMemo(() => new Set(followedTeamIds), [followedTeamIds]);
  const followedDriverSet = useMemo(() => new Set(followedDriverIds), [followedDriverIds]);

  const followedCategoryObjects = useMemo(() => {
    const categoriesToShow = new Set<string>([
      ...followedCategoryIds,
      ...followedTeamIds.map(v => v.split('::')[0]).filter(Boolean),
      ...followedDriverIds.map(v => v.split('::')[0]).filter(Boolean),
    ]);

    return Array.from(categoriesToShow)
      .map(id => allCategoriesById.get(id))
      .filter((cat): cat is NonNullable<typeof cat> => cat != null);
  }, [allCategoriesById, followedCategoryIds, followedTeamIds, followedDriverIds]);

  const upcomingFollowedRaces = useMemo(() => {
    return followedCategoryObjects
      .flatMap(category =>
        category.calendar
          .filter(race => race.status === 'upcoming')
          .map(race => ({ category, race }))
      )
      .sort((a, b) => a.race.date.localeCompare(b.race.date));
  }, [followedCategoryObjects]);

  const toggleFollowCategory = useCallback((categoryId: string) => {
    if (!currentUser) return onLoginRequest();
    setFollowedCategoryIds(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  }, [currentUser, onLoginRequest]);

  const toggleFollowTeam = useCallback((categoryId: string, teamId: string) => {
    if (!currentUser) return onLoginRequest();
    const key = `${categoryId}::${teamId}`;
    setFollowedTeamIds(prev => prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]);
  }, [currentUser, onLoginRequest]);

  const toggleFollowDriver = useCallback((categoryId: string, driverId: string) => {
    if (!currentUser) return onLoginRequest();
    const key = `${categoryId}::${driverId}`;
    setFollowedDriverIds(prev => prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]);
  }, [currentUser, onLoginRequest]);

  // Mantem a ordem de prioridade sincronizada com quem a pessoa segue: preserva
  // a ordem existente, remove quem deixou de ser seguido e adiciona no fim quem
  // passou a ser seguido (por qualquer caminho -- onboarding, botao de seguir, etc).
  React.useEffect(() => {
    if (!settingsLoaded) return;
    const validKeys = new Set([
      ...followedTeamIds.map(k => `team::${k}`),
      ...followedDriverIds.map(k => `driver::${k}`),
    ]);
    setPriorityFollowIds(prev => {
      const next = prev.filter(k => validKeys.has(k));
      const present = new Set(next);
      for (const k of validKeys) {
        if (!present.has(k)) next.push(k);
      }
      if (next.length === prev.length && next.every((v, i) => v === prev[i])) return prev;
      return next;
    });
  }, [followedTeamIds, followedDriverIds, settingsLoaded]);

  React.useEffect(() => {
    if (currentUser && settingsLoaded && !favoritesOnboarded) {
      setShowFavoritesOnboarding(true);
    }
  }, [currentUser, settingsLoaded, favoritesOnboarded]);

  const movePriorityFollow = useCallback((key: string, direction: -1 | 1) => {
    setPriorityFollowIds(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }, []);

  const dismissFavoritesOnboarding = useCallback(() => {
    setFavoritesOnboarded(true);
    setShowFavoritesOnboarding(false);
  }, []);

  const handleDismissIOSBanner = useCallback(() => {
    localStorage.setItem('pitstophub_ios_install_dismissed', '1');
    setShowIOSBanner(false);
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!deferredInstallPrompt) return;

    setInstallingApp(true);
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.error('Falha ao iniciar a instalacao do app.', error);
    } finally {
      setDeferredInstallPrompt(null);
      setInstallingApp(false);
    }
  }, [deferredInstallPrompt]);

  const nextUpcomingRace = useMemo(
    () => selectedCategory.calendar.find(race => race.status === 'upcoming') ?? null,
    [selectedCategory.calendar]
  );

  const lastCompletedRace = useMemo(
    () => [...selectedCategory.calendar].reverse().find(race => race.status === 'completed') ?? null,
    [selectedCategory.calendar]
  );

  const currentSeasonLabel = useMemo(
    () => liveCategoryData?.currentSeason || selectedCategory.calendar[0]?.date.slice(0, 4) || '2026',
    [liveCategoryData?.currentSeason, selectedCategory.calendar]
  );

  const seasonBadgeLabel = useMemo(
    () => currentSeasonLabel === '2026'
      ? UI_TRANSLATIONS[language].season2026
      : `${UI_TRANSLATIONS[language].seasonLabel} ${currentSeasonLabel}`,
    [currentSeasonLabel, language]
  );

  const championshipLeader = selectedCategory.standings?.drivers?.[0] ?? null;
  const constructorsLeader = selectedCategory.standings?.constructors?.[0] ?? selectedCategory.standings?.teams?.[0] ?? null;

  const [now, setNow] = useState(() => new Date());
  React.useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const heroNextRace = useMemo(() => {
    // Usuario logado com categorias/equipes/pilotos seguidos: mostra a proxima
    // corrida entre o que ele segue, em vez da proxima corrida de qualquer categoria.
    if (currentUser && upcomingFollowedRaces.length > 0) {
      return upcomingFollowedRaces[0];
    }
    return allCategories
      .flatMap((category) => category.calendar
        .filter((race) => race.status === 'upcoming')
        .map((race) => ({ category, race })))
      .sort((a, b) => a.race.date.localeCompare(b.race.date))[0] ?? null;
  }, [allCategories, currentUser, upcomingFollowedRaces]);

  const heroCountdownDays = useMemo(() => {
    if (!heroNextRace) return null;
    const raceDate = new Date(`${heroNextRace.race.date}T00:00:00`);
    const diffMs = raceDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [heroNextRace, now]);

  const heroCountdown = useMemo(() => {
    if (!heroNextRace) return null;
    const raceDate = new Date(`${heroNextRace.race.date}T00:00:00`);
    const diffMs = Math.max(0, raceDate.getTime() - now.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    return {
      days: Math.floor(totalMinutes / (60 * 24)),
      hours: Math.floor((totalMinutes % (60 * 24)) / 60),
      minutes: totalMinutes % 60,
    };
  }, [heroNextRace, now]);

  const selectedRaceCountdown = useMemo(() => {
    if (!selectedRace || selectedRace.status !== 'upcoming') return null;
    const raceDate = new Date(`${selectedRace.date}T00:00:00`);
    const diffMs = Math.max(0, raceDate.getTime() - now.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    return {
      days: Math.floor(totalMinutes / (60 * 24)),
      hours: Math.floor((totalMinutes % (60 * 24)) / 60),
      minutes: totalMinutes % 60,
    };
  }, [selectedRace, now]);

  const selectedRaceCircuitInfo = useMemo(() => {
    if (!selectedRace || selectedCategory.id !== 'f1') return null;
    return getRaceCircuitInfo(selectedRace);
  }, [selectedRace, selectedCategory.id]);

  // "Ultimo vencedor" e "lider do campeonato" sempre mostram a MESMA categoria entre si
  // (logado/seguindo ou não): busca a corrida concluida mais recente cuja categoria tambem
  // tenha classificacao (senao os dois cards nunca bateriam), preferindo categorias seguidas
  // quando o usuario estiver logado e seguindo algo.
  const hasStandingsData = (category: Category) =>
    (category.standings?.drivers?.length ?? 0) > 0 ||
    (category.standings?.constructors?.length ?? 0) > 0 ||
    (category.standings?.teams?.length ?? 0) > 0;

  const pickLastResultWithStandings = (categories: Category[]) =>
    categories
      .flatMap((category) => category.calendar
        .filter((race) => race.status === 'completed' && race.winner)
        .map((race) => ({ category, race })))
      .filter((item) => hasStandingsData(item.category))
      .sort((a, b) => b.race.date.localeCompare(a.race.date))[0] ?? null;

  const lastGlobalResult = useMemo(() => {
    if (currentUser && followedCategoryObjects.length > 0) {
      const followed = pickLastResultWithStandings(followedCategoryObjects);
      if (followed) return followed;
    }
    return pickLastResultWithStandings(allCategories);
  }, [allCategories, currentUser, followedCategoryObjects]);

  const overviewStats = useMemo(() => ({
    categories: allCategories.length,
    races: allCategories.reduce((sum, category) => sum + category.calendar.length, 0),
    teams: allCategories.reduce((sum, category) => sum + category.teams.length, 0),
  }), [allCategories]);

  const featuredLeader = useMemo(() => {
    // Sempre a mesma categoria do card "ultimo vencedor" (lastGlobalResult), que ja garante
    // que a categoria escolhida tem classificacao. Nem toda categoria tem por piloto (ex.:
    // IMSA so tem por equipe), entao cai pra construtores/equipes antes de desistir.
    const category = lastGlobalResult?.category;
    const entry = category?.standings?.drivers?.[0] ?? category?.standings?.constructors?.[0] ?? category?.standings?.teams?.[0] ?? null;
    return entry && category ? { entry, category } : null;
  }, [lastGlobalResult]);

  const teamClasses = useMemo(
    () => Array.from(new Set(selectedCategory.teams.map(team => team.class || 'Geral'))),
    [selectedCategory.teams]
  );

  const driversByTeamId = useMemo(() => {
    const map = new Map<string, (typeof selectedCategory.drivers)[number][]>();
    for (const driver of selectedCategory.drivers) {
      const list = map.get(driver.teamId) ?? [];
      list.push(driver);
      map.set(driver.teamId, list);
    }
    return map;
  }, [selectedCategory.drivers]);

  const driverByName = useMemo(
    () => new Map(selectedCategory.drivers.map(d => [d.name, d])),
    [selectedCategory.drivers]
  );

  // Destaques da aba Visao Geral (lider do campeonato, lider de construtores,
  // ultimo resultado) usam a cor da equipe de quem esta sendo mostrado, em vez
  // da cor fixa da categoria.
  const championshipLeaderTeam = championshipLeader
    ? selectedCategory.teams.find((t) => t.name === championshipLeader.team) ?? null
    : null;
  const constructorsLeaderTeam = constructorsLeader
    ? selectedCategory.teams.find((t) => t.name === constructorsLeader.name) ?? null
    : null;
  const lastRaceWinnerDriver = lastCompletedRace?.winner ? driverByName.get(lastCompletedRace.winner) ?? null : null;
  const lastRaceWinnerTeam = lastRaceWinnerDriver
    ? selectedCategory.teams.find((t) => t.id === lastRaceWinnerDriver.teamId) ?? null
    : null;

  const selectedDriverTeam = useMemo(
    () => (selectedDriver ? selectedCategory.teams.find((t) => t.id === selectedDriver.teamId) ?? null : null),
    [selectedCategory.teams, selectedDriver]
  );
  const selectedDriverBio = useMemo(
    () => (selectedDriver ? getDriverBio(selectedCategory.id, selectedDriver.id) : undefined),
    [selectedCategory.id, selectedDriver]
  );
  // Pagina de piloto usa a cor da equipe do piloto como destaque, nao a cor fixa da categoria.
  const driverAccent = selectedDriverTeam?.color ?? categoryAccent;
  // O menu FORMULAS/ENDURANCE do cabecalho normalmente usa o vermelho fixo da
  // marca, mas acompanha a cor de quem esta sendo visto: a cor da equipe numa
  // pagina de piloto, ou a cor da propria categoria em qualquer pagina dela
  // (visao geral, corrida). Fora disso (home, favoritos) fica no vermelho
  // padrao. Resto do cabecalho -- logo, botao de login -- continua vermelho
  // de proposito, e' identidade fixa do site.
  const navAccent =
    view === 'driver' && selectedDriver
      ? driverAccent
      : view === 'category' || view === 'race'
        ? categoryAccent
        : '#e8232a';

  const selectedDriverStanding = useMemo(
    () => (selectedDriver ? selectedCategory.standings?.drivers?.find((d) => d.name === selectedDriver.name) ?? null : null),
    [selectedCategory.standings, selectedDriver]
  );

  // Vitorias reais, contadas a partir de quem venceu cada corrida do calendario --
  // nao ha campo de "vitorias"/"podios" nos dados, entao so o que da pra derivar entra aqui.
  const selectedDriverWins = useMemo(() => {
    if (!selectedDriver) return [];
    return selectedCategory.calendar
      .filter((race) => race.winner === selectedDriver.name)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedCategory.calendar, selectedDriver]);

  const selectedDriverTeammates = useMemo(() => {
    if (!selectedDriver) return [];
    return (driversByTeamId.get(selectedDriver.teamId) ?? []).filter((d) => d.id !== selectedDriver.id);
  }, [driversByTeamId, selectedDriver]);

  // Vitorias e podios: quando temos resultados ao vivo (Jolpica, so F1 por enquanto),
  // usa eles (mais precisos); senao cai para a contagem derivada do calendario local.
  const selectedDriverWinsCount = useMemo(() => {
    if (driverSeasonResults) return driverSeasonResults.filter((r) => r.finishPosition === 1).length;
    return selectedDriverWins.length;
  }, [driverSeasonResults, selectedDriverWins]);

  const selectedDriverPodiumsCount = useMemo(() => {
    if (!driverSeasonResults) return null;
    return driverSeasonResults.filter((r) => r.finishPosition !== null && r.finishPosition <= 3).length;
  }, [driverSeasonResults]);

  const selectedDriverRecentResults = useMemo(() => {
    if (!driverSeasonResults) return [];
    return [...driverSeasonResults].sort((a, b) => Number(b.round) - Number(a.round)).slice(0, 5);
  }, [driverSeasonResults]);

  return (
    <div
      className="relative min-h-dvh flex flex-col xl:flex-row transition-colors duration-300 overflow-x-hidden"
      style={{ '--cat-accent': categoryAccent, '--cat-accent-ink': categoryAccentInk, '--nav-accent': navAccent } as React.CSSProperties}
    >
      {isDarkMode && (
        <>
          <div className="tg-glow tg-glow-red -left-32 -top-20 w-[420px] h-[420px] xl:w-[560px] xl:h-[560px] xl:-left-48 xl:-top-32" />
          <div className="tg-glow tg-glow-crimson -right-24 -bottom-32 w-[420px] h-[420px] xl:w-[600px] xl:h-[600px] xl:-right-40 xl:-bottom-52" />
        </>
      )}

      <aside className="hidden xl:flex xl:flex-col w-64 shrink-0 relative z-10 bg-[var(--sidebar-bg)] border-r border-[var(--card-border)] sticky top-0 h-dvh overflow-y-auto no-scrollbar">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-3 px-5 py-6 shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-red flex items-center justify-center shrink-0">
            <span className="text-white font-apex font-extrabold italic text-lg">P</span>
          </div>
          <span className="text-lg font-apex font-extrabold italic tracking-tighter text-[var(--text-main)]">PitStopHub</span>
        </button>

        <nav className="flex-1 flex flex-col px-3 pb-4">
          <button
            onClick={() => setView('home')}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-apex-mono text-xs font-semibold uppercase tracking-wide transition-colors text-left",
              view === 'home' ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : "text-gray-500 hover:bg-white/5 hover:text-[var(--text-main)]"
            )}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="flex-1">{UI_TRANSLATIONS[language].home}</span>
          </button>

          {NAV_GROUPS.map((group) => (
            <div key={group.name.en} className="mt-4">
              <div className="px-3 pb-1.5 font-apex-mono text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {language === 'pt' ? group.name.pt : group.name.en}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.ids.map((id) => {
                  const cat = allCategoriesById.get(id);
                  if (!cat) return null;
                  const Icon = IconMap[cat.icon];
                  const active = (view === 'category' || view === 'driver' || view === 'race') && selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                        active
                          ? "bg-[#1d1d21] text-[var(--nav-accent)] border border-[var(--card-border)]"
                          : "text-gray-500 border border-transparent hover:bg-white/5 hover:text-[var(--text-main)]"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{language === 'pt' ? cat.name : (cat.enFullName || cat.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {currentUser && (
            <button
              onClick={() => { setView('favorites'); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' })); }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-apex-mono text-xs font-semibold uppercase tracking-wide transition-colors text-left mt-4",
                view === 'favorites'
                  ? "bg-brand-red/10 text-brand-red border border-brand-red/30"
                  : "text-gray-500 border border-transparent hover:bg-white/5 hover:text-[var(--text-main)]"
              )}
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span className="flex-1">{UI_TRANSLATIONS[language].favorites}</span>
            </button>
          )}
        </nav>

        <div className="mt-auto shrink-0 px-3 pb-5 pt-3 border-t border-[var(--card-border)]">
          {currentUser ? (
            <div className="flex items-center gap-2.5 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-brand-red flex items-center justify-center text-white text-xs font-black shrink-0 select-none">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[var(--text-main)] truncate">{currentUser.name}</div>
                <div className="text-[10px] text-gray-500 truncate">{currentUser.email}</div>
              </div>
              <button
                onClick={onLogout}
                aria-label={UI_TRANSLATIONS[language].logout}
                className="shrink-0 p-1.5 rounded-md text-gray-500 hover:text-brand-red hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginRequest}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-brand-red text-white font-apex-mono text-xs font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              {UI_TRANSLATIONS[language].login}
            </button>
          )}
        </div>
      </aside>

      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
      <header className="pt-safe sticky top-0 z-50 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">

          <button
            onClick={() => setView('home')}
            className="shrink-0 flex items-center hover:opacity-80 transition-opacity xl:hidden"
          >
            <span className="text-xl sm:text-2xl font-apex font-extrabold italic tracking-tighter text-[var(--text-main)]">
              PitStopHub
            </span>
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-1">
            <button
              onClick={() => setView('home')}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full font-apex-mono text-xs font-semibold uppercase tracking-wide transition-all whitespace-nowrap",
                view === 'home' ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : "text-gray-500 hover:text-brand-red"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              {UI_TRANSLATIONS[language].home}
            </button>

            <div className="w-px h-5 bg-[var(--card-border)] mx-3 shrink-0" />

            {NAV_GROUPS.map((group) => (
              <div
                key={group.name.en}
                className="relative"
                onMouseEnter={() => setActiveDropdown(group.name.en)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 font-apex-mono text-xs font-semibold uppercase tracking-wide transition-colors hover:text-[var(--nav-accent)] whitespace-nowrap",
                    group.ids.includes(selectedCategory.id) && (view === 'category' || view === 'driver') ? "text-[var(--nav-accent)]" : "text-gray-500"
                  )}
                >
                  {language === 'pt' ? group.name.pt : group.name.en}
                  <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", activeDropdown === group.name.en && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {activeDropdown === group.name.en && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
 className="absolute top-full left-0 mt-2 w-48 z-[200] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-2xl py-2"
                    >
                      {group.ids.map(id => {
                        const cat = allCategoriesById.get(id);
                        if (!cat) return null;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat)}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-[var(--nav-accent)] hover:text-white",
                              (view === 'category' || view === 'driver') && selectedCategory.id === cat.id ? "text-[var(--nav-accent)] bg-[var(--nav-accent)]/5" : "text-gray-500"
                            )}
                          >
                            {language === 'pt' ? cat.name : (cat.enFullName || cat.name)}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            {deferredInstallPrompt && (
              <button
                onClick={() => { void handleInstallApp(); }}
                disabled={installingApp}
 className="hidden md:flex px-4 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] font-apex-mono text-xs font-semibold uppercase tracking-wide text-[var(--text-main)] hover:text-brand-red transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {installingApp ? UI_TRANSLATIONS[language].installingApp : UI_TRANSLATIONS[language].installApp}
              </button>
            )}
            {currentUser ? (
              <div className="hidden xl:flex items-center gap-2">
                <button
                  onClick={() => { setView('favorites'); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' })); }}
                  aria-label={UI_TRANSLATIONS[language].favorites}
                  className={cn(
                    "p-2.5 border transition-colors",
                    view === 'favorites'
                      ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                      : "bg-[var(--card-bg)] border-[var(--card-border)] text-gray-500 hover:text-brand-red"
                  )}
                >
                  <Heart className="w-4 h-4" />
                </button>
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <div className="w-6 h-6 rounded-full bg-brand-red flex items-center justify-center text-white text-[10px] font-black shrink-0 select-none">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-main)] max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={onLogout}
 className="px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] font-apex-mono text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-red transition-colors whitespace-nowrap"
                >
                  {UI_TRANSLATIONS[language].logout}
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginRequest}
 className="hidden xl:flex px-4 py-2 rounded-lg bg-brand-red text-white font-apex-mono text-xs font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {UI_TRANSLATIONS[language].login}
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 className="xl:hidden p-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] hover:scale-110 transition-all shadow-sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_SOFT}
              className="xl:hidden border-t border-[var(--card-border)] overflow-hidden"
            >
              <div className="bg-[var(--header-bg)] px-4 py-6 space-y-6 max-h-[80dvh] overflow-y-auto no-scrollbar">
                {currentUser ? (
 <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white text-sm font-black shrink-0 select-none">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--text-main)] truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
 className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-brand-red transition-colors shrink-0 ml-3"
                    >
                      {UI_TRANSLATIONS[language].logout}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { onLoginRequest(); setIsMobileMenuOpen(false); }}
 className="w-full flex items-center justify-center gap-2 p-4 rounded-lg bg-brand-red text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-red/20 active:scale-95 transition-transform"
                  >
                    {UI_TRANSLATIONS[language].login}
                  </button>
                )}

                {currentUser && (
                  <button
                    onClick={() => { setView('favorites'); setIsMobileMenuOpen(false); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' })); }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 p-4  text-xs font-black uppercase tracking-widest transition-all border",
                      view === 'favorites'
                        ? "bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20"
                        : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)]"
                    )}
                  >
                    <Heart className="w-4 h-4" />
                    {UI_TRANSLATIONS[language].favorites}
                  </button>
                )}

                {deferredInstallPrompt && (
                  <button
                    onClick={() => { void handleInstallApp(); setIsMobileMenuOpen(false); }}
                    disabled={installingApp}
 className="w-full flex items-center justify-center gap-2 p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] text-sm font-black uppercase tracking-widest disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    {installingApp ? UI_TRANSLATIONS[language].installingApp : UI_TRANSLATIONS[language].installApp}
                  </button>
                )}

                <button
                  onClick={() => { setView('home'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-4  text-xs font-black uppercase tracking-widest transition-all border",
                    view === 'home'
                      ? "bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20"
                      : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10"
                  )}
                >
                  <LayoutGrid className="w-5 h-5" />
                  {UI_TRANSLATIONS[language].home}
                </button>

                <div className="space-y-6">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.name.en} className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--card-border)]" />
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] shrink-0",
                            group.ids.includes(selectedCategory.id) && (view === 'category' || view === 'driver') ? "text-[var(--nav-accent)]" : "text-brand-red"
                          )}
                        >
                          {language === 'pt' ? group.name.pt : group.name.en}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--card-border)]" />
                      </div>
                      <div className="space-y-2">
                        {group.ids.map(id => {
                          const cat = allCategoriesById.get(id);
                          if (!cat) return null;
                          const Icon = IconMap[cat.icon];
                          return (
                            <button
                              key={cat.id}
                              onClick={() => { handleCategorySelect(cat); setIsMobileMenuOpen(false); }}
                              className={cn(
                                "w-full flex items-center justify-between px-5 py-4  text-sm font-bold uppercase tracking-widest transition-all border",
                                (view === 'category' || view === 'driver') && selectedCategory.id === cat.id
                                  ? "bg-[var(--nav-accent)]/10 text-[var(--nav-accent)] border-[var(--nav-accent)]/20"
                                  : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8  flex items-center justify-center shrink-0",
                                  (view === 'category' || view === 'driver') && selectedCategory.id === cat.id ? "bg-[var(--nav-accent)] text-white" : "bg-white/10 text-gray-500"
                                )}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {language === 'pt' ? cat.name : (cat.enFullName || cat.name)}
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home-page"
              className="relative min-h-full overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING}
            >
              <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="hero-bg-lines absolute inset-0" />
                <motion.div
                  className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[60px] bg-brand-red/20"
                  animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full blur-[65px] bg-blue-500/10"
                  animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
                  transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
              </div>

              <motion.section
                key="home-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-20"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING}
                  className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] mb-10 sm:mb-16"
                >
                  <div className="relative p-8 sm:p-12 md:p-16">
                    {heroNextRace ? (
                      <>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-brand-red text-brand-red px-3 py-1 font-apex-mono text-[11px] font-semibold uppercase tracking-widest mb-6">
                          <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
                          {UI_TRANSLATIONS[language].upNext}
                        </div>
                        <h1 className="font-apex text-4xl sm:text-6xl md:text-7xl font-extrabold italic uppercase tracking-tight text-[var(--text-main)] leading-[0.95] mb-3">
                          {language === 'pt' ? heroNextRace.race.name : (heroNextRace.race.enName || heroNextRace.race.name)}
                        </h1>
                        <p className="font-apex text-lg sm:text-2xl italic uppercase text-gray-500 mb-10">
                          {language === 'pt' ? heroNextRace.race.location : (heroNextRace.race.enLocation || heroNextRace.race.location)}
                        </p>
                        <div className="flex flex-wrap items-end gap-8">
                          <div className="flex gap-3">
                            {[
                              { value: heroCountdown?.days ?? 0, label: UI_TRANSLATIONS[language].daysLabel },
                              { value: heroCountdown?.hours ?? 0, label: UI_TRANSLATIONS[language].hoursLabel },
                              { value: heroCountdown?.minutes ?? 0, label: UI_TRANSLATIONS[language].minsLabel },
                            ].map((unit) => (
                              <div key={unit.label} className="rounded-xl border border-[var(--card-border)] bg-black/20 w-20 text-center py-3">
                                <span className="block font-apex text-3xl font-extrabold text-[var(--text-main)] mb-1">
                                  {String(unit.value).padStart(2, '0')}
                                </span>
                                <span className="font-apex-mono text-[10px] text-gray-500 uppercase tracking-widest">
                                  {unit.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: getCategoryAccent(heroNextRace.category.id) }}
                            >
                              {React.createElement(IconMap[heroNextRace.category.icon] ?? Trophy, { className: 'text-white w-5 h-5' })}
                            </div>
                            <div>
                              <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                                {language === 'pt' ? heroNextRace.category.name : (heroNextRace.category.enFullName || heroNextRace.category.name)}
                              </div>
                              <div className="font-apex-mono text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">
                                {heroNextRace.race.date.split('-').reverse().join('/')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-10">
                          <button
                            onClick={() => { handleCategorySelect(heroNextRace.category); setActiveTab('calendar'); }}
                            className="px-6 py-3 rounded-lg bg-brand-red text-white font-apex-mono text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                          >
                            {UI_TRANSLATIONS[language].viewCalendar}
                          </button>
                          <button
                            onClick={() => { handleCategorySelect(heroNextRace.category); setActiveTab('teams'); }}
                            className="px-6 py-3 rounded-lg bg-[var(--bg-main)] border border-[var(--card-border)] text-[var(--text-main)] font-apex-mono text-xs font-bold uppercase tracking-widest hover:border-brand-red hover:text-brand-red transition-colors"
                          >
                            {UI_TRANSLATIONS[language].teams}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="font-apex text-4xl sm:text-6xl md:text-7xl font-extrabold italic uppercase tracking-tight text-[var(--text-main)] mb-3">
                          PitStopHub
                        </h1>
                        <p className="text-gray-500 max-w-2xl text-lg">{UI_TRANSLATIONS[language].tagline}</p>
                      </>
                    )}
                  </div>
                </motion.div>

                <div className="mb-10 sm:mb-16">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-apex-mono text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 whitespace-nowrap">
                      {UI_TRANSLATIONS[language].featuredTitle}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--card-border)] to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="apex-card p-6">
                      <div className="flex items-center gap-2 mb-4 text-brand-red">
                        <Trophy className="w-4 h-4" />
                        <span className="font-apex-mono text-[10px] font-semibold uppercase tracking-widest">
                          {UI_TRANSLATIONS[language].championshipLeader}
                        </span>
                      </div>
                      <div className="font-apex text-2xl font-extrabold italic text-[var(--text-main)] mb-1 truncate">
                        {featuredLeader?.entry.name || '--'}
                      </div>
                      <div className="font-apex-mono text-xs text-gray-500 uppercase tracking-widest font-medium truncate">
                        {featuredLeader ? `${featuredLeader.entry.team ?? (language === 'pt' ? featuredLeader.category.name : (featuredLeader.category.enFullName || featuredLeader.category.name))} • ${featuredLeader.entry.points} ${UI_TRANSLATIONS[language].points}` : UI_TRANSLATIONS[language].notAvailableShort}
                      </div>
                    </div>

                    <div className="apex-card p-6">
                      <div className="flex items-center gap-2 mb-4 text-brand-red">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-apex-mono text-[10px] font-semibold uppercase tracking-widest">
                          {UI_TRANSLATIONS[language].latestWinner}
                        </span>
                      </div>
                      <div className="font-apex text-2xl font-extrabold italic text-[var(--text-main)] mb-1 truncate">
                        {lastGlobalResult?.race.winner || '--'}
                      </div>
                      <div className="font-apex-mono text-xs text-gray-500 uppercase tracking-widest font-medium truncate">
                        {lastGlobalResult
                          ? `${lastGlobalResult.category.name} • ${language === 'pt' ? lastGlobalResult.race.name : (lastGlobalResult.race.enName || lastGlobalResult.race.name)}`
                          : UI_TRANSLATIONS[language].notAvailableShort}
                      </div>
                    </div>

                    <div className="apex-card p-6">
                      <div className="flex items-center gap-2 mb-4 text-brand-red">
                        <LayoutGrid className="w-4 h-4" />
                        <span className="font-apex-mono text-[10px] font-semibold uppercase tracking-widest">
                          {UI_TRANSLATIONS[language].seasonPanorama}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-apex text-xl font-extrabold italic text-[var(--text-main)]">{overviewStats.categories}</div>
                          <div className="font-apex-mono text-[9px] text-gray-500 uppercase tracking-widest font-medium">{UI_TRANSLATIONS[language].categoriesLabel}</div>
                        </div>
                        <div>
                          <div className="font-apex text-xl font-extrabold italic text-[var(--text-main)]">{overviewStats.races}</div>
                          <div className="font-apex-mono text-[9px] text-gray-500 uppercase tracking-widest font-medium">{UI_TRANSLATIONS[language].racesInSeason}</div>
                        </div>
                        <div>
                          <div className="font-apex text-xl font-extrabold italic text-[var(--text-main)]">{overviewStats.teams}</div>
                          <div className="font-apex-mono text-[9px] text-gray-500 uppercase tracking-widest font-medium">{UI_TRANSLATIONS[language].teams}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-16">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
                    {NAV_GROUPS.map((group) => {
                      const isActiveGroup = activeHomeGroup === group.name.en;
                      return (
                        <button
                          key={group.name.en}
                          onClick={() => setActiveHomeGroup(group.name.en)}
                          className={cn(
                            "px-4 py-2 rounded-lg font-apex-mono text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
                            isActiveGroup
                              ? "bg-brand-red text-white border-brand-red"
                              : "bg-[var(--card-bg)] text-gray-500 border-[var(--card-border)] hover:text-brand-red"
                          )}
                        >
                          {language === 'pt' ? group.name.pt : group.name.en}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
                    <AnimatePresence mode="wait">
                      <motion.section
                        key={activeHomeGroup}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING}
                        className="apex-card overflow-hidden"
                      >
                        <div className="px-6 py-5 border-b border-[var(--card-border)]">
                          <h2 className="font-apex text-lg font-extrabold italic text-[var(--text-main)]">
                            {UI_TRANSLATIONS[language].featuredRaces}
                          </h2>
                        </div>
                        <div className="hidden md:grid grid-cols-[44px_1fr_1fr_96px] gap-4 px-6 py-3 border-b border-[var(--card-border)] font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                          <div>#</div>
                          <div>{UI_TRANSLATIONS[language].raceLabel}</div>
                          <div>{UI_TRANSLATIONS[language].circuit}</div>
                          <div className="text-right">{UI_TRANSLATIONS[language].date}</div>
                        </div>
                        <div>
                          {(NAV_GROUPS.find((group) => group.name.en === activeHomeGroup) ?? NAV_GROUPS[0]).ids
                            .flatMap((id) => {
                              const cat = allCategoriesById.get(id);
                              if (!cat) return [];
                              return cat.calendar
                                .filter((race) => race.status === 'upcoming')
                                .map((race) => ({ category: cat, race }));
                            })
                            .sort((a, b) => a.race.date.localeCompare(b.race.date))
                            .slice(0, 6)
                            .map(({ category, race }, index) => {
                              const isRacePageTest = hasCircuitPage(category, race);
                              const statusLabel = race.status === 'upcoming'
                                ? UI_TRANSLATIONS[language].upcoming
                                : race.status === 'cancelled'
                                  ? UI_TRANSLATIONS[language].cancelled
                                  : UI_TRANSLATIONS[language].completed;
                              const accent = getCategoryAccent(category.id);
                              return (
                                <div
                                  key={`${category.id}-${race.id}`}
                                  onClick={() => {
                                    if (isRacePageTest) {
                                      setSelectedCategoryBase(category);
                                      setSelectedRace(race);
                                      setView('race');
                                    } else {
                                      handleCategorySelect(category);
                                      setActiveTab('calendar');
                                    }
                                  }}
                                  className="flex flex-col md:grid md:grid-cols-[44px_1fr_1fr_96px] gap-2 md:gap-4 md:items-center px-6 py-4 border-b border-[var(--card-border)] last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                  <div className="hidden md:block font-apex-mono text-xs text-gray-500">
                                    {String(index + 1).padStart(2, '0')}
                                  </div>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-[3px] h-6 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-[var(--text-main)] truncate">
                                        {language === 'pt' ? race.name : (race.enName || race.name)}
                                      </div>
                                      <div className="font-apex-mono text-[10px] text-gray-500 uppercase tracking-widest truncate">
                                        {language === 'pt' ? category.name : (category.enFullName || category.name)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-gray-400 truncate">
                                      {language === 'pt' ? race.location : (race.enLocation || race.location)}
                                    </span>
                                    <span
                                      className={cn(
                                        "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        race.status === 'upcoming' ? "bg-brand-red/15 text-brand-red" :
                                        race.status === 'cancelled' ? "bg-white/5 text-gray-500" :
                                        "bg-emerald-500/15 text-emerald-400"
                                      )}
                                    >
                                      {statusLabel}
                                    </span>
                                  </div>
                                  <div className="font-apex-mono text-xs text-gray-500 md:text-right">
                                    {race.date.split('-').slice(1).reverse().join('/')}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </motion.section>
                    </AnimatePresence>

                    <div className="flex flex-col gap-6">
                      <div className="apex-card p-6">
                        <h2 className="font-apex text-base font-extrabold italic text-[var(--text-main)] mb-5">
                          {UI_TRANSLATIONS[language].championshipLeaders}
                        </h2>
                        {(() => {
                          if (!lastGlobalResult) {
                            return <p className="text-xs text-gray-500">{UI_TRANSLATIONS[language].notAvailableShort}</p>;
                          }
                          const leaderCategory = lastGlobalResult.category;
                          const board = leaderCategory.standings?.drivers
                            ?? leaderCategory.standings?.constructors
                            ?? leaderCategory.standings?.teams
                            ?? [];
                          if (board.length === 0) {
                            return <p className="text-xs text-gray-500">{UI_TRANSLATIONS[language].notAvailableShort}</p>;
                          }
                          const maxPoints = board[0].points || 1;
                          return (
                            <div className="space-y-4">
                              {board.slice(0, 5).map((entry) => (
                                <div key={`${entry.position}-${entry.name}`} className="flex items-center gap-3">
                                  <div className="font-apex-mono text-xs text-gray-500 w-4 shrink-0">{entry.position}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-[var(--text-main)] truncate">{entry.name}</div>
                                    {entry.team && <div className="text-[10px] text-gray-500 truncate">{entry.team}</div>}
                                    <div className="h-1 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${Math.round((entry.points / maxPoints) * 100)}%`,
                                          backgroundColor: getCategoryAccent(leaderCategory.id),
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-bold text-[var(--text-main)]">{entry.points}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {lastGlobalResult && (
                          <button
                            onClick={() => { handleCategorySelect(lastGlobalResult.category); setActiveTab('standings'); }}
                            className="mt-5 w-full px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--card-border)] rounded-lg font-apex-mono text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-red transition-colors"
                          >
                            {UI_TRANSLATIONS[language].standings}
                          </button>
                        )}
                      </div>

                      <div className="apex-card p-6">
                        <h2 className="font-apex text-base font-extrabold italic text-[var(--text-main)] mb-4">
                          {UI_TRANSLATIONS[language].categoriesLabel}
                        </h2>
                        <div className="space-y-1">
                          {(NAV_GROUPS.find((group) => group.name.en === activeHomeGroup) ?? NAV_GROUPS[0]).ids.map((id) => {
                            const cat = allCategoriesById.get(id);
                            if (!cat) return null;
                            const Icon = IconMap[cat.icon];
                            const accent = getCategoryAccent(cat.id);
                            const isFollowed = followedCategorySet.has(cat.id);
                            return (
                              <div
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCategorySelect(cat);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                className="group flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
                                  <Icon className="text-white w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-[var(--text-main)] truncate">
                                    {language === 'pt' ? cat.name : (cat.enFullName || cat.name)}
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate">
                                    {cat.teams.length} {UI_TRANSLATIONS[language].teams} · {cat.calendar.length} {UI_TRANSLATIONS[language].rounds}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFollowCategory(cat.id); }}
                                  className={cn("p-1 rounded-full transition-colors shrink-0", isFollowed ? "text-brand-red" : "text-gray-600 hover:text-brand-red")}
                                  title={isFollowed ? UI_TRANSLATIONS[language].followingCategory : UI_TRANSLATIONS[language].followCategory}
                                >
                                  <Heart className={cn("w-3.5 h-3.5", isFollowed && "fill-brand-red")} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </motion.section>
          </motion.div>
        ) : view === 'race' && selectedRace ? (
          <motion.div
            key="race-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
          >
            <section className="relative py-12 md:py-20 overflow-hidden min-h-[70dvh]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--cat-accent)]/20 to-transparent" />
              </div>

              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                  onClick={() => { setView('category'); setActiveTab('calendar'); setSelectedRace(null); }}
                  className="inline-flex items-center gap-2 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[var(--cat-accent)] transition-colors mb-10"
                >
                  <ChevronLeft className="w-4 h-4" /> {UI_TRANSLATIONS[language].calendar}
                </button>

                <p className="font-apex-mono text-xs font-semibold uppercase tracking-widest text-[var(--cat-accent)] flex items-center gap-2 mb-4">
                  <span className="w-8 h-[2px] bg-[var(--cat-accent)] inline-block" />
                  {UI_TRANSLATIONS[language].roundLabel} {selectedCategory.calendar.findIndex((r) => r.id === selectedRace.id) + 1}
                </p>
                <h1 className="font-apex font-extrabold italic uppercase text-5xl sm:text-7xl md:text-8xl tracking-tighter text-[var(--text-main)] leading-[0.92] mb-4">
                  {selectedRace.circuit}
                </h1>
                <p className="text-xl sm:text-2xl text-gray-400 font-medium mb-10">
                  {language === 'pt' ? selectedRace.name : (selectedRace.enName || selectedRace.name)}
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-12">
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1",
                    selectedRace.status === 'completed' ? "bg-gray-800 text-gray-400" :
                    selectedRace.status === 'cancelled' ? "bg-red-900/50 text-red-400" :
                    "bg-[var(--cat-accent)] text-[var(--cat-accent-ink)]"
                  )}>
                    {selectedRace.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {selectedRace.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                    {selectedRace.status === 'upcoming' && <Timer className="w-3 h-3" />}
                    {UI_TRANSLATIONS[language][selectedRace.status]}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 font-apex-mono">
                    <Calendar className="w-4 h-4" />
                    {new Date(`${selectedRace.date}T00:00:00`).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 font-apex-mono">
                    <MapPin className="w-4 h-4" />
                    {language === 'pt' ? selectedRace.location : (selectedRace.enLocation || selectedRace.location)}
                  </span>
                </div>

                {selectedRace.status === 'upcoming' && selectedRaceCountdown && (
                  <div className="flex gap-4 max-w-md">
                    {[
                      { value: selectedRaceCountdown.days, label: UI_TRANSLATIONS[language].daysLabel },
                      { value: selectedRaceCountdown.hours, label: UI_TRANSLATIONS[language].hoursLabel },
                      { value: selectedRaceCountdown.minutes, label: UI_TRANSLATIONS[language].minsLabel },
                    ].map((item) => (
                      <div key={item.label} className="apex-card flex-1 text-center py-6">
                        <div className="font-apex text-4xl font-extrabold text-[var(--text-main)] mb-1">
                          {String(item.value).padStart(2, '0')}
                        </div>
                        <div className="font-apex-mono text-[10px] text-gray-500 uppercase tracking-widest">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRace.status === 'completed' && selectedRace.winner && (
                  <div className="apex-card p-8 flex items-center gap-6 max-w-md">
                    {(driverByName.get(selectedRace.winner)?.cutout || driverByName.get(selectedRace.winner)?.image) && (
                      <img
                        src={driverByName.get(selectedRace.winner)!.cutout || driverByName.get(selectedRace.winner)!.image}
                        alt={selectedRace.winner}
                        className="w-20 h-20 rounded-full object-cover object-top border-2 border-yellow-500/50"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div>
                      <p className="font-apex-mono text-[10px] uppercase tracking-widest text-yellow-500 mb-1 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> {UI_TRANSLATIONS[language].winner}
                      </p>
                      <p className="font-apex font-extrabold italic text-3xl text-[var(--text-main)]">
                        {selectedRace.winner}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRaceCircuitInfo && (
                  <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 apex-card p-8">
                      <h3 className="font-apex font-extrabold italic uppercase text-xl text-[var(--text-main)] mb-6 flex items-center gap-2">
                        <Route className="w-5 h-5 text-[var(--cat-accent)]" />
                        {UI_TRANSLATIONS[language].trackLayout}
                      </h3>
                      {selectedRaceCircuitInfo.trackImage && (
                        <div className="mb-6 bg-black/20 border border-white/5 p-4">
                          <img
                            src={selectedRaceCircuitInfo.trackImage}
                            alt={selectedRace.circuit}
                            className="w-full h-auto"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {selectedRaceCircuitInfo.drsZones.map((zone, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-white/5 text-xs font-apex-mono text-gray-400">
                            <Zap className="w-3.5 h-3.5 text-[var(--cat-accent)]" />
                            {UI_TRANSLATIONS[language].drsZones} {index + 1} — {language === 'pt' ? zone.pt : zone.en}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="apex-card p-8">
                      <h3 className="font-apex font-extrabold italic uppercase text-xl text-[var(--text-main)] mb-6">
                        {UI_TRANSLATIONS[language].trackSpecs}
                      </h3>
                      <dl className="space-y-3">
                        {[
                          [UI_TRANSLATIONS[language].circuitLength, `${selectedRaceCircuitInfo.lengthKm.toFixed(3)} km`],
                          [UI_TRANSLATIONS[language].raceDistance, `${selectedRaceCircuitInfo.raceDistanceKm.toFixed(3)} km`],
                          [UI_TRANSLATIONS[language].laps, String(selectedRaceCircuitInfo.laps)],
                          [UI_TRANSLATIONS[language].corners, String(selectedRaceCircuitInfo.corners)],
                          [UI_TRANSLATIONS[language].direction, selectedRaceCircuitInfo.direction === 'clockwise' ? UI_TRANSLATIONS[language].clockwise : UI_TRANSLATIONS[language].counterclockwise],
                          [
                            UI_TRANSLATIONS[language].lapRecord,
                            selectedRaceCircuitInfo.lapRecord
                              ? `${selectedRaceCircuitInfo.lapRecord.time} — ${selectedRaceCircuitInfo.lapRecord.driver} (${selectedRaceCircuitInfo.lapRecord.year})`
                              : UI_TRANSLATIONS[language].lapRecordPending,
                          ],
                          [UI_TRANSLATIONS[language].firstGrandPrix, String(selectedRaceCircuitInfo.firstGrandPrix)],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between border-b border-white/5 pb-3 gap-4">
                            <dt className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">{label}</dt>
                            <dd className="text-sm font-bold text-[var(--text-main)] text-right">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="lg:col-span-3 apex-card p-8">
                      <h3 className="font-apex font-extrabold italic uppercase text-xl text-[var(--text-main)] mb-4">
                        {UI_TRANSLATIONS[language].tyreStrategy}
                      </h3>
                      <p className="text-gray-400 leading-relaxed max-w-3xl">
                        {language === 'pt' ? selectedRaceCircuitInfo.tyreStrategyNote.pt : selectedRaceCircuitInfo.tyreStrategyNote.en}
                      </p>
                    </div>

                    <div className="lg:col-span-3 apex-card p-8">
                      <h3 className="font-apex font-extrabold italic uppercase text-xl text-[var(--text-main)] mb-6">
                        {UI_TRANSLATIONS[language].criticalBrakingZones}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-8">
                        {selectedRaceCircuitInfo.brakingZones.map((zone) => (
                          <div key={zone.turn} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-apex font-extrabold italic text-lg text-[var(--text-main)]">
                                {zone.turn} <span className="font-apex-mono text-xs text-gray-500 font-normal not-italic">"{zone.name}"</span>
                              </h4>
                              <AlertTriangle className="w-4 h-4 text-[var(--cat-accent)]" />
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                              {language === 'pt' ? zone.pt : zone.en}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="lg:col-span-3 text-[11px] text-gray-600 font-apex-mono">
                      {UI_TRANSLATIONS[language].dataSourceNote}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        ) : view === 'driver' && selectedDriver ? (
          <motion.div
            key="driver-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
          >
            <section
              className="relative py-12 md:py-20 overflow-hidden min-h-[70dvh]"
              style={{ '--driver-accent': driverAccent } as React.CSSProperties}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--driver-accent)]/20 to-transparent" />
              </div>

              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                  onClick={() => { setView('category'); setActiveTab('standings'); setSelectedDriver(null); }}
                  className="inline-flex items-center gap-2 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-[var(--driver-accent)] transition-colors mb-10"
                >
                  <ChevronLeft className="w-4 h-4" /> {UI_TRANSLATIONS[language].standings}
                </button>

                {/* items-start: sem isso, o grid estica os dois cards da linha pra terem a
                    mesma altura (padrao do CSS Grid), e como o painel de carreira/bio a
                    direita costuma ser mais alto que o card da foto, a foto era esticada e
                    empurrada pro fundo pelo justify-between, abrindo um vao vazio enorme. */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-start">
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className={cn(
                    "apex-card relative overflow-hidden min-h-[420px] flex flex-col",
                    selectedDriver.cutout ? "justify-between" : "justify-end"
                  )}>
                    {selectedDriver.cutout ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--driver-accent)]/20 via-transparent to-black/60" />
                        <div
                          className="absolute left-1/2 bottom-0 w-64 h-64 -translate-x-1/2 translate-y-1/4 rounded-full blur-3xl opacity-30"
                          style={{ backgroundColor: driverAccent }}
                        />
                      </>
                    ) : selectedDriver.image && (
                      <img
                        src={selectedDriver.image}
                        alt={selectedDriver.name}
                        className="absolute inset-0 w-full h-full object-cover object-top opacity-80"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    {!selectedDriver.cutout && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    )}
                    <div className="relative z-10 p-8">
                      <div className="flex items-center gap-3 mb-3">
                        {selectedDriverTeam && (
                          <span className="text-[var(--driver-accent)] font-apex-mono text-xs font-semibold border border-[var(--driver-accent)] px-2 py-1 uppercase">
                            {selectedDriverTeam.name}
                          </span>
                        )}
                        <span className="font-apex-mono text-xs text-gray-300">#{selectedDriver.number}</span>
                      </div>
                      <h1 className="font-apex font-extrabold italic uppercase text-4xl sm:text-5xl leading-[0.95] text-white">
                        {selectedDriver.name.split(' ').slice(0, -1).join(' ')}
                        <br />
                        <span className="text-[var(--driver-accent)]">{selectedDriver.name.split(' ').slice(-1)}</span>
                      </h1>
                      <p className="font-apex-mono text-xs uppercase tracking-widest text-gray-300 mt-4">
                        {selectedDriver.nationality}
                      </p>
                    </div>
                    {selectedDriver.cutout && (
                      <img
                        src={selectedDriver.cutout}
                        alt={selectedDriver.name}
                        className="relative z-10 mx-auto max-h-[300px] w-auto object-contain drop-shadow-2xl"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                      />
                    )}
                  </div>

                  {selectedDriverTeammates.length > 0 && (
                    <div className="apex-card p-5">
                      <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-4">
                        {UI_TRANSLATIONS[language].teammate}
                      </div>
                      <div className="flex flex-col gap-2">
                        {selectedDriverTeammates.map((t) => {
                          const canOpenTeammate = Boolean(getDriverBio(selectedCategory.id, t.id));
                          const teammatePhoto = t.cutout || t.image;
                          const content = (
                            <>
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-black/30 shrink-0">
                                {teammatePhoto && (
                                  <img
                                    src={teammatePhoto}
                                    alt={t.name}
                                    className="w-full h-full object-cover object-top"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-apex font-extrabold italic text-[var(--text-main)] leading-tight">{t.name}</div>
                                <div className="font-apex-mono text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">#{t.number}</div>
                              </div>
                            </>
                          );
                          return canOpenTeammate ? (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => { setSelectedDriver(t); setView('driver'); }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--driver-accent)]/40 transition-colors text-left group/teammate"
                            >
                              {content}
                              <ChevronRight className="w-4 h-4 text-[var(--driver-accent)] ml-auto shrink-0 opacity-0 group-hover/teammate:opacity-100 group-hover/teammate:translate-x-1 transition-all" />
                            </button>
                          ) : (
                            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                              {content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="apex-card p-4">
                        <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                          {UI_TRANSLATIONS[language].position}
                        </div>
                        <div className="font-apex text-3xl font-extrabold text-[var(--text-main)] mt-1">
                          {selectedDriverStanding ? (
                            <>
                              {formatOrdinal(selectedDriverStanding.position, language).number}
                              <span className="text-[var(--driver-accent)] text-base align-top">
                                {formatOrdinal(selectedDriverStanding.position, language).suffix}
                              </span>
                            </>
                          ) : '-'}
                        </div>
                      </div>
                      <div className="apex-card p-4">
                        <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                          {UI_TRANSLATIONS[language].points}
                        </div>
                        <div className="font-apex text-3xl font-extrabold text-[var(--text-main)] mt-1">
                          {selectedDriverStanding?.points ?? '-'}
                        </div>
                      </div>
                      <div className="apex-card p-4">
                        <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                          {UI_TRANSLATIONS[language].wins}
                        </div>
                        <div className="font-apex text-3xl font-extrabold text-[var(--text-main)] mt-1">
                          {selectedDriverWinsCount}
                        </div>
                      </div>
                      <div className="apex-card p-4">
                        <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                          {UI_TRANSLATIONS[language].podiums}
                        </div>
                        <div className="font-apex text-3xl font-extrabold text-[var(--text-main)] mt-1">
                          {selectedDriverPodiumsCount ?? '-'}
                        </div>
                      </div>
                    </div>

                    <div className="apex-card p-8 flex-grow">
                      <h3 className="font-apex font-extrabold italic uppercase text-xl text-[var(--text-main)] mb-6">
                        {selectedDriverBio ? UI_TRANSLATIONS[language].careerOverview : (selectedDriverTeam?.name ?? UI_TRANSLATIONS[language].team)}
                      </h3>
                      {selectedDriverBio ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          <div>
                            <p className="text-gray-400 leading-relaxed mb-8">
                              {language === 'pt' ? selectedDriverBio.pt : selectedDriverBio.en}
                            </p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                              {selectedDriverTeam?.color && (
                                <div>
                                  <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                    {UI_TRANSLATIONS[language].team}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 shrink-0" style={{ backgroundColor: selectedDriverTeam.color }} />
                                    <span className="font-bold text-[var(--text-main)]">{selectedDriverTeam.name}</span>
                                  </div>
                                </div>
                              )}
                              {selectedDriverTeam?.car && (
                                <div>
                                  <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                    {UI_TRANSLATIONS[language].chassis}
                                  </div>
                                  <div className="font-bold text-[var(--text-main)]">{selectedDriverTeam.car}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          {selectedDriverTeam?.clearart && (
                            <div className="bg-black/20 border border-white/5 p-4">
                              <img
                                src={selectedDriverTeam.clearart}
                                alt={selectedDriverTeam.car ?? selectedDriverTeam.name}
                                className="w-full h-auto"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                          {selectedDriverTeam?.color && (
                            <div>
                              <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                {UI_TRANSLATIONS[language].team}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 shrink-0" style={{ backgroundColor: selectedDriverTeam.color }} />
                                <span className="font-bold text-[var(--text-main)]">{selectedDriverTeam.name}</span>
                              </div>
                            </div>
                          )}
                          {selectedDriverTeam?.car && (
                            <div>
                              <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                {UI_TRANSLATIONS[language].chassis}
                              </div>
                              <div className="font-bold text-[var(--text-main)]">{selectedDriverTeam.car}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="apex-card p-8">
                  <h3 className="font-apex font-extrabold italic uppercase text-xl text-[var(--text-main)] mb-6">
                    {driverSeasonResults ? UI_TRANSLATIONS[language].recentResults : UI_TRANSLATIONS[language].winsThisSeason}
                  </h3>
                  {driverSeasonResults ? (
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="border-b border-[var(--card-border)]">
                            <th className="py-3 pr-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].roundLabel}</th>
                            <th className="py-3 pr-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].event}</th>
                            <th className="py-3 pr-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].grid}</th>
                            <th className="py-3 pr-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].finish}</th>
                            <th className="py-3 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 text-right">{UI_TRANSLATIONS[language].points}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedDriverRecentResults.map((row) => (
                            <tr key={row.round} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 pr-4 text-sm text-gray-500">R{row.round}</td>
                              <td className="py-3 pr-4 font-bold text-[var(--text-main)] uppercase">{row.raceName}</td>
                              <td className="py-3 pr-4 text-sm text-[var(--text-main)]">{row.grid ?? '-'}</td>
                              <td className={cn("py-3 pr-4 text-sm font-bold", row.finishPosition === 1 ? "text-[var(--driver-accent)]" : "text-[var(--text-main)]")}>
                                {row.finishPosition ?? row.status}
                              </td>
                              <td className="py-3 font-apex-mono text-sm text-right text-[var(--text-main)]">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : selectedDriverWins.length === 0 ? (
                    <p className="text-gray-500 text-sm">{UI_TRANSLATIONS[language].noWinsYet}</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {selectedDriverWins.map((race) => (
                        <div key={race.id} className="flex items-center justify-between py-3">
                          <div>
                            <div className="font-bold text-[var(--text-main)]">
                              {language === 'pt' ? race.name : (race.enName || race.name)}
                            </div>
                            <div className="text-xs text-gray-500">{race.location}</div>
                          </div>
                          <div className="font-apex-mono text-xs text-gray-400">
                            {race.date.split('-').reverse().join('/')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </motion.div>
        ) : view === 'favorites' && currentUser ? (
          <motion.div
            key="favorites-page"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
          >
            <section className="relative py-12 md:py-16 min-h-[70dvh]">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                  onClick={() => setView('home')}
                  className="inline-flex items-center gap-2 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-brand-red transition-colors mb-8"
                >
                  <ChevronLeft className="w-4 h-4" /> {UI_TRANSLATIONS[language].home}
                </button>

                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-brand-red fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl font-apex font-extrabold italic text-[var(--text-main)]">
                        {UI_TRANSLATIONS[language].favorites}
                      </h1>
                      {priorityFollowIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-red text-white text-[10px] font-black">
                          {priorityFollowIds.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-10">{UI_TRANSLATIONS[language].favoritesPageDesc}</p>

                <NotificationsToggle userId={currentUser.id} language={language} />

                <FavoritesPicker
                  categories={allCategories}
                  language={language}
                  followedCategoryIds={followedCategoryIds}
                  followedTeamIds={followedTeamIds}
                  followedDriverIds={followedDriverIds}
                  priorityFollowIds={priorityFollowIds}
                  onToggleCategory={toggleFollowCategory}
                  onToggleTeam={toggleFollowTeam}
                  onToggleDriver={toggleFollowDriver}
                  onMovePriority={movePriorityFollow}
                />
              </div>
            </section>
          </motion.div>
        ) : (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING}
            >
              <section className="relative py-12 md:py-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--cat-accent)]/20 to-transparent" />
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    key={selectedCategory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING_SOFT}
                    className="flex flex-col md:flex-row items-center gap-12"
                  >
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cat-accent)]/10 border border-[var(--cat-accent)]/20 text-[var(--cat-accent)] text-xs font-bold uppercase tracking-widest mb-6">
                        <Timer className="w-3 h-3" />
                        {seasonBadgeLabel}
                      </div>
                      <h1 className="text-4xl sm:text-6xl md:text-8xl font-apex font-extrabold italic tracking-tighter mb-6 text-[var(--text-main)]">
                        {(language === 'pt' ? selectedCategory.name : (selectedCategory.enFullName || selectedCategory.name)).split(' ')[0]} <span className="text-[var(--cat-accent)]">{(language === 'pt' ? selectedCategory.name : (selectedCategory.enFullName || selectedCategory.name)).split(' ').slice(1).join(' ')}</span>
                      </h1>
                      <p className="text-gray-500 text-lg max-w-xl mb-10">
                        {language === 'pt' ? selectedCategory.description : (selectedCategory.enDescription || selectedCategory.description)}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <button
                          onClick={() => toggleFollowCategory(selectedCategory.id)}
                          className={cn(
                            "px-8 py-4 rounded-lg font-bold border transition-all uppercase tracking-widest text-sm flex items-center gap-2",
                            followedCategorySet.has(selectedCategory.id)
                              ? "bg-[var(--cat-accent)]/10 text-[var(--cat-accent)] border-[var(--cat-accent)]/30"
                              : "bg-[var(--card-bg)] text-[var(--text-main)] border-[var(--card-border)] hover:bg-white/10"
                          )}
                        >
                          <Heart className="w-4 h-4" />
                          {followedCategorySet.has(selectedCategory.id) ? UI_TRANSLATIONS[language].followingCategory : UI_TRANSLATIONS[language].followCategory}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('calendar');
                            setTimeout(() => {
                              contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                          }}
                          className="px-8 py-4 rounded-lg bg-[var(--cat-accent)] text-[var(--cat-accent-ink)] font-bold shadow-xl shadow-[var(--cat-accent)]/20 hover:scale-105 active:scale-100 transition-all uppercase tracking-widest text-sm"
                        >
                          {UI_TRANSLATIONS[language].viewCalendar}
                        </button>
                        <button
                          onClick={() => setShowRules(true)}
                          className="px-8 py-4 rounded-lg bg-[var(--card-bg)] text-[var(--text-main)] font-bold border border-[var(--card-border)] hover:bg-white/10 transition-all uppercase tracking-widest text-sm flex items-center gap-2"
                        >
                          <Info className="w-4 h-4" /> {UI_TRANSLATIONS[language].rulesAndFormat}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 relative">
                      <div className="absolute inset-0 blur-[100px] rounded-full" style={{ backgroundColor: `${categoryAccent}33` }} />
                      <div className="relative apex-card p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: categoryAccent }}>
                              {React.createElement(IconMap[selectedCategory.icon], { className: "w-6 h-6", style: { color: categoryAccentInk } })}
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">{UI_TRANSLATIONS[language].nextStage}</div>
                              <div className="font-display font-black text-xl text-[var(--text-main)]">
                                {nextUpcomingRace?.name || UI_TRANSLATIONS[language].seasonEnd}
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">{UI_TRANSLATIONS[language].date}</div>
                            <div className="font-mono font-bold text-[var(--text-main)]">
                              {nextUpcomingRace?.date.split('-').reverse().join('/') || '--/--/--'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-[var(--cat-accent)]" />
                              <span className="text-sm font-bold text-[var(--text-main)]">
                                {nextUpcomingRace?.location || UI_TRANSLATIONS[language].notAvailableShort}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{UI_TRANSLATIONS[language].location}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-[var(--cat-accent)]" />
                              <span className="text-sm font-bold text-[var(--text-main)]">
                                {nextUpcomingRace?.circuit || UI_TRANSLATIONS[language].notAvailableShort}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{UI_TRANSLATIONS[language].circuit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              <section ref={contentRef} className="py-12 bg-[var(--bg-main)] scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-start md:justify-center gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
                    {[
                      { id: 'overview', label: UI_TRANSLATIONS[language].overview, icon: Info },
                      { id: 'teams', label: UI_TRANSLATIONS[language].teams, icon: Users },
                      { id: 'calendar', label: UI_TRANSLATIONS[language].calendar, icon: Calendar },
                      { id: 'standings', label: UI_TRANSLATIONS[language].standings, icon: Trophy },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setTimeout(() => {
                            contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                          activeTab === tab.id 
                            ? "bg-[var(--cat-accent)] text-[var(--cat-accent-ink)] shadow-lg shadow-[var(--cat-accent)]/20"
                            : "bg-[var(--card-bg)] text-gray-500 border border-[var(--card-border)] hover:text-[var(--cat-accent)]"
                        )}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                      >
                        <div className="apex-card p-8">
                          <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Users className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].teams}
                          </h3>
                          <div className="text-4xl font-display font-black text-[var(--cat-accent)] mb-2">
                            {selectedCategory.teams.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">{UI_TRANSLATIONS[language].officialTeams}</p>
                        </div>
                        <div className="apex-card p-8">
                          <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Flag className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].drivers}
                          </h3>
                          <div className="text-4xl font-display font-black text-[var(--cat-accent)] mb-2">
                            {selectedCategory.drivers.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">{UI_TRANSLATIONS[language].driversOnGrid}</p>
                        </div>
                        <div className="apex-card p-8">
                          <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Calendar className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].rounds}
                          </h3>
                          <div className="text-4xl font-display font-black text-[var(--cat-accent)] mb-2">
                            {selectedCategory.calendar.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">{UI_TRANSLATIONS[language].racesInSeason}</p>
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-3 apex-card p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-[var(--cat-accent)]/5 rounded-full group-hover:bg-[var(--cat-accent)]/10 transition-colors" />
                          <div className="relative z-10">
                            <h3 className="text-2xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                              <Info className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].overview}
                            </h3>
                            <div className="prose prose-invert max-w-none">
                              <p className="text-lg leading-relaxed text-gray-400 font-medium">
                                {language === 'pt' ? selectedCategory.longDescription : (selectedCategory.enLongDescription || selectedCategory.longDescription)}
                              </p>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-4">
                              <div className="px-4 py-2 rounded-full bg-[var(--cat-accent)]/10 border border-[var(--cat-accent)]/20 text-[var(--cat-accent)] text-xs font-black uppercase tracking-widest">
                                {seasonBadgeLabel}
                              </div>
                              {selectedCategory.id !== 'imsa' && (
                                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-widest">
                                  {UI_TRANSLATIONS[language].fiaSanctioned}
                                </div>
                              )}
                              {selectedCategory.id === 'f1' && (
                                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-widest">
                                  {UI_TRANSLATIONS[language].liveSource}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {selectedCategory.id === 'f1' && (
                          <>
                            <div className="apex-card p-8">
                              <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                                <Timer className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].liveNextEvent}
                              </h3>
                              <div className="text-2xl font-display font-black text-[var(--cat-accent)] mb-2">
                                {nextUpcomingRace?.name || '--'}
                              </div>
                              <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">
                                {nextUpcomingRace ? `${nextUpcomingRace.location} • ${nextUpcomingRace.date.split('-').reverse().join('/')}` : UI_TRANSLATIONS[language].notAvailableShort}
                              </p>
                            </div>

                            <div className="apex-card p-8">
                              <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                                <Trophy className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].liveLastResult}
                              </h3>
                              <div
                                className="text-2xl font-display font-black mb-2"
                                style={{ color: lastRaceWinnerTeam?.color ?? 'var(--cat-accent)' }}
                              >
                                {lastCompletedRace?.winner || '--'}
                              </div>
                              <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">
                                {lastCompletedRace ? `${lastCompletedRace.name} • ${lastCompletedRace.date.split('-').reverse().join('/')}` : UI_TRANSLATIONS[language].notAvailableShort}
                              </p>
                            </div>

                            <div className="apex-card p-8">
                              <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                                <Flag className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].championshipLeader}
                              </h3>
                              <div
                                className="text-2xl font-display font-black mb-2"
                                style={{ color: championshipLeaderTeam?.color ?? 'var(--cat-accent)' }}
                              >
                                {championshipLeader?.name || '--'}
                              </div>
                              <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">
                                {championshipLeader ? `${championshipLeader.points} ${UI_TRANSLATIONS[language].points}` : UI_TRANSLATIONS[language].notAvailableShort}
                              </p>
                            </div>

                            <div className="apex-card p-8">
                              <h3 className="text-xl font-apex font-extrabold italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                                <Users className="text-[var(--cat-accent)]" /> {UI_TRANSLATIONS[language].constructorsLeader}
                              </h3>
                              <div
                                className="text-2xl font-display font-black mb-2"
                                style={{ color: constructorsLeaderTeam?.color ?? 'var(--cat-accent)' }}
                              >
                                {constructorsLeader?.name || '--'}
                              </div>
                              <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">
                                {constructorsLeader ? `${constructorsLeader.points} ${UI_TRANSLATIONS[language].points}` : UI_TRANSLATIONS[language].notAvailableShort}
                              </p>
                            </div>
                          </>
                        )}

                      </motion.div>
                    )}

                    {activeTab === 'teams' && (
                      <motion.div
                        key="teams"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING}
                        className="space-y-12"
                      >
                        {teamClasses.map(className => (
                          <div key={className} className="space-y-6">
                            <h3 className="text-2xl font-apex font-extrabold italic border-l-4 border-[var(--cat-accent)] pl-4 text-[var(--text-main)]">
                              {className}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {selectedCategory.teams
                                .filter(t => (t.class || 'Geral') === className)
                                .map((team) => (
                                  <div
                                    key={team.id}
                                    className="apex-card overflow-hidden group"
                                    style={{
                                      '--team-accent': team.color ?? 'var(--cat-accent)',
                                      '--team-accent-ink': team.color ? getAccentTextColor(team.color) : 'var(--cat-accent-ink)',
                                    } as React.CSSProperties}
                                  >
                                    <div className="h-2 w-full" style={{ backgroundColor: team.color }} />
                                    <div className="p-6">
                                      <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                          {team.badge && (
                                            <img
                                              src={team.badge}
                                              alt={team.name}
                                              className="w-10 h-10 object-contain shrink-0"
                                              referrerPolicy="no-referrer"
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          )}
                                          {team.clearart && (
                                            <img
                                              src={team.clearart}
                                              alt={team.car ?? team.name}
                                              className="h-10 w-16 object-contain shrink-0"
                                              referrerPolicy="no-referrer"
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          )}
                                          <div>
                                            <h4 className="text-xl font-apex font-extrabold italic text-[var(--text-main)]">{team.name}</h4>
                                            {team.car && (
                                              <div className="text-xs font-mono text-[var(--team-accent)] font-bold uppercase tracking-widest mt-1">
                                                {team.car}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => toggleFollowTeam(selectedCategory.id, team.id)}
                                          className={cn(
                                            "px-3 py-1.5  text-[10px] font-black uppercase tracking-widest border transition-colors",
                                            followedTeamSet.has(`${selectedCategory.id}::${team.id}`)
                                              ? "bg-[var(--team-accent)]/10 border-[var(--team-accent)]/30 text-[var(--team-accent)]"
                                              : "bg-white/5 border-white/10 text-gray-400 hover:text-[var(--team-accent)]"
                                          )}
                                        >
                                          {followedTeamSet.has(`${selectedCategory.id}::${team.id}`) ? UI_TRANSLATIONS[language].following : UI_TRANSLATIONS[language].follow}
                                        </button>
                                      </div>
                                      <div className="space-y-3">
                                        {(driversByTeamId.get(team.id) ?? [])
                                          .map(driver => {
                                            const isDriverPageTest = Boolean(getDriverBio(selectedCategory.id, driver.id));
                                            return (
                                            <div
                                              key={driver.id}
                                              onClick={isDriverPageTest ? () => { setSelectedDriver(driver); setView('driver'); } : undefined}
                                              className={cn(
                                                "relative flex flex-col p-4  bg-black/20 hover:bg-black/30 transition-all group/driver overflow-hidden border border-white/5",
                                                isDriverPageTest && "cursor-pointer ring-1 ring-inset ring-[var(--team-accent)]/40"
                                              )}
                                            >
                                              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-[var(--team-accent)]/5 rounded-full group-hover/driver:bg-[var(--team-accent)]/10 transition-colors" />

                                              <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className="relative">
                                                  {driver.cutout ? (
                                                    <img
                                                      src={driver.cutout}
                                                      alt={driver.name}
                                                      className="w-16 h-16 object-cover object-top bg-[var(--team-accent)]/10 border-2 border-[var(--team-accent)]/30 shadow-lg"
                                                      referrerPolicy="no-referrer"
                                                      loading="lazy"
                                                      decoding="async"
                                                    />
                                                  ) : driver.image ? (
                                                    <img
                                                      src={driver.image}
                                                      alt={driver.name}
 className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--team-accent)]/30 shadow-lg"
                                                      referrerPolicy="no-referrer"
                                                      loading="lazy"
                                                      decoding="async"
                                                    />
                                                  ) : (
 <div className="w-16 h-16 rounded-xl bg-[var(--team-accent)]/10 flex items-center justify-center border-2 border-[var(--team-accent)]/30">
                                                      <Users className="w-8 h-8 text-[var(--team-accent)]/40" />
                                                    </div>
                                                  )}
                                                  <div className="absolute -bottom-2 -right-2 bg-[var(--team-accent)] text-[var(--team-accent-ink)] text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg">
                                                    #{driver.number}
                                                  </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                  <div className="font-apex font-extrabold italic text-lg text-[var(--text-main)] group-hover/driver:text-[var(--team-accent)] transition-colors">
                                                    {driver.name.split(' ')[0]} <span className="text-[var(--team-accent)] group-hover/driver:text-[var(--text-main)]">{driver.name.split(' ').slice(1).join(' ')}</span>
                                                  </div>
                                                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                                                    <Flag className="w-2 h-2" />
                                                    {driver.nationality}
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFollowDriver(selectedCategory.id, driver.id);
                                                  }}
                                                  className={cn(
                                                    "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border transition-colors shrink-0",
                                                    followedDriverSet.has(`${selectedCategory.id}::${driver.id}`)
                                                      ? "bg-[var(--team-accent)]/10 border-[var(--team-accent)]/30 text-[var(--team-accent)]"
                                                      : "bg-white/5 border-white/10 text-gray-400 hover:text-[var(--team-accent)]"
                                                  )}
                                                >
                                                  {followedDriverSet.has(`${selectedCategory.id}::${driver.id}`) ? UI_TRANSLATIONS[language].following : UI_TRANSLATIONS[language].follow}
                                                </button>
                                              </div>

                                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].grid2026}</div>
                                                <ChevronRight className="w-4 h-4 text-[var(--team-accent)] opacity-0 group-hover/driver:opacity-100 group-hover/driver:translate-x-1 transition-all" />
                                              </div>
                                            </div>
                                          );})}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {activeTab === 'calendar' && (
                      <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING}
                        className="space-y-4"
                      >
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                          <div className="col-span-1">{UI_TRANSLATIONS[language].date}</div>
                          <div className="col-span-4">{UI_TRANSLATIONS[language].event}</div>
                          <div className="col-span-3">{UI_TRANSLATIONS[language].location} / {UI_TRANSLATIONS[language].circuit}</div>
                          <div className="col-span-2 text-center">{UI_TRANSLATIONS[language].status}</div>
                          <div className="col-span-2 text-right">{UI_TRANSLATIONS[language].result}</div>
                        </div>
                        
                        <div className="space-y-4">
                          {selectedCategory.calendar.map((race) => {
                            const winnerDriver = race.winner ? driverByName.get(race.winner) : undefined;
                            const isRacePageTest = hasCircuitPage(selectedCategory, race);
                            return (
                            <div
                              key={race.id}
                              onClick={isRacePageTest ? () => { setSelectedRace(race); setView('race'); } : undefined}
                              className={cn(
                                "flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-6 apex-card items-center transition-all hover:bg-white/10",
                                isRacePageTest && "cursor-pointer ring-1 ring-[var(--cat-accent)]/40",
                                race.status === 'upcoming' ? "border-l-4 border-l-[var(--cat-accent)]" :
                                race.status === 'cancelled' ? "border-l-4 border-l-red-500 opacity-60" : ""
                              )}
                            >
                              <div className="w-full md:col-span-1 flex justify-between md:block items-center">
                                <span className="md:hidden text-xs font-bold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].date}</span>
                                <div className="font-mono text-sm text-[var(--text-main)]">
                                  {race.date.split('-').slice(1).reverse().join('/')}
                                </div>
                              </div>
                              <div className="w-full md:col-span-4">
                                <div className="font-bold text-lg text-[var(--text-main)]">{language === 'pt' ? race.name : (race.enName || race.name)}</div>
                              </div>
                              <div className="w-full md:col-span-3">
                                <div className="text-sm text-gray-400">{language === 'pt' ? race.location : (race.enLocation || race.location)}</div>
                                <div className="text-xs text-gray-500 italic">{race.circuit}</div>
                              </div>
                              <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                                <span className="md:hidden text-xs font-bold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].status}</span>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1",
                                  race.status === 'completed' ? "bg-gray-800 text-gray-400" : 
                                  race.status === 'cancelled' ? "bg-red-900/50 text-red-400" :
                                  "bg-[var(--cat-accent)] text-[var(--cat-accent-ink)]"
                                )}>
                                  {race.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                  {race.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                                  {race.status === 'upcoming' && <Timer className="w-3 h-3" />}
                                  {UI_TRANSLATIONS[language][race.status]}
                                </span>
                              </div>
                              <div className="w-full md:col-span-2 flex justify-between md:justify-end items-center">
                                <span className="md:hidden text-xs font-bold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].result}</span>
                                {race.winner ? (
                                  <div className="flex items-center justify-end gap-3">
                                    {(winnerDriver?.cutout || winnerDriver?.image) && (
                                      <img
                                        src={winnerDriver.cutout || winnerDriver.image}
                                        alt={race.winner}
                                        className="w-8 h-8 rounded-full object-cover object-top border border-yellow-500/50"
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                        decoding="async"
                                      />
                                    )}
                                    <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                      <Trophy className="w-3 h-3" />
                                      {race.winner}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </div>
                            </div>
                          )})}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'standings' && (
                      <motion.div
                        key="standings"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING}
                        className="space-y-12"
                      >
                        {selectedCategory.standings ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {selectedCategory.standings.drivers && (
                              <div className="space-y-6">
                                <h3 className="text-2xl font-apex font-extrabold italic border-l-4 border-[var(--cat-accent)] pl-4 text-[var(--text-main)]">
                                  {UI_TRANSLATIONS[language].driversChampionship}
                                </h3>
                                <div className="apex-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].position}</th>
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].drivers}</th>
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].team}</th>
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 text-right">{UI_TRANSLATIONS[language].points}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                      {selectedCategory.standings.drivers.map((item) => {
                                        const team = selectedCategory.teams.find((t) => t.name === item.team);
                                        const driver = driverByName.get(item.name);
                                        const driverPhoto = driver?.cutout || driver?.image;
                                        const isDriverPageTest = Boolean(driver && getDriverBio(selectedCategory.id, driver.id));
                                        return (
                                          <tr
                                            key={item.name}
                                            onClick={isDriverPageTest ? () => { setSelectedDriver(driver!); setView('driver'); } : undefined}
                                            className={cn(
                                              "hover:bg-white/5 transition-colors border-l-2",
                                              isDriverPageTest && "cursor-pointer ring-1 ring-inset ring-[var(--row-accent)]/40"
                                            )}
                                            style={{
                                              '--row-accent': team?.color ?? 'var(--cat-accent)',
                                              borderLeftColor: team?.color ?? 'var(--cat-accent)',
                                            } as React.CSSProperties}
                                          >
                                            <td className="px-6 py-4 font-apex font-extrabold italic text-[var(--row-accent)]">{item.position}</td>
                                            <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                                              <div className="flex items-center gap-3">
                                                {driverPhoto ? (
                                                  <img
                                                    src={driverPhoto}
                                                    alt={item.name}
                                                    className="w-9 h-9 object-cover object-top bg-[var(--row-accent)]/10 border border-[var(--row-accent)]/30 shrink-0"
                                                    referrerPolicy="no-referrer"
                                                    loading="lazy"
                                                    decoding="async"
                                                  />
                                                ) : (
                                                  <div className="w-9 h-9 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    <Users className="w-4 h-4 text-gray-600" />
                                                  </div>
                                                )}
                                                <span>{item.name}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                              <div className="flex items-center gap-2">
                                                {team?.badge && (
                                                  <img
                                                    src={team.badge}
                                                    alt={item.team}
                                                    className="w-5 h-5 object-contain shrink-0"
                                                    referrerPolicy="no-referrer"
                                                    loading="lazy"
                                                    decoding="async"
                                                  />
                                                )}
                                                <span>{item.team || '-'}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 font-apex-mono font-bold text-right text-[var(--text-main)]">{item.points}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {selectedCategory.standings.constructors && (
                              <div className="space-y-6">
                                <h3 className="text-2xl font-apex font-extrabold italic border-l-4 border-[var(--cat-accent)] pl-4 text-[var(--text-main)]">
                                  {UI_TRANSLATIONS[language].constructorsChampionship}
                                </h3>
                                <div className="apex-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[400px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].position}</th>
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].constructors}</th>
                                        <th className="px-6 py-4 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 text-right">{UI_TRANSLATIONS[language].points}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                      {selectedCategory.standings.constructors.map((item) => {
                                        const team = selectedCategory.teams.find((t) => t.name === item.name);
                                        return (
                                          <tr key={item.name} className="hover:bg-white/5 transition-colors border-l-2" style={{ borderLeftColor: team?.color ?? 'transparent' }}>
                                            <td className="px-6 py-4 font-apex font-extrabold italic" style={{ color: team?.color ?? 'var(--cat-accent)' }}>{item.position}</td>
                                            <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                                              <div className="flex items-center gap-3">
                                                {team?.badge && (
                                                  <img
                                                    src={team.badge}
                                                    alt={item.name}
                                                    className="w-7 h-7 object-contain shrink-0"
                                                    referrerPolicy="no-referrer"
                                                    loading="lazy"
                                                    decoding="async"
                                                  />
                                                )}
                                                <span>{item.name}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 font-apex-mono font-bold text-right text-[var(--text-main)]">{item.points}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {selectedCategory.standings.teams && (
                              <div className="space-y-6 lg:col-span-2">
                                <h3 className="text-2xl font-apex font-extrabold italic border-l-4 border-[var(--cat-accent)] pl-4 text-[var(--text-main)]">
                                  {UI_TRANSLATIONS[language].teamsChampionship}
                                </h3>
                                <div className="apex-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].position}</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">#</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].team}</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">{UI_TRANSLATIONS[language].points}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                      {selectedCategory.standings.teams.map((item) => {
                                        const team = selectedCategory.teams.find((t) => t.name === item.name);
                                        return (
                                          <tr key={item.name + item.extra} className="hover:bg-white/5 transition-colors border-l-2" style={{ borderLeftColor: team?.color ?? 'transparent' }}>
                                            <td className="px-6 py-4 font-apex font-extrabold italic" style={{ color: team?.color ?? 'var(--cat-accent)' }}>{item.position}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-400">{item.extra || '-'}</td>
                                            <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                                              <div className="flex items-center gap-3">
                                                {team?.badge && (
                                                  <img
                                                    src={team.badge}
                                                    alt={item.name}
                                                    className="w-7 h-7 object-contain shrink-0"
                                                    referrerPolicy="no-referrer"
                                                    loading="lazy"
                                                    decoding="async"
                                                  />
                                                )}
                                                <span>{item.name}</span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-right text-[var(--text-main)]">{item.points}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="apex-card p-12 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Info className="text-gray-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-apex font-extrabold italic text-[var(--text-main)] mb-2">
                              {UI_TRANSLATIONS[language].standingsNotAvailable}
                            </h3>
                            <p className="text-gray-500">
                              {UI_TRANSLATIONS[language].standingsNotAvailableDesc}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-[var(--bg-main)] py-12 border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center rotate-3">
                <Trophy className="text-white w-5 h-5 -rotate-3" />
              </div>
              <span className="text-xl font-apex font-extrabold italic tracking-tighter text-[var(--text-main)]">
                PITSTOP<span className="text-brand-red">HUB</span>
              </span>
            </div>
            
            <div className="text-gray-500 text-sm">
              (c) 2026 PitStop Hub. {UI_TRANSLATIONS[language].allRightsReserved}
            </div>
            
            <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-3">
              {allCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="text-xs font-bold text-gray-500 hover:text-brand-red uppercase tracking-widest transition-colors"
                >
                  {cat.id}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {deferredInstallPrompt && (
              <button
                onClick={() => { void handleInstallApp(); }}
                disabled={installingApp}
 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-red text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {installingApp ? UI_TRANSLATIONS[language].installingApp : UI_TRANSLATIONS[language].installApp}
              </button>
            )}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Languages className="w-4 h-4" />
              {UI_TRANSLATIONS[language].language}
            </div>
            <div className="flex items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full p-1 shadow-sm">
              <button
                onClick={() => setLanguage('pt')}
                className={cn(
                  "px-2 py-1 text-[10px] font-black  transition-all",
                  language === 'pt' ? "bg-brand-red text-white" : "text-gray-500 hover:text-brand-red"
                )}
              >
                PT
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-1 text-[10px] font-black  transition-all",
                  language === 'en' ? "bg-brand-red text-white" : "text-gray-500 hover:text-brand-red"
                )}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] hover:text-brand-red transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {UI_TRANSLATIONS[language].appearance}
            </button>
            <button
              onClick={() => {
                const next = !introEnabled;
                setIntroEnabled(next);
                setIntroDisabled(!next);
              }}
              title={introEnabled ? UI_TRANSLATIONS[language].introAnimationOn : UI_TRANSLATIONS[language].introAnimationOff}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest transition-colors",
                introEnabled ? "text-[var(--text-main)] hover:text-brand-red" : "text-gray-500 line-through"
              )}
            >
              <Film className="w-4 h-4" />
              {UI_TRANSLATIONS[language].introAnimation}
            </button>
          </div>
        </div>
      </footer>
      </div>

      <AnimatePresence>
        {showRules && selectedCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRules(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={SPRING}
              className="relative w-full max-w-3xl apex-card p-6 md:p-10 overflow-hidden max-h-[88dvh] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-[var(--cat-accent)]/10 rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-[var(--cat-accent)] flex items-center justify-center shadow-lg shadow-[var(--cat-accent)]/20 shrink-0">
                      <Info className="w-6 h-6" style={{ color: categoryAccentInk }} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-2xl md:text-3xl font-apex font-extrabold italic tracking-tighter text-[var(--text-main)] truncate">
                        {UI_TRANSLATIONS[language].rulesAndFormat}
                      </h2>
                      <p className="text-[var(--cat-accent)] text-xs font-black uppercase tracking-widest truncate">
                        {language === 'pt' ? selectedCategory.fullName : (selectedCategory.enFullName || selectedCategory.fullName)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRules(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="overflow-y-auto pr-1 md:pr-4 no-scrollbar">
                  {selectedCategory.rulesFormat && selectedCategory.rulesFormat.length > 0 ? (
                    <div className="space-y-5">
                      {selectedCategory.rulesFormat.map((section, index) => (
                        <div key={index} className="apex-card p-5 md:p-6 bg-white/[0.02]">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="font-apex-mono text-xs font-black shrink-0 mt-0.5 text-[var(--cat-accent)]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="font-apex text-lg font-extrabold italic tracking-tight text-[var(--text-main)]">
                              {language === 'pt' ? section.title : (section.enTitle || section.title)}
                            </h3>
                          </div>
                          <p className="text-[15px] leading-relaxed text-gray-400 font-medium whitespace-pre-line pl-0 md:pl-8">
                            {language === 'pt' ? section.body : (section.enBody || section.body)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <p className="text-lg leading-relaxed text-gray-400 font-medium whitespace-pre-line">
                        {language === 'pt' ? selectedCategory.longDescription : (selectedCategory.enLongDescription || selectedCategory.longDescription)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end shrink-0">
                  <button 
                    onClick={() => setShowRules(false)}
 className="px-8 py-3 bg-[var(--cat-accent)] text-[var(--cat-accent-ink)] font-apex font-extrabold italic uppercase tracking-widest rounded-lg hover:bg-[var(--cat-accent)]/90 transition-all shadow-lg shadow-[var(--cat-accent)]/20"
                  >
                    {UI_TRANSLATIONS[language].gotIt}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSBanner && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-[110] pb-safe"
          >
            <div className="mx-4 mb-4 glass-card border border-[var(--card-border)] p-4 flex items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center shrink-0 shadow-lg shadow-brand-red/20">
                <Trophy className="text-white w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[var(--text-main)] leading-snug">
                  {UI_TRANSLATIONS[language].iosInstallTitle}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  {language === 'pt' ? 'Toque em' : 'Tap'}
                  <Share2 className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  {language === 'pt' ? "e depois em 'Adicionar à Tela de Início'" : "then 'Add to Home Screen'"}
                </p>
              </div>
              <button
                onClick={handleDismissIOSBanner}
                className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-[var(--text-main)] transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFavoritesOnboarding && currentUser && (
          <FavoritesOnboardingModal
            categories={allCategories}
            language={language}
            followedCategoryIds={followedCategoryIds}
            followedTeamIds={followedTeamIds}
            followedDriverIds={followedDriverIds}
            priorityFollowIds={priorityFollowIds}
            onToggleCategory={toggleFollowCategory}
            onToggleTeam={toggleFollowTeam}
            onToggleDriver={toggleFollowDriver}
            onMovePriority={movePriorityFollow}
            onSkip={dismissFavoritesOnboarding}
            onFinish={dismissFavoritesOnboarding}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


