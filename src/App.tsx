import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Timer, 
  Flag, 
  Mountain, 
  ChevronRight, 
  ChevronDown,
  Calendar, 
  MapPin, 
  Users,
  Info,
  Search,
  XCircle,
  CheckCircle2,
  Sun,
  Moon,
  LayoutGrid,
  Zap,
  Car,
  Truck,
  Menu,
  X,
  Languages,
  Heart
} from 'lucide-react';
import { MOTORSPORT_DATA, Category, Team, Driver, Race } from './types';
import { cn } from './lib/utils';
import { getUserSettings, saveUserSettings, type AuthUser } from './auth';

const IconMap: Record<string, React.ElementType> = {
  Trophy,
  Timer,
  Flag,
  Mountain,
  Zap,
  Car,
  Truck
};

const NAV_GROUPS = [
  {
    name: { pt: 'Fórmulas', en: 'Formulas' },
    ids: ['f1', 'f2', 'f3', 'f1-academy', 'fe']
  },
  {
    name: { pt: 'Endurance/GT', en: 'Endurance/GT' },
    ids: ['wec', 'imsa', 'dtm', 'gt-world-challenge']
  },
  {
    name: { pt: 'Americanas', en: 'American' },
    ids: ['indycar', 'nascar']
  },
  {
    name: { pt: 'Rally', en: 'Rally' },
    ids: ['wrc']
  },
  {
    name: { pt: 'Nacionais', en: 'National' },
    ids: ['stock-car', 'formula-truck']
  }
];

const UI_TRANSLATIONS = {
  pt: {
    home: 'Início',
    explore: 'Explorar',
    viewRules: 'Ver Regras',
    season2026: 'Temporada 2026',
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
    standingsNotAvailableDesc: 'As pontuações completas desta categoria não estão disponíveis publicamente no momento.'
  },
  en: {
    home: 'Home',
    explore: 'Explore',
    viewRules: 'View Rules',
    season2026: '2026 Season',
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
    standingsNotAvailableDesc: 'Full standings for this category are not publicly available at the moment.'
  }
};

type AppProps = {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onLoginRequest: () => void;
};

