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
  AlertTriangle
} from 'lucide-react';
import { MOTORSPORT_DATA, Category } from './types';
import { OpenWheelCarIcon, HypercarIcon, GtCarIcon, RallyCarIcon, StockCarIcon } from './category-icons';
import { cn } from './lib/utils';
import { getUserSettings, saveUserSettings, type AuthUser } from './auth';
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
    favoritesPageDesc: 'Escolha os times e pilotos que você quer acompanhar e defina a ordem de prioridade entre eles.'
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
    favoritesPageDesc: 'Choose the teams and drivers you want to follow and set the priority order between them.'
  }
};

type CircuitInfo = {
  trackImage?: string;
  lengthKm: number;
  raceDistanceKm: number;
  laps: number;
  corners: number;
  direction: 'clockwise' | 'counterclockwise';
  lapRecord: { time: string; driver: string; year: number };
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
  norris: NORRIS_BIO,
  piastri: PIASTRI_BIO,
  verstappen: {
    pt: 'Max Verstappen estreou na Fórmula 1 pela Toro Rosso em 2015, aos 17 anos, e no ano seguinte, já na Red Bull, se tornou o vencedor mais jovem da história da categoria. Conquistou quatro títulos mundiais seguidos, entre 2021 e 2024. Até a etapa da Hungria de 2026, soma 71 vitórias, 131 pódios e 48 poles na carreira, seguindo como piloto principal da equipe.',
    en: 'Max Verstappen made his Formula 1 debut with Toro Rosso in 2015 at age 17, and the following year, by then with Red Bull, became the youngest race winner in the sport\'s history. He won four consecutive World Championships, from 2021 to 2024. As of the 2026 Hungarian Grand Prix, he has 71 career wins, 131 podiums and 48 poles, and remains the team\'s lead driver.',
  },
  hadjar: {
    pt: 'Isack Hadjar chegou à Fórmula 1 em 2025 pela Racing Bulls, após ser vice-campeão da Fórmula 2 em 2024, e conquistou seu primeiro pódio logo na temporada de estreia, no GP da Holanda. Promovido à Red Bull Racing para 2026, ao lado de Max Verstappen, teve um início de temporada de altos e baixos, incluindo um abandono por falha de motor em Melbourne mesmo largando em 3º. Até a etapa da Hungria de 2026, ocupa a 8ª posição no campeonato, com 68 pontos.',
    en: 'Isack Hadjar arrived in Formula 1 in 2025 with Racing Bulls, after finishing runner-up in the 2024 Formula 2 championship, and scored his first podium in his rookie season at the Dutch Grand Prix. Promoted to Red Bull Racing for 2026 alongside Max Verstappen, he has had an up-and-down start to the season, including an engine-failure retirement at Melbourne despite qualifying third. As of the 2026 Hungarian Grand Prix, he sits 8th in the championship with 68 points.',
  },
  leclerc: {
    pt: 'Charles Leclerc estreou na Fórmula 1 pela Sauber em 2018, sendo campeão da GP3 em 2016 e da Fórmula 2 em 2017 logo na temporada de estreia na categoria. Subiu para a Ferrari em 2019, onde se tornou o primeiro monegasco a vencer o GP de Mônaco em 93 anos, em 2024. Até a etapa da Hungria de 2026, soma 9 vitórias, 54 pódios e 27 poles na carreira — recorde de poles sem título mundial —, e ocupa a 5ª posição no campeonato ao lado de Lewis Hamilton, após vencer o GP da Grã-Bretanha.',
    en: 'Charles Leclerc made his Formula 1 debut with Sauber in 2018, having won the GP3 title in 2016 and the Formula 2 title in his rookie season in 2017. He moved up to Ferrari in 2019, where he became the first Monégasque driver to win the Monaco Grand Prix in 93 years, in 2024. As of the 2026 Hungarian Grand Prix, he has 9 career wins, 54 podiums and 27 poles — a record for most poles without a title — and sits 5th in the championship alongside Lewis Hamilton, after winning the British Grand Prix.',
  },
  hamilton: {
    pt: 'Lewis Hamilton estreou na Fórmula 1 pela McLaren em 2007 e conquistou sete títulos mundiais (2008, 2014, 2015, 2017, 2018, 2019 e 2020), o maior número da história da categoria. Somando 106 vitórias, 207 pódios e 104 poles na carreira, mudou-se para a Ferrari em 2025. Após um início difícil na nova equipe, voltou a subir ao pódio em 2026 na China, no Canadá e em Mônaco, e conquistou sua primeira vitória pela Ferrari na primeira edição do GP de Barcelona-Catalunya. Até a etapa da Hungria de 2026, terminou em 5º lugar na corrida mais recente após uma penalidade de cinco segundos por excesso de velocidade no pit lane.',
    en: 'Lewis Hamilton made his Formula 1 debut with McLaren in 2007 and won a record seven World Championships (2008, 2014, 2015, 2017, 2018, 2019 and 2020), the most in the sport\'s history. With 106 career wins, 207 podiums and 104 poles, he moved to Ferrari in 2025. After a difficult start with the new team, he returned to the podium in 2026 in China, Canada and Monaco, and claimed his first win for Ferrari at the inaugural Barcelona-Catalunya Grand Prix. As of the 2026 Hungarian Grand Prix, he finished 5th in the most recent race after a five-second penalty for speeding in the pit lane.',
  },
  russell: {
    pt: 'George Russell estreou na Fórmula 1 pela Williams em 2019, depois de ser campeão da GP3 e da Fórmula 2 em anos de estreia consecutivos (2017 e 2018). Subiu para a Mercedes em 2022 e venceu sua primeira corrida naquele mesmo ano, no GP de São Paulo. Em 2026, venceu a abertura da temporada, na Austrália, e assumiu a liderança do campeonato, mas passou a sofrer para acompanhar o companheiro Kimi Antonelli. Até a etapa da Hungria, soma 7 vitórias, 29 pódios e 11 poles na carreira, com uma segunda vitória na temporada conquistada na Áustria.',
    en: 'George Russell made his Formula 1 debut with Williams in 2019, after winning the GP3 and Formula 2 titles in consecutive rookie seasons (2017 and 2018). He moved up to Mercedes in 2022 and won his first race that same year, at the São Paulo Grand Prix. In 2026, he won the season-opening Australian Grand Prix and took the championship lead, but struggled to keep pace with teammate Kimi Antonelli as the season progressed. As of the Hungarian Grand Prix, he has 7 career wins, 29 podiums and 11 poles, with a second win of the season coming in Austria.',
  },
  antonelli: {
    pt: 'Kimi Antonelli chegou à Fórmula 1 em 2025 pela Mercedes, aos 18 anos, após conquistar títulos de kart, Fórmula 4 e Fórmula Regional ainda muito jovem. Em 2026, teve uma temporada de estreia completa avassaladora: tornou-se o mais jovem pole position da história na China, onde também venceu sua primeira corrida, e encadeou cinco vitórias seguidas a partir dali — a maior sequência já feita por um piloto logo após sua estreia como vencedor. Também cravou um grand chelem em Mônaco e assumiu a liderança do campeonato após o Japão, tornando-se o mais jovem líder da história. Apesar de problemas de motor em Barcelona e Silverstone, chega à etapa da Hungria de 2026 na liderança, com 6 vitórias, 12 pódios e 369 pontos.',
    en: 'Kimi Antonelli arrived in Formula 1 in 2025 with Mercedes at age 18, after winning karting, Formula 4 and Formula Regional titles at a young age. In 2026, he had a dominant first full season: he became the youngest pole-sitter in the sport\'s history in China, where he also won his first race, then reeled off five consecutive wins from there — the most ever by a driver right after their maiden win. He also scored a grand chelem in Monaco and took the championship lead after Japan, becoming the youngest leader in history. Despite engine failures in Barcelona and Silverstone, he arrives at the 2026 Hungarian Grand Prix leading the championship, with 6 wins, 12 podiums and 369 points.',
  },
  alonso: {
    pt: 'Fernando Alonso estreou na Fórmula 1 pela Minardi em 2001 e conquistou dois títulos mundiais consecutivos pela Renault, em 2005 e 2006, quando se tornou o campeão mais jovem da história até então, aos 24 anos. É o único piloto a vencer tanto o Mundial de Pilotos quanto o Mundial de Endurance da FIA, com duas vitórias nas 24 Horas de Le Mans (2018 e 2019). Somando 32 vitórias, 106 pódios e 22 poles — e um recorde de 436 largadas na carreira —, está na Aston Martin desde 2023. A temporada de 2026 tem sido difícil: o AMR26, motorizado pela Honda, sofre com falta de confiabilidade, e Alonso só pontuou pela primeira vez em Mônaco, terminando em 10º após penalidades de rivais.',
    en: 'Fernando Alonso made his Formula 1 debut with Minardi in 2001 and won two consecutive World Championships with Renault, in 2005 and 2006, becoming the youngest champion in the sport\'s history at the time, aged 24. He is the only driver to have won both the F1 World Championship and the FIA World Endurance Championship, with two 24 Hours of Le Mans wins (2018 and 2019). With 32 career wins, 106 podiums and 22 poles — and a record 436 career starts — he has driven for Aston Martin since 2023. The 2026 season has been difficult: the Honda-powered AMR26 has suffered from reliability issues, and Alonso only scored his first points of the year in Monaco, finishing 10th after penalties to other drivers.',
  },
  stroll: {
    pt: 'Lance Stroll estreou na Fórmula 1 pela Williams em 2017, ano em que se tornou o segundo piloto mais jovem a subir ao pódio na história da categoria, com o 3º lugar no GP do Azerbaijão. Antes disso, foi campeão da Fórmula 3 Europeia de 2016 de forma dominante. Soma 3 pódios e 1 pole position na carreira, e segue na Aston Martin, equipe pela qual compete desde 2019, com contrato válido até o fim de 2026.',
    en: 'Lance Stroll made his Formula 1 debut with Williams in 2017, the year he became the second-youngest driver to reach the podium in the sport\'s history, with a 3rd-place finish at the Azerbaijan Grand Prix. Before that, he dominated the 2016 European Formula 3 championship. He has 3 career podiums and 1 pole position, and continues to race for Aston Martin, the team he has driven for since 2019, under contract through the end of 2026.',
  },
  gasly: {
    pt: 'Pierre Gasly estreou na Fórmula 1 pela Toro Rosso em 2017, após ser campeão da Fórmula Renault Eurocup em 2013 e da GP2 em 2016. Em 2020, já pela AlphaTauri, venceu o GP da Itália e se tornou o primeiro piloto francês a vencer uma corrida desde Olivier Panis, em 1996. Está na Alpine desde 2023, somando 1 vitória e 6 pódios na carreira. Em 2026, chegou ao pódio no GP de Mônaco e ocupa a 10ª posição no campeonato, com 42 pontos até a etapa da Hungria.',
    en: 'Pierre Gasly made his Formula 1 debut with Toro Rosso in 2017, after winning the Formula Renault Eurocup title in 2013 and the GP2 title in 2016. In 2020, by then with AlphaTauri, he won the Italian Grand Prix and became the first French driver to win a race since Olivier Panis in 1996. He has driven for Alpine since 2023, with 1 career win and 6 podiums. In 2026, he reached the podium at the Monaco Grand Prix and sits 10th in the championship with 42 points as of the Hungarian Grand Prix.',
  },
  colapinto: {
    pt: 'Franco Colapinto estreou na Fórmula 1 em 2024 pela Williams, substituindo Logan Sargeant no meio da temporada, após passagens pela Fórmula 3 e Fórmula 2. Foi reserva da Alpine em 2025 e assumiu vaga de titular após o GP de Miami daquele ano. Sem vitórias ou pódios até agora, seu melhor resultado é o 6º lugar no GP do Canadá de 2026 — ano em que também chamou atenção com uma defesa elogiada pelo próprio George Russell como "a manobra do ano" na abertura da temporada, na Austrália.',
    en: 'Franco Colapinto made his Formula 1 debut in 2024 with Williams, replacing Logan Sargeant mid-season, after stints in Formula 3 and Formula 2. He was Alpine\'s reserve driver in 2025 and was promoted to a race seat after that year\'s Miami Grand Prix. Without a win or podium so far, his best result is 6th place at the 2026 Canadian Grand Prix — a season in which he also drew attention for a defensive move at the Australian season opener that George Russell himself called "the save of the season."',
  },
  ocon: {
    pt: 'Esteban Ocon estreou na Fórmula 1 pela Manor em 2016, depois de ser campeão da Fórmula 3 Europeia em 2014 e da GP3 em 2015 como parte do programa de jovens pilotos da Mercedes. Conquistou sua única vitória na carreira em 2021, no GP da Hungria, pela Alpine. Está na Haas desde 2025, ao lado de Oliver Bearman, somando 1 vitória e 4 pódios na carreira. Até a etapa da Hungria de 2026, ocupa a 17ª posição no campeonato, com 3 pontos.',
    en: 'Esteban Ocon made his Formula 1 debut with Manor in 2016, after winning the European Formula 3 title in 2014 and the GP3 title in 2015 as part of Mercedes\' young driver programme. He scored his only career win in 2021, at the Hungarian Grand Prix, driving for Alpine. He has been with Haas since 2025, alongside Oliver Bearman, with 1 career win and 4 podiums. As of the 2026 Hungarian Grand Prix, he sits 17th in the championship with 3 points.',
  },
  bearman: {
    pt: 'Oliver Bearman fez sua estreia na Fórmula 1 em 2024 no GP da Arábia Saudita, substituindo Carlos Sainz na Ferrari, e se tornou o piloto mais jovem da história da equipe — terminou em 7º e foi eleito o piloto do dia. Assumiu vaga fixa na Haas em 2025, ao lado de Esteban Ocon, com melhor resultado o 4º lugar no México daquele ano. Em 2026, soma 18 pontos, com destaque para o 7º lugar na Austrália e o 5º lugar na China, até a etapa da Hungria.',
    en: 'Oliver Bearman made his Formula 1 debut in 2024 at the Saudi Arabian Grand Prix, substituting for Carlos Sainz at Ferrari, becoming the youngest driver in the team\'s history — he finished 7th and was named Driver of the Day. He took a full-time seat with Haas in 2025, alongside Esteban Ocon, with a best finish of 4th in Mexico that year. In 2026, he has scored 18 points, highlighted by a 7th place in Australia and a 5th place in China, as of the Hungarian Grand Prix.',
  },
  lawson: {
    pt: 'Liam Lawson estreou na Fórmula 1 em 2023, no GP da Holanda, substituindo Daniel Ricciardo na então AlphaTauri, depois de ser vice-campeão da Super Fórmula japonesa naquele ano. Foi promovido à Red Bull Racing para 2025, mas voltou à Racing Bulls já após duas corridas. Sem vitórias ou pódios na carreira, teve como melhor resultado o 6º lugar no GP da Áustria de 2026, além de pontuar na China (sprint e corrida principal) e terminar em 9º no Japão.',
    en: 'Liam Lawson made his Formula 1 debut in 2023 at the Dutch Grand Prix, substituting for Daniel Ricciardo at what was then AlphaTauri, after finishing runner-up in Japan\'s Super Formula championship that year. He was promoted to Red Bull Racing for 2025 but was moved back to Racing Bulls after just two rounds. Without a career win or podium, his best result is a 6th place at the 2026 Austrian Grand Prix, on top of points finishes in China (sprint and main race) and a 9th place in Japan.',
  },
  lindblad: {
    pt: 'Arvid Lindblad é membro do programa de jovens pilotos da Red Bull desde 2021 e chegou à Fórmula 1 em 2026 pela Racing Bulls, aos 18 anos. Antes disso, quebrou recordes de precocidade: foi o vencedor mais jovem de uma corrida principal na história da Fórmula 3, em 2024, e o vencedor mais jovem da história da Fórmula 2, aos 17 anos e 254 dias, em 2025 — ano em que também foi campeão da Fórmula Regional da Oceania. Estreou classificando em 9º e pontuando em 8º, e teve o 7º lugar, em Mônaco e em Silverstone, como melhor resultado. Até a etapa da Hungria de 2026, soma 23 pontos na carreira.',
    en: 'Arvid Lindblad has been part of Red Bull\'s junior driver programme since 2021 and arrived in Formula 1 in 2026 with Racing Bulls, aged 18. Before that, he set precocious records: he became the youngest feature race winner in Formula 3 history in 2024, and the youngest race winner in Formula 2 history, at 17 years and 254 days, in 2025 — a year in which he also won the Formula Regional Oceania championship. He qualified 9th and scored points in 8th on his debut, and has taken 7th place, at Monaco and Silverstone, as his best result. As of the 2026 Hungarian Grand Prix, he has 23 career points.',
  },
  sainz: {
    pt: 'Carlos Sainz estreou na Fórmula 1 pela Toro Rosso em 2015, após ser campeão da Fórmula Renault 3.5 em 2014 como parte do programa de jovens da Red Bull. Correu pela Ferrari entre 2021 e 2024, no lugar de Sebastian Vettel, e está na Williams desde 2025. Soma 4 vitórias, 29 pódios e 6 poles na carreira. A temporada de 2026 com o novo FW48 tem sido difícil: só pontuou pela primeira vez na China, somando pontos em Miami e no Canadá, mas abandonou em Mônaco e na Áustria por problemas técnicos.',
    en: 'Carlos Sainz made his Formula 1 debut with Toro Rosso in 2015, after winning the Formula Renault 3.5 title in 2014 as part of Red Bull\'s young driver programme. He drove for Ferrari between 2021 and 2024, replacing Sebastian Vettel, and has been with Williams since 2025. He has 4 career wins, 29 podiums and 6 poles. The 2026 season with the new FW48 has been difficult: he only scored his first points in China, added more in Miami and Canada, but retired in Monaco and Austria with technical issues.',
  },
  albon: {
    pt: 'Alex Albon estreou na Fórmula 1 pela Toro Rosso em 2019 e foi promovido à Red Bull ainda naquela temporada, a partir do GP da Bélgica, conquistando seus primeiros pódios em 2020. Está na Williams desde 2022, quando substituiu George Russell. Soma 2 pódios na carreira, sem vitórias ou poles. Em 2026, chegou a 5 pontos até a etapa da Hungria, com destaque para o 10º lugar em Miami e o 8º em Mônaco.',
    en: 'Alex Albon made his Formula 1 debut with Toro Rosso in 2019 and was promoted to Red Bull that same season, from the Belgian Grand Prix onward, scoring his first podiums in 2020. He has been with Williams since 2022, when he replaced George Russell. He has 2 career podiums, without a win or pole. In 2026, he reached 5 points as of the Hungarian Grand Prix, highlighted by a 10th place in Miami and an 8th in Monaco.',
  },
  hulkenberg: {
    pt: 'Nico Hülkenberg estreou na Fórmula 1 pela Williams em 2010, depois de ser campeão da Fórmula 3 Euro Series em 2008 e da GP2 em 2009 — o terceiro campeão estreante da categoria, depois de Nico Rosberg e Lewis Hamilton. Detém o recorde de mais largadas na história sem vencer uma corrida (260) e só subiu ao primeiro pódio da carreira em 2025, no GP da Grã-Bretanha, depois de 239 corridas de espera — outro recorde. Segue na Audi, projeto que assumiu a antiga Sauber para 2026.',
    en: 'Nico Hülkenberg made his Formula 1 debut with Williams in 2010, after winning the European Formula 3 title in 2008 and the GP2 title in 2009 — the championship\'s third rookie champion, after Nico Rosberg and Lewis Hamilton. He holds the record for most career starts without a win (260) and only reached his first career podium in 2025, at the British Grand Prix, after 239 races of waiting — another record. He continues with Audi, the project that took over the former Sauber squad for 2026.',
  },
  bortoleto: {
    pt: 'Gabriel Bortoleto chegou à Fórmula 1 em 2025 pela Sauber, depois de conquistar os títulos de Fórmula 3 em 2023 e de Fórmula 2 em 2024 em sua temporada de estreia na categoria. Segue no projeto em 2026, agora sob a bandeira da Audi. Sem vitórias ou pódios na carreira, seu melhor resultado é o 6º lugar no GP da Hungria de 2025. Em 2026, somou pontos em corridas como a Austrália (9º) e a Grã-Bretanha (8º), ocupando a 14ª posição no campeonato com 10 pontos até a etapa da Hungria.',
    en: 'Gabriel Bortoleto arrived in Formula 1 in 2025 with Sauber, after winning the Formula 3 title in 2023 and the Formula 2 title in 2024 in his rookie season in that category. He continues with the project in 2026, now under the Audi banner. Without a career win or podium, his best result is a 6th place at the 2025 Hungarian Grand Prix. In 2026, he scored points in races such as Australia (9th) and Britain (8th), sitting 14th in the championship with 10 points as of the Hungarian Grand Prix.',
  },
  perez: {
    pt: 'Sergio Pérez estreou na Fórmula 1 pela Sauber em 2011. Correu pela Red Bull Racing entre 2021 e 2024, ao lado de Max Verstappen, período em que conquistou sua primeira pole no GP da Arábia Saudita de 2022 e terminou como vice-campeão mundial em 2023. Depois de uma temporada de 2024 sem vitórias, deixou a equipe por acordo mútuo. Soma 6 vitórias, 39 pódios e 3 poles na carreira, e estreou pela Cadillac em 2026, equipe estreante na categoria, com a qual luta na parte de trás do grid — melhor resultado até a etapa da Hungria é um 14º lugar.',
    en: 'Sergio Pérez made his Formula 1 debut with Sauber in 2011. He drove for Red Bull Racing between 2021 and 2024, alongside Max Verstappen, a period in which he took his maiden pole position at the 2022 Saudi Arabian Grand Prix and finished championship runner-up in 2023. After a winless 2024 season, he and the team parted ways by mutual agreement. He has 6 career wins, 39 podiums and 3 poles, and joined debutant team Cadillac for 2026, where he has been fighting near the back of the grid — his best result as of the Hungarian Grand Prix is a 14th place.',
  },
  bottas: {
    pt: 'Valtteri Bottas estreou na Fórmula 1 pela Williams em 2013. Foi companheiro de Lewis Hamilton na Mercedes entre 2017 e 2021, período em que terminou vice-campeão mundial duas vezes (2019 e 2020) e ajudou a equipe a conquistar cinco títulos de construtores seguidos. Depois, correu pela Alfa Romeo e, mais tarde, pela Sauber, entre 2022 e 2024. Soma 10 vitórias, 67 pódios e 20 poles na carreira, e estreou pela Cadillac em 2026 com o número 77 — assim como o companheiro Sérgio Pérez, ainda busca os primeiros pontos da equipe estreante, com melhor resultado um 13º lugar até a etapa da Hungria.',
    en: 'Valtteri Bottas made his Formula 1 debut with Williams in 2013. He was Lewis Hamilton\'s teammate at Mercedes between 2017 and 2021, finishing championship runner-up twice (2019 and 2020) and helping the team win five consecutive Constructors\' Championships. He later drove for Alfa Romeo and then Sauber, from 2022 to 2024. He has 10 career wins, 67 podiums and 20 poles, and joined debutant team Cadillac for 2026 with car number 77 — like teammate Sergio Pérez, he is still chasing the new team\'s first points, with a best finish of 13th as of the Hungarian Grand Prix.',
  },
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
  return haystack.includes('francorchamps') || haystack.includes('belgian grand prix');
}