export default function App({ currentUser, onLogout, onLoginRequest }: AppProps) {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'home' | 'category'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category>(MOTORSPORT_DATA[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'calendar' | 'standings'>('overview');
  const [showRules, setShowRules] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [followedCategoryIds, setFollowedCategoryIds] = useState<string[]>([]);
  const [followedTeamIds, setFollowedTeamIds] = useState<string[]>([]);
  const [followedDriverIds, setFollowedDriverIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (!currentUser) {
      setSettingsLoaded(true);
      return;
    }

    let isMounted = true;
    (async () => {
      const settings = await getUserSettings(currentUser.id);
      if (!isMounted) return;
      if (settings) {
        setLanguage(settings.language);
        setIsDarkMode(settings.theme === 'dark');
        setFollowedCategoryIds(settings.followedCategoryIds);
        setFollowedTeamIds(settings.followedTeamIds);
        setFollowedDriverIds(settings.followedDriverIds);
        const category = MOTORSPORT_DATA.find((cat) => cat.id === settings.favoriteCategoryId);
        if (category) setSelectedCategory(category);
      }
      setSettingsLoaded(true);
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

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
        favoriteCategoryId: selectedCategory.id,
        followedCategoryIds,
        followedTeamIds,
        followedDriverIds,
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [currentUser, settingsLoaded, isDarkMode, language, selectedCategory.id, followedCategoryIds, followedTeamIds, followedDriverIds]);

  React.useEffect(() => {
    const handleClickOutside = () => {
      setExpandedCategoryId(null);
    };
    if (expandedCategoryId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [expandedCategoryId]);

  const handleCategorySelect = (cat: Category) => {
    setExpandedCategoryId(null);
    setSelectedCategory(cat);
    setView('category');
    setActiveTab('overview');
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const followedCategorySet = new Set(followedCategoryIds);
  const followedTeamSet = new Set(followedTeamIds);
  const followedDriverSet = new Set(followedDriverIds);

  const upcomingFollowedRaces = React.useMemo(() => {
    const followedByTeamCategory = new Set(followedTeamIds.map((value) => value.split('::')[0]).filter(Boolean));
    const followedByDriverCategory = new Set(followedDriverIds.map((value) => value.split('::')[0]).filter(Boolean));
    const categoriesToShow = new Set<string>([
      ...followedCategoryIds,
      ...Array.from(followedByTeamCategory),
      ...Array.from(followedByDriverCategory),
    ]);

    return MOTORSPORT_DATA.filter((category) => categoriesToShow.has(category.id))
      .flatMap((category) =>
        category.calendar
          .filter((race) => race.status === 'upcoming')
          .map((race) => ({ category, race }))
      )
      .sort((a, b) => a.race.date.localeCompare(b.race.date));
  }, [followedCategoryIds, followedTeamIds, followedDriverIds]);

  const toggleFollowCategory = (categoryId: string) => {
    if (!currentUser) return onLoginRequest();
    setFollowedCategoryIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]));
  };

  const toggleFollowTeam = (categoryId: string, teamId: string) => {
    if (!currentUser) return onLoginRequest();
    const key = `${categoryId}::${teamId}`;
    setFollowedTeamIds((prev) => (prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]));
  };

  const toggleFollowDriver = (categoryId: string, driverId: string) => {
    if (!currentUser) return onLoginRequest();
    const key = `${categoryId}::${driverId}`;
    setFollowedDriverIds((prev) => (prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]));
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-3">
          <div className="flex-1 flex justify-start min-w-0">
            <button 
              onClick={() => {
                setView('home');
                setExpandedCategoryId(null);
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl font-display font-black italic tracking-tighter text-[var(--text-main)]">
                PitStopHub
              </span>
            </button>
          </div>
          
          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 flex-shrink-0">
            <button
              onClick={() => setView('home')}
              className={cn(
                "flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full text-xs xl:text-sm leading-none whitespace-nowrap font-bold uppercase tracking-wide transition-all",
                view === 'home' ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : "text-gray-500 hover:text-brand-red"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              {UI_TRANSLATIONS[language].home}
            </button>
            <div className="w-px h-6 bg-[var(--card-border)] mx-2" />
            
            {NAV_GROUPS.map((group) => (
              <div 
                key={group.name.en}
                className="relative group"
                onMouseEnter={() => setActiveDropdown(group.name.en)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 py-2 text-xs xl:text-sm leading-none whitespace-nowrap font-bold uppercase tracking-wide transition-colors hover:text-brand-red",
                    group.ids.includes(selectedCategory.id) && view === 'category' ? "text-brand-red" : "text-gray-500"
                  )}
                >
                  {language === 'pt' ? group.name.pt : group.name.en}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === group.name.en && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {activeDropdown === group.name.en && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl overflow-hidden py-2"
                    >
                      {group.ids.map(id => {
                        const cat = MOTORSPORT_DATA.find(c => c.id === id);
                        if (!cat) return null;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat)}
                            className={cn(
                              "w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-brand-red hover:text-white",
                              view === 'category' && selectedCategory.id === cat.id ? "text-brand-red bg-brand-red/5" : "text-gray-500"
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

          <div className="flex-1 flex justify-end items-center gap-2 xl:gap-3 min-w-0">
            {currentUser && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shrink-0">
                <Users className="w-4 h-4 text-brand-red" />
                <span className="text-xs font-semibold text-[var(--text-main)]">{currentUser.name}</span>
              </div>
            )}
            <div className="flex items-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-1 shadow-sm shrink-0">
              <button
                onClick={() => setLanguage('pt')}
                className={cn(
                  "px-2 py-1 text-[10px] font-black rounded-lg transition-all",
                  language === 'pt' ? "bg-brand-red text-white" : "text-gray-500 hover:text-brand-red"
                )}
              >
                PT
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-1 text-[10px] font-black rounded-lg transition-all",
                  language === 'en' ? "bg-brand-red text-white" : "text-gray-500 hover:text-brand-red"
                )}
              >
                EN
              </button>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] hover:scale-110 transition-all shadow-sm shrink-0"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-red-500">{UI_TRANSLATIONS[language].liveData}</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] hover:scale-110 transition-all shadow-sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {currentUser ? (
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-brand-red transition-colors whitespace-nowrap shrink-0"
              >
                Sair
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="px-3 py-2 rounded-xl bg-brand-red text-white text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                Entrar
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[var(--header-bg)] border-t border-[var(--card-border)] overflow-hidden shadow-2xl"
            >
              <div className="px-4 py-8 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setView('home');
                      setExpandedCategoryId(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                      view === 'home' 
                        ? "bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20" 
                        : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10"
                    )}
                  >
                    <LayoutGrid className="w-5 h-5" />
                    {UI_TRANSLATIONS[language].home}
                  </button>
                  <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{UI_TRANSLATIONS[language].liveData}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.name.en} className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--card-border)]" />
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
                          {language === 'pt' ? group.name.pt : group.name.en}
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--card-border)]" />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {group.ids.map(id => {
                          const cat = MOTORSPORT_DATA.find(c => c.id === id);
                          if (!cat) return null;
                          const Icon = IconMap[cat.icon];
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                handleCategorySelect(cat);
                                setIsMobileMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all border",
                                view === 'category' && selectedCategory.id === cat.id 
                                  ? "bg-brand-red/10 text-brand-red border-brand-red/20" 
                                  : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center",
                                  view === 'category' && selectedCategory.id === cat.id ? "bg-brand-red text-white" : "bg-white/10 text-gray-500"
                                )}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {language === 'pt' ? cat.name : (cat.enFullName || cat.name)}
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-50" />
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
              className="relative min-h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Background GIF for Home Page */}
              <div 
                className="absolute inset-0 -z-10 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'url("https://i.imgur.com/dgLObWa.gif")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'grayscale(100%)'
                }}
              />
              <motion.section
                key="home-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20"
              >
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl md:text-7xl font-display font-black italic tracking-tighter mb-6 text-[var(--text-main)]"
                >
                  PitStopHub
                </motion.h1>
                  <p className="text-gray-500 max-w-2xl mx-auto text-lg mt-8">
                    {UI_TRANSLATIONS[language].tagline}
                  </p>
                </div>

                {currentUser && (
                  <div className="glass-card p-6 mb-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-display font-black italic text-[var(--text-main)]">Proximas corridas que voce segue</h3>
                      <Heart className="w-5 h-5 text-brand-red" />
                    </div>
                    {upcomingFollowedRaces.length === 0 ? (
                      <p className="text-sm text-gray-500">Voce ainda nao segue categorias/equipes/pilotos.</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingFollowedRaces.slice(0, 6).map(({ category, race }) => (
                          <div key={`${category.id}-${race.id}`} className="p-3 rounded-lg border border-[var(--card-border)] bg-white/5 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-brand-red">{category.name}</p>
                              <p className="text-sm font-semibold text-[var(--text-main)]">{race.name}</p>
                              <p className="text-xs text-gray-500">{race.location} • {race.circuit}</p>
                            </div>
                            <span className="font-mono text-xs text-[var(--text-main)]">{race.date.split('-').reverse().join('/')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-16">
                  {NAV_GROUPS.map((group, groupIndex) => (
                    <motion.div 
                      key={group.name.en}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--card-border)] to-transparent" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-brand-red whitespace-nowrap">
                          {language === 'pt' ? group.name.pt : group.name.en}
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--card-border)] to-transparent" />
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {group.ids.map((id) => {
                        const cat = MOTORSPORT_DATA.find(c => c.id === id);
                        if (!cat) return null;
                        const Icon = IconMap[cat.icon];
                        const isExpanded = expandedCategoryId === cat.id;

                        return (
                          <motion.div
                            key={cat.id}
                            layout
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isExpanded) {
                                handleCategorySelect(cat);
                              } else {
                                setExpandedCategoryId(cat.id);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (isExpanded) {
                                  handleCategorySelect(cat);
                                } else {
                                  setExpandedCategoryId(cat.id);
                                }
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "group relative flex flex-col items-start p-5 glass-card hover:scale-[1.02] transition-all text-left overflow-hidden cursor-pointer",
                              isExpanded ? "ring-2 ring-brand-red/50 shadow-2xl shadow-brand-red/10 z-10" : "hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center gap-4 w-full">
                              <div className={cn(
                                "w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/20 transition-transform shrink-0",
                                isExpanded ? "scale-110" : "group-hover:rotate-6"
                              )}>
                                <Icon className="text-white w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-display font-black italic tracking-tighter text-[var(--text-main)] truncate">
                                  {language === 'pt' ? cat.name : (cat.enFullName || cat.name)}
                                </h3>
                                {!isExpanded && (
                                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {UI_TRANSLATIONS[language].viewSummary}
                                  </p>
                                )}
                              </div>
                              {isExpanded ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedCategoryId(null);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-brand-red transition-colors" />
                              )}
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                  className="overflow-hidden w-full"
                                >
                                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                    {language === 'pt' ? cat.description : (cat.enDescription || cat.description)}
                                  </p>
                                  <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFollowCategory(cat.id);
                                        }}
                                        className={cn(
                                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors",
                                          followedCategorySet.has(cat.id)
                                            ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                                            : "bg-white/5 border-white/10 text-gray-400 hover:text-brand-red"
                                        )}
                                      >
                                        {followedCategorySet.has(cat.id) ? 'Seguindo' : 'Seguir categoria'}
                                      </button>
                                      <span className="text-brand-red font-bold text-[10px] uppercase tracking-widest">
                                        {UI_TRANSLATIONS[language].accessCategory}
                                      </span>
                                      <ChevronRight className="w-3 h-3 text-brand-red group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(cat);
                                        setShowRules(true);
                                      }}
                                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-brand-red transition-all"
                                      title={UI_TRANSLATIONS[language].viewRules}
                                    >
                                      <Info className="w-3 h-3" />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.div>
        ) : (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero Section */}
              <section className="relative py-12 md:py-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-red/20 to-transparent" />
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    key={selectedCategory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-center gap-12"
                  >
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold uppercase tracking-widest mb-6">
                        <Timer className="w-3 h-3" />
                        {UI_TRANSLATIONS[language].season2026}
                      </div>
                      <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-black italic tracking-tighter mb-6 text-[var(--text-main)]">
                        {(language === 'pt' ? selectedCategory.name : (selectedCategory.enFullName || selectedCategory.name)).split(' ')[0]} <span className="text-brand-red">{(language === 'pt' ? selectedCategory.name : (selectedCategory.enFullName || selectedCategory.name)).split(' ').slice(1).join(' ')}</span>
                      </h1>
                      <p className="text-gray-500 text-lg max-w-xl mb-10">
                        {language === 'pt' ? selectedCategory.description : (selectedCategory.enDescription || selectedCategory.description)}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <button
                          onClick={() => toggleFollowCategory(selectedCategory.id)}
                          className={cn(
                            "px-8 py-4 font-bold rounded-xl border transition-all uppercase tracking-widest text-sm flex items-center gap-2",
                            followedCategorySet.has(selectedCategory.id)
                              ? "bg-brand-red/10 text-brand-red border-brand-red/30"
                              : "bg-[var(--card-bg)] text-[var(--text-main)] border-[var(--card-border)] hover:bg-white/10"
                          )}
                        >
                          <Heart className="w-4 h-4" />
                          {followedCategorySet.has(selectedCategory.id) ? 'Seguindo categoria' : 'Seguir categoria'}
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTab('calendar');
                            setTimeout(() => {
                              contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                          }}
                          className="px-8 py-4 bg-brand-red text-white font-bold rounded-xl shadow-xl shadow-brand-red/20 hover:scale-105 transition-all uppercase tracking-widest text-sm"
                        >
                          {UI_TRANSLATIONS[language].viewCalendar}
                        </button>
                        <button 
                          onClick={() => setShowRules(true)}
                          className="px-8 py-4 bg-[var(--card-bg)] text-[var(--text-main)] font-bold rounded-xl border border-[var(--card-border)] hover:bg-white/10 transition-all uppercase tracking-widest text-sm flex items-center gap-2"
                        >
                          <Info className="w-4 h-4" /> {UI_TRANSLATIONS[language].rulesAndFormat}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 bg-brand-red/20 blur-[100px] rounded-full" />
                      <div className="relative glass-card p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center">
                              {React.createElement(IconMap[selectedCategory.icon], { className: "text-white w-6 h-6" })}
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">{UI_TRANSLATIONS[language].nextStage}</div>
                              <div className="font-display font-black text-xl text-[var(--text-main)]">
                                {selectedCategory.calendar.find(r => r.status === 'upcoming')?.name || UI_TRANSLATIONS[language].seasonEnd}
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">{UI_TRANSLATIONS[language].date}</div>
                            <div className="font-mono font-bold text-[var(--text-main)]">
                              {selectedCategory.calendar.find(r => r.status === 'upcoming')?.date.split('-').reverse().join('/') || '--/--/--'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-brand-red" />
                              <span className="text-sm font-bold text-[var(--text-main)]">
                                {selectedCategory.calendar.find(r => r.status === 'upcoming')?.location || 'N/A'}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{UI_TRANSLATIONS[language].location}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-brand-red" />
                              <span className="text-sm font-bold text-[var(--text-main)]">
                                {selectedCategory.calendar.find(r => r.status === 'upcoming')?.circuit || 'N/A'}
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

              {/* Content Tabs */}
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
                            ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" 
                            : "bg-[var(--card-bg)] text-gray-500 border border-[var(--card-border)] hover:text-brand-red"
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
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                      >
                        <div className="glass-card p-8">
                          <h3 className="text-xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Users className="text-brand-red" /> {UI_TRANSLATIONS[language].teams}
                          </h3>
                          <div className="text-4xl font-display font-black text-brand-red mb-2">
                            {selectedCategory.teams.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">{UI_TRANSLATIONS[language].officialTeams}</p>
                        </div>
                        <div className="glass-card p-8">
                          <h3 className="text-xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Flag className="text-brand-red" /> {UI_TRANSLATIONS[language].drivers}
                          </h3>
                          <div className="text-4xl font-display font-black text-brand-red mb-2">
                            {selectedCategory.drivers.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">{UI_TRANSLATIONS[language].driversOnGrid}</p>
                        </div>
                        <div className="glass-card p-8">
                          <h3 className="text-xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Calendar className="text-brand-red" /> {UI_TRANSLATIONS[language].rounds}
                          </h3>
                          <div className="text-4xl font-display font-black text-brand-red mb-2">
                            {selectedCategory.calendar.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">{UI_TRANSLATIONS[language].racesInSeason}</p>
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-3 glass-card p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-brand-red/5 rounded-full group-hover:bg-brand-red/10 transition-colors" />
                          <div className="relative z-10">
                            <h3 className="text-2xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                              <Info className="text-brand-red" /> {UI_TRANSLATIONS[language].overview}
                            </h3>
                            <div className="prose prose-invert max-w-none">
                              <p className="text-lg leading-relaxed text-gray-400 font-medium">
                                {language === 'pt' ? selectedCategory.longDescription : (selectedCategory.enLongDescription || selectedCategory.longDescription)}
                              </p>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-4">
                              <div className="px-4 py-2 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-black uppercase tracking-widest">
                                {UI_TRANSLATIONS[language].season2026}
                              </div>
                              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-widest">
                                FIA Sanctioned
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'teams' && (
                      <motion.div
                        key="teams"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                      >
                        {Array.from(new Set(selectedCategory.teams.map(t => t.class || 'Geral'))).map(className => (
                          <div key={className} className="space-y-6">
                            <h3 className="text-2xl font-display font-black italic border-l-4 border-brand-red pl-4 text-[var(--text-main)]">
                              {className}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {selectedCategory.teams
                                .filter(t => (t.class || 'Geral') === className)
                                .map((team) => (
                                  <div key={team.id} className="glass-card overflow-hidden group">
                                    <div className="h-2 w-full" style={{ backgroundColor: team.color }} />
                                    <div className="p-6">
                                      <div className="flex items-center justify-between mb-6">
                                        <div>
                                          <h4 className="text-xl font-display font-black italic text-[var(--text-main)]">{team.name}</h4>
                                          {team.car && (
                                            <div className="text-xs font-mono text-brand-red font-bold uppercase tracking-widest mt-1">
                                              {team.car}
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => toggleFollowTeam(selectedCategory.id, team.id)}
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors",
                                            followedTeamSet.has(`${selectedCategory.id}::${team.id}`)
                                              ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                                              : "bg-white/5 border-white/10 text-gray-400 hover:text-brand-red"
                                          )}
                                        >
                                          {followedTeamSet.has(`${selectedCategory.id}::${team.id}`) ? 'Seguindo' : 'Seguir'}
                                        </button>
                                      </div>
                                      <div className="space-y-3">
                                        {selectedCategory.drivers
                                          .filter(d => d.teamId === team.id)
                                          .map(driver => (
                                            <div key={driver.id} className="relative flex flex-col p-4 rounded-2xl bg-black/20 hover:bg-black/30 transition-all group/driver overflow-hidden border border-white/5">
                                              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-brand-red/5 rounded-full group-hover/driver:bg-brand-red/10 transition-colors" />
                                              
                                              <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className="relative">
                                                  {driver.image ? (
                                                    <img 
                                                      src={driver.image} 
                                                      alt={driver.name} 
                                                      className="w-16 h-16 rounded-xl object-cover border-2 border-brand-red/30 shadow-lg"
                                                      referrerPolicy="no-referrer"
                                                    />
                                                  ) : (
                                                    <div className="w-16 h-16 rounded-xl bg-brand-red/10 flex items-center justify-center border-2 border-brand-red/30">
                                                      <Users className="w-8 h-8 text-brand-red/40" />
                                                    </div>
                                                  )}
                                                  <div className="absolute -bottom-2 -right-2 bg-brand-red text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg">
                                                    #{driver.number}
                                                  </div>
                                                </div>
                                                
                                                <div className="min-w-0 flex-1">
                                                  <div className="font-display font-black italic text-lg text-[var(--text-main)] group-hover/driver:text-brand-red transition-colors">
                                                    {driver.name.split(' ')[0]} <span className="text-brand-red group-hover/driver:text-[var(--text-main)]">{driver.name.split(' ').slice(1).join(' ')}</span>
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
                                                      ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                                                      : "bg-white/5 border-white/10 text-gray-400 hover:text-brand-red"
                                                  )}
                                                >
                                                  {followedDriverSet.has(`${selectedCategory.id}::${driver.id}`) ? 'Seguindo' : 'Seguir'}
                                                </button>
                                              </div>
                                              
                                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].grid2026}</div>
                                                <ChevronRight className="w-4 h-4 text-brand-red opacity-0 group-hover/driver:opacity-100 group-hover/driver:translate-x-1 transition-all" />
                                              </div>
                                            </div>
                                          ))}
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
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                          <div className="col-span-1">{UI_TRANSLATIONS[language].date}</div>
                          <div className="col-span-4">{UI_TRANSLATIONS[language].event}</div>
                          <div className="col-span-3">{UI_TRANSLATIONS[language].location} / {UI_TRANSLATIONS[language].circuit}</div>
                          <div className="col-span-2 text-center">Status</div>
                          <div className="col-span-2 text-right">{UI_TRANSLATIONS[language].result}</div>
                        </div>
                        
                        <div className="space-y-4">
                          {selectedCategory.calendar.map((race) => (
                            <div 
                              key={race.id} 
                              className={cn(
                                "flex flex-col md:grid md:grid-cols-12 gap-4 px-6 py-6 glass-card items-center transition-all hover:bg-white/10",
                                race.status === 'upcoming' ? "border-l-4 border-l-brand-red" : 
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
                                <span className="md:hidden text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1",
                                  race.status === 'completed' ? "bg-gray-800 text-gray-400" : 
                                  race.status === 'cancelled' ? "bg-red-900/50 text-red-400" :
                                  "bg-brand-red text-white"
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
                                    {selectedCategory.drivers.find(d => d.name === race.winner)?.image && (
                                      <img 
                                        src={selectedCategory.drivers.find(d => d.name === race.winner)?.image} 
                                        alt={race.winner} 
                                        className="w-8 h-8 rounded-full object-cover border border-yellow-500/50"
                                        referrerPolicy="no-referrer"
                                      />
                                    )}
                                    <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                      <Trophy className="w-3 h-3" />
                                      {race.winner}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'standings' && (
                      <motion.div
                        key="standings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                      >
                        {selectedCategory.standings ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {selectedCategory.standings.drivers && (
                              <div className="space-y-6">
                                <h3 className="text-2xl font-display font-black italic border-l-4 border-brand-red pl-4 text-[var(--text-main)]">
                                  {UI_TRANSLATIONS[language].driversChampionship}
                                </h3>
                                <div className="glass-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Pos</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].drivers}</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].team}</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                      {selectedCategory.standings.drivers.map((item) => (
                                        <tr key={item.name} className="hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 font-display font-black italic text-brand-red">{item.position}</td>
                                          <td className="px-6 py-4 font-bold text-[var(--text-main)]">{item.name}</td>
                                          <td className="px-6 py-4 text-sm text-gray-500">{item.team || '-'}</td>
                                          <td className="px-6 py-4 font-mono font-bold text-right text-[var(--text-main)]">{item.points}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {selectedCategory.standings.constructors && (
                              <div className="space-y-6">
                                <h3 className="text-2xl font-display font-black italic border-l-4 border-brand-red pl-4 text-[var(--text-main)]">
                                  {UI_TRANSLATIONS[language].constructorsChampionship}
                                </h3>
                                <div className="glass-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[400px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Pos</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].constructors}</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                      {selectedCategory.standings.constructors.map((item) => (
                                        <tr key={item.name} className="hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 font-display font-black italic text-brand-red">{item.position}</td>
                                          <td className="px-6 py-4 font-bold text-[var(--text-main)]">{item.name}</td>
                                          <td className="px-6 py-4 font-mono font-bold text-right text-[var(--text-main)]">{item.points}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {selectedCategory.standings.teams && (
                              <div className="space-y-6 lg:col-span-2">
                                <h3 className="text-2xl font-display font-black italic border-l-4 border-brand-red pl-4 text-[var(--text-main)]">
                                  {UI_TRANSLATIONS[language].teamsChampionship}
                                </h3>
                                <div className="glass-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Pos</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">#</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{UI_TRANSLATIONS[language].team}</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--card-border)]">
                                      {selectedCategory.standings.teams.map((item) => (
                                        <tr key={item.name + item.extra} className="hover:bg-white/5 transition-colors">
                                          <td className="px-6 py-4 font-display font-black italic text-brand-red">{item.position}</td>
                                          <td className="px-6 py-4 font-mono font-bold text-gray-400">{item.extra || '-'}</td>
                                          <td className="px-6 py-4 font-bold text-[var(--text-main)]">{item.name}</td>
                                          <td className="px-6 py-4 font-mono font-bold text-right text-[var(--text-main)]">{item.points}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="glass-card p-12 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Info className="text-gray-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-display font-black italic text-[var(--text-main)] mb-2">
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

      {/* Footer */}
      <footer className="bg-[var(--bg-main)] py-12 border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center rotate-3">
                <Trophy className="text-white w-5 h-5 -rotate-3" />
              </div>
              <span className="text-xl font-display font-black italic tracking-tighter text-[var(--text-main)]">
                PITSTOP<span className="text-brand-red">HUB</span>
              </span>
            </div>
            
            <div className="text-gray-500 text-sm">
              © 2026 PitStop Hub. {UI_TRANSLATIONS[language].allRightsReserved}
            </div>
            
            <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-3">
              {MOTORSPORT_DATA.map(cat => (
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
        </div>
      </footer>

      {/* Rules Modal */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-8 md:p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-brand-red/10 rounded-full" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/20">
                      <Info className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-black italic tracking-tighter text-[var(--text-main)]">
                        {UI_TRANSLATIONS[language].rulesAndFormat}
                      </h2>
                      <p className="text-brand-red text-xs font-black uppercase tracking-widest">
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
                    className="px-8 py-3 bg-brand-red text-white font-display font-black italic uppercase tracking-widest rounded-xl hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                  >
                    {UI_TRANSLATIONS[language].gotIt}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