// Paginas de teste habilitadas ate agora: Interlagos, Silverstone, Albert Park e Spa-Francorchamps.
const RACE_TEST_CIRCUITS: { match: (race: Race) => boolean; info: CircuitInfo }[] = [
  { match: isInterlagosRace, info: INTERLAGOS_CIRCUIT_INFO },
  { match: isSilverstoneRace, info: SILVERSTONE_CIRCUIT_INFO },
  { match: isAlbertParkRace, info: ALBERT_PARK_CIRCUIT_INFO },
  { match: isSpaRace, info: SPA_CIRCUIT_INFO },
];

function getRaceCircuitInfo(race: Race): CircuitInfo | null {
  return RACE_TEST_CIRCUITS.find(({ match }) => match(race))?.info ?? null;
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
// sobreviver a um refresh. Usa localStorage (nao sessionStorage): no PWA
// instalado no celular, "atualizar" quase sempre significa fechar e reabrir
// o app, o que encerra a sessao do navegador e apagaria um sessionStorage
// -- localStorage sobrevive a isso e so some se o usuario limpar os dados.
const NAV_STORAGE_KEY = 'pitstophub_nav_state';

type StoredNav = {
  view: 'home' | 'category' | 'race' | 'driver' | 'favorites';
  categoryId: string;
  activeTab: 'overview' | 'teams' | 'calendar' | 'standings';
  raceId: string | null;
  driverId: string | null;
};

function readStoredNav(): StoredNav | null {
  if (typeof window === 'undefined') return null;
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
  // Pagina de piloto usa a cor da equipe do piloto como destaque, nao a cor fixa da categoria.
  const driverAccent = selectedDriverTeam?.color ?? categoryAccent;
  // O menu FORMULAS/ENDURANCE do cabecalho normalmente usa o vermelho fixo da
  // marca, mas numa pagina de piloto o destaque/hover do menu acompanha a cor
  // da equipe daquele piloto (resto do cabecalho -- logo, botao de login --
  // continua vermelho de proposito, e' identidade fixa do site).
  const navAccent = view === 'driver' && selectedDriver ? driverAccent : '#e10600';

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
      className="min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden"
      style={{ '--cat-accent': categoryAccent, '--cat-accent-ink': categoryAccentInk, '--nav-accent': navAccent } as React.CSSProperties}
    >
      <header className="pt-safe sticky top-0 z-50 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">

          <button
            onClick={() => setView('home')}
            className="shrink-0 flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-xl sm:text-2xl font-apex font-extrabold italic tracking-tighter text-[var(--text-main)]">
              PitStopHub
            </span>
          </button>

          <nav className="hidden xl:flex flex-1 items-center justify-center gap-1">
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
                      className="absolute top-full left-0 mt-2 w-48 z-[200] bg-[var(--card-bg)] border border-[var(--card-border)]  shadow-2xl py-2"
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

          <div className="ml-auto xl:ml-0 flex items-center gap-2 shrink-0">
            {deferredInstallPrompt && (
              <button
                onClick={() => { void handleInstallApp(); }}
                disabled={installingApp}
                className="hidden md:flex px-4 py-2  bg-[var(--card-bg)] border border-[var(--card-border)] font-apex-mono text-xs font-semibold uppercase tracking-wide text-[var(--text-main)] hover:text-brand-red transition-colors disabled:opacity-60 whitespace-nowrap"
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
                <div className="flex items-center gap-2 px-3 py-1.5  bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <div className="w-6 h-6 rounded-full bg-brand-red flex items-center justify-center text-white text-[10px] font-black shrink-0 select-none">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-main)] max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-2  bg-[var(--card-bg)] border border-[var(--card-border)] font-apex-mono text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-red transition-colors whitespace-nowrap"
                >
                  {UI_TRANSLATIONS[language].logout}
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginRequest}
                className="hidden xl:flex px-4 py-2  bg-brand-red text-white font-apex-mono text-xs font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {UI_TRANSLATIONS[language].login}
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2.5  bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] hover:scale-110 transition-all shadow-sm"
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
              <div className="bg-[var(--header-bg)] px-4 py-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                {currentUser ? (
                  <div className="flex items-center justify-between p-4  bg-white/5 border border-white/5">
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
                      className="px-3 py-2  bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-brand-red transition-colors shrink-0 ml-3"
                    >
                      {UI_TRANSLATIONS[language].logout}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { onLoginRequest(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 p-4  bg-brand-red text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-red/20 active:scale-95 transition-transform"
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
                    className="w-full flex items-center justify-center gap-2 p-4  bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] text-sm font-black uppercase tracking-widest disabled:opacity-60"
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
                  className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] bg-brand-red/20"
                  animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full blur-[130px] bg-blue-500/10"
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
                  className="relative overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] mb-10 sm:mb-16"
                >
                  <div className="relative p-8 sm:p-12 md:p-16">
                    {heroNextRace ? (
                      <>
                        <div className="inline-flex items-center gap-2 border border-brand-red text-brand-red px-3 py-1 font-apex-mono text-[11px] font-semibold uppercase tracking-widest mb-6">
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
                              <div key={unit.label} className="border border-[var(--card-border)] bg-black/20 w-20 text-center py-3">
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
                              className="w-11 h-11 flex items-center justify-center shrink-0"
                              style={{ backgroundColor: getCategoryAccent(heroNextRace.category.id) }}
                            >
                              {React.createElement(IconMap[heroNextRace.category.icon] ?? Trophy, { className: 'text-white w-5 h-5' })}
                            </div>
                            <div>
                              <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500">
                                {language === 'pt' ? heroNextRace.category.name : (heroNextRace.category.enFullName || heroNextRace.category.name)}
                              </div>
                              <button
                                onClick={() => handleCategorySelect(heroNextRace.category)}
                                className="font-apex-mono text-xs font-bold uppercase tracking-widest text-brand-red hover:text-[var(--text-main)] transition-colors underline underline-offset-4"
                              >
                                {UI_TRANSLATIONS[language].viewCalendar}
                              </button>
                            </div>
                          </div>
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
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-8">
                    {NAV_GROUPS.map((group) => {
                      const isActiveGroup = activeHomeGroup === group.name.en;
                      return (
                        <button
                          key={group.name.en}
                          onClick={() => setActiveHomeGroup(group.name.en)}
                          className={cn(
                            "px-4 py-2 font-apex-mono text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
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

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeHomeGroup}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={SPRING}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
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
                            className="group relative flex items-center gap-3 p-4 apex-card text-left overflow-hidden cursor-pointer hover:bg-white/5 transition-colors duration-200"
                          >
                            <div
                              className="absolute top-0 right-0 w-10 h-10 border-t-2 transition-colors"
                              style={{ borderColor: accent }}
                            />
                            <div
                              className="w-10 h-10 flex items-center justify-center shrink-0"
                              style={{ backgroundColor: accent }}
                            >
                              <Icon className="text-white w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-apex text-sm font-extrabold italic tracking-tight text-[var(--text-main)] truncate">
                                {language === 'pt' ? cat.name : (cat.enFullName || cat.name)}
                              </h3>
                              <p className="font-apex-mono text-[10px] text-gray-500 uppercase tracking-widest font-medium truncate">
                                {cat.teams.length} {UI_TRANSLATIONS[language].teams} • {cat.calendar.length} {UI_TRANSLATIONS[language].rounds}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFollowCategory(cat.id);
                              }}
                              className={cn(
                                "p-1.5 rounded-full transition-colors shrink-0",
                                isFollowed ? "text-brand-red" : "text-gray-500 hover:text-brand-red"
                              )}
                              title={isFollowed ? UI_TRANSLATIONS[language].followingCategory : UI_TRANSLATIONS[language].followCategory}
                            >
                              <Heart className={cn("w-4 h-4", isFollowed && "fill-brand-red")} />
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-brand-red group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
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
            <section className="relative py-12 md:py-20 overflow-hidden min-h-[70vh]">
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
                          [UI_TRANSLATIONS[language].lapRecord, `${selectedRaceCircuitInfo.lapRecord.time} — ${selectedRaceCircuitInfo.lapRecord.driver} (${selectedRaceCircuitInfo.lapRecord.year})`],
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
              className="relative py-12 md:py-20 overflow-hidden min-h-[70vh]"
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                  {/* Versao compacta, so no mobile: card grande de baixo (pensado pro recorte
                      de corpo inteiro) deixava um vao vazio enorme quando empilhado em tela
                      estreita. Aqui a foto fica pequena ao lado do nome, sem sobra. */}
                  <div className="sm:hidden lg:col-span-5 apex-card relative overflow-hidden p-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--driver-accent)]/15 to-transparent" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-full overflow-hidden bg-black/30 border-2 shrink-0"
                        style={{ borderColor: driverAccent }}
                      >
                        {(selectedDriver.image || selectedDriver.cutout) && (
                          <img
                            src={selectedDriver.image || selectedDriver.cutout}
                            alt={selectedDriver.name}
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                            loading="eager"
                            decoding="async"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {selectedDriverTeam && (
                            <span className="text-[var(--driver-accent)] font-apex-mono text-[10px] font-semibold border border-[var(--driver-accent)] px-1.5 py-0.5 uppercase">
                              {selectedDriverTeam.name}
                            </span>
                          )}
                          <span className="font-apex-mono text-[10px] text-gray-400">#{selectedDriver.number}</span>
                        </div>
                        <h1 className="font-apex font-extrabold italic uppercase text-2xl leading-[0.95] text-white">
                          {selectedDriver.name.split(' ').slice(0, -1).join(' ')}{' '}
                          <span className="text-[var(--driver-accent)]">{selectedDriver.name.split(' ').slice(-1)}</span>
                        </h1>
                        <p className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                          {selectedDriver.nationality}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "hidden sm:flex lg:col-span-5 apex-card relative overflow-hidden min-h-[420px] flex-col",
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
                        {DRIVER_BIOS[selectedDriver.id] ? UI_TRANSLATIONS[language].careerOverview : (selectedDriverTeam?.name ?? UI_TRANSLATIONS[language].team)}
                      </h3>
                      {DRIVER_BIOS[selectedDriver.id] ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          <div>
                            <p className="text-gray-400 leading-relaxed mb-8">
                              {language === 'pt' ? DRIVER_BIOS[selectedDriver.id].pt : DRIVER_BIOS[selectedDriver.id].en}
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
                              {selectedDriverTeammates.length > 0 && (
                                <div>
                                  <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                    {UI_TRANSLATIONS[language].teammate}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedDriverTeammates.map((t) => {
                                      const canOpenTeammate = selectedCategory.id === 'f1' && Boolean(DRIVER_BIOS[t.id]);
                                      const teammatePhoto = t.image || t.cutout;
                                      const inner = (
                                        <>
                                          <span className="w-7 h-7 rounded-full overflow-hidden bg-black/30 shrink-0">
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
                                          </span>
                                          <span className="font-bold text-[var(--text-main)] text-sm">{t.name}</span>
                                        </>
                                      );
                                      return canOpenTeammate ? (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => { setSelectedDriver(t); setView('driver'); }}
                                          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--driver-accent)]/50 transition-colors"
                                        >
                                          {inner}
                                        </button>
                                      ) : (
                                        <div key={t.id} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/5 border border-white/10">
                                          {inner}
                                        </div>
                                      );
                                    })}
                                  </div>
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
                          {selectedDriverTeammates.length > 0 && (
                            <div>
                              <div className="font-apex-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                {UI_TRANSLATIONS[language].teammate}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedDriverTeammates.map((t) => {
                                  const canOpenTeammate = selectedCategory.id === 'f1' && Boolean(DRIVER_BIOS[t.id]);
                                  const teammatePhoto = t.image || t.cutout;
                                  const inner = (
                                    <>
                                      <span className="w-7 h-7 rounded-full overflow-hidden bg-black/30 shrink-0">
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
                                      </span>
                                      <span className="font-bold text-[var(--text-main)] text-sm">{t.name}</span>
                                    </>
                                  );
                                  return canOpenTeammate ? (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => { setSelectedDriver(t); setView('driver'); }}
                                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--driver-accent)]/50 transition-colors"
                                    >
                                      {inner}
                                    </button>
                                  ) : (
                                    <div key={t.id} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/5 border border-white/10">
                                      {inner}
                                    </div>
                                  );
                                })}
                              </div>
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
            <section className="relative py-12 md:py-20 min-h-[70vh]">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                  onClick={() => setView('home')}
                  className="inline-flex items-center gap-2 font-apex-mono text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-brand-red transition-colors mb-8"
                >
                  <ChevronLeft className="w-4 h-4" /> {UI_TRANSLATIONS[language].home}
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-6 h-6 text-brand-red fill-current" />
                  <h1 className="text-2xl sm:text-3xl font-apex font-extrabold italic text-[var(--text-main)]">
                    {UI_TRANSLATIONS[language].favorites}
                  </h1>
                </div>
                <p className="text-sm text-gray-500 mb-10">{UI_TRANSLATIONS[language].favoritesPageDesc}</p>

                <NotificationsToggle userId={currentUser.id} language={language} />

                <FavoritesPicker
                  categories={allCategories}
                  language={language}
                  followedTeamIds={followedTeamIds}
                  followedDriverIds={followedDriverIds}
                  priorityFollowIds={priorityFollowIds}
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
                            "px-8 py-4 font-bold  border transition-all uppercase tracking-widest text-sm flex items-center gap-2",
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
                          className="px-8 py-4 bg-[var(--cat-accent)] text-[var(--cat-accent-ink)] font-bold  shadow-xl shadow-[var(--cat-accent)]/20 hover:scale-105 active:scale-100 transition-all uppercase tracking-widest text-sm"
                        >
                          {UI_TRANSLATIONS[language].viewCalendar}
                        </button>
                        <button 
                          onClick={() => setShowRules(true)}
                          className="px-8 py-4 bg-[var(--card-bg)] text-[var(--text-main)] font-bold  border border-[var(--card-border)] hover:bg-white/10 transition-all uppercase tracking-widest text-sm flex items-center gap-2"
                        >
                          <Info className="w-4 h-4" /> {UI_TRANSLATIONS[language].rulesAndFormat}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 blur-[100px] rounded-full" style={{ backgroundColor: `${categoryAccent}33` }} />
                      <div className="relative apex-card p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12  flex items-center justify-center" style={{ backgroundColor: categoryAccent }}>
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
                          <div className="flex items-center justify-between p-4  bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-[var(--cat-accent)]" />
                              <span className="text-sm font-bold text-[var(--text-main)]">
                                {nextUpcomingRace?.location || UI_TRANSLATIONS[language].notAvailableShort}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{UI_TRANSLATIONS[language].location}</span>
                          </div>
                          <div className="flex items-center justify-between p-4  bg-black/20 border border-white/5">
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
                                            // Pagina de piloto habilitada pra toda a grid de F1 (unica categoria com biografias em DRIVER_BIOS por enquanto).
                                            const isDriverPageTest = selectedCategory.id === 'f1' && Boolean(DRIVER_BIOS[driver.id]);
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
                                                      className="w-16 h-16  object-cover border-2 border-[var(--team-accent)]/30 shadow-lg"
                                                      referrerPolicy="no-referrer"
                                                      loading="lazy"
                                                      decoding="async"
                                                    />
                                                  ) : (
                                                    <div className="w-16 h-16  bg-[var(--team-accent)]/10 flex items-center justify-center border-2 border-[var(--team-accent)]/30">
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
                            // Teste: pagina dedicada de corrida, habilitada so para o GP de Interlagos por enquanto.
                            const isRacePageTest = selectedCategory.id === 'f1' && getRaceCircuitInfo(race) != null;
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
                                        // Pagina de piloto dedicada, habilitada pra toda a grid de F1.
                                        const isDriverPageTest = selectedCategory.id === 'f1' && Boolean(driver && DRIVER_BIOS[driver.id]);
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
                className="inline-flex items-center gap-2 px-3 py-2  bg-brand-red text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {installingApp ? UI_TRANSLATIONS[language].installingApp : UI_TRANSLATIONS[language].installApp}
              </button>
            )}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Languages className="w-4 h-4" />
              {UI_TRANSLATIONS[language].language}
            </div>
            <div className="flex items-center bg-[var(--card-bg)] border border-[var(--card-border)]  p-1 shadow-sm">
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
              className="inline-flex items-center gap-2 px-3 py-2  bg-[var(--card-bg)] border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] hover:text-brand-red transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {UI_TRANSLATIONS[language].appearance}
            </button>
          </div>
        </div>
      </footer>

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
              className="relative w-full max-w-2xl apex-card p-8 md:p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-[var(--cat-accent)]/10 rounded-full" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12  bg-[var(--cat-accent)] flex items-center justify-center shadow-lg shadow-[var(--cat-accent)]/20">
                      <Info className="w-6 h-6" style={{ color: categoryAccentInk }} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-apex font-extrabold italic tracking-tighter text-[var(--text-main)]">
                        {UI_TRANSLATIONS[language].rulesAndFormat}
                      </h2>
                      <p className="text-[var(--cat-accent)] text-xs font-black uppercase tracking-widest">
                        {language === 'pt' ? selectedCategory.fullName : (selectedCategory.enFullName || selectedCategory.fullName)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowRules(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                
                <div className="prose prose-invert max-w-none max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
                  <p className="text-lg leading-relaxed text-gray-400 font-medium whitespace-pre-line">
                    {language === 'pt' ? selectedCategory.longDescription : (selectedCategory.enLongDescription || selectedCategory.longDescription)}
                  </p>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={() => setShowRules(false)}
                    className="px-8 py-3 bg-[var(--cat-accent)] text-[var(--cat-accent-ink)] font-apex font-extrabold italic uppercase tracking-widest  hover:bg-[var(--cat-accent)]/90 transition-all shadow-lg shadow-[var(--cat-accent)]/20"
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
            followedTeamIds={followedTeamIds}
            followedDriverIds={followedDriverIds}
            priorityFollowIds={priorityFollowIds}
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


