import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Timer, 
  Flag, 
  Mountain, 
  ChevronRight, 
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
  Menu,
  X
} from 'lucide-react';
import { MOTORSPORT_DATA, Category, Team, Driver, Race } from './types';
import { cn } from './lib/utils';

const IconMap: Record<string, React.ElementType> = {
  Trophy,
  Timer,
  Flag,
  Mountain,
  Zap,
  Car
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'home' | 'category'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category>(MOTORSPORT_DATA[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'calendar' | 'standings'>('overview');
  const [showRules, setShowRules] = useState(false);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setView('category');
    setActiveTab('overview');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl font-display font-black italic tracking-tighter text-[var(--text-main)]">
              PitStopHub
            </span>
          </button>
          
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => setView('home')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all",
                view === 'home' ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" : "text-gray-500 hover:text-brand-red"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Início
            </button>
            <div className="w-px h-6 bg-[var(--card-border)] mx-2" />
            {MOTORSPORT_DATA.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={cn(
                  "relative py-1 text-sm font-bold uppercase tracking-widest transition-colors hover:text-brand-red",
                  view === 'category' && selectedCategory.id === cat.id ? "text-brand-red" : "text-gray-500"
                )}
              >
                {cat.name}
                {view === 'category' && selectedCategory.id === cat.id && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 w-full h-0.5 bg-brand-red"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] hover:scale-110 transition-all shadow-sm"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-red-500">Live Data</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] hover:scale-110 transition-all shadow-sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[var(--header-bg)] border-t border-[var(--card-border)] overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <button
                  onClick={() => {
                    setView('home');
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                    view === 'home' ? "bg-brand-red text-white" : "text-gray-500 hover:bg-white/5"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Início
                </button>
                <div className="h-px bg-[var(--card-border)] mx-4" />
                {MOTORSPORT_DATA.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      handleCategorySelect(cat);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                      view === 'category' && selectedCategory.id === cat.id ? "text-brand-red bg-brand-red/10" : "text-gray-500 hover:bg-white/5"
                    )}
                  >
                    {cat.name}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20"
            >
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-display font-black italic tracking-tighter mb-6 text-[var(--text-main)]"
                >
                  PitStopHub
                </motion.h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg mt-8">
                  Explore os calendários, equipes e pilotos das principais competições do automobilismo mundial em 2026.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {MOTORSPORT_DATA.map((cat, index) => {
                  const Icon = IconMap[cat.icon];
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleCategorySelect(cat)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCategorySelect(cat);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="group relative flex flex-col items-start p-8 glass-card hover:scale-[1.02] transition-all text-left overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 p-12 -mr-8 -mt-8 bg-brand-red/5 rounded-full group-hover:bg-brand-red/10 transition-colors" />
                      <div className="w-14 h-14 rounded-2xl bg-brand-red flex items-center justify-center mb-8 shadow-lg shadow-brand-red/20 group-hover:rotate-6 transition-transform">
                        <Icon className="text-white w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-display font-black italic tracking-tighter mb-2 text-[var(--text-main)]">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                        {cat.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-brand-red font-bold text-sm uppercase tracking-widest">
                          Explorar <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(cat);
                            setShowRules(true);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-brand-red transition-all"
                          title="Ver Regras"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
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
                        Temporada 2026
                      </div>
                      <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter mb-6 text-[var(--text-main)]">
                        {selectedCategory.name.split(' ')[0]} <span className="text-brand-red">{selectedCategory.name.split(' ').slice(1).join(' ')}</span>
                      </h1>
                      <p className="text-gray-500 text-lg max-w-xl mb-10">
                        {selectedCategory.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <button 
                          onClick={() => {
                            setActiveTab('calendar');
                            setTimeout(() => {
                              contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                          }}
                          className="px-8 py-4 bg-brand-red text-white font-bold rounded-xl shadow-xl shadow-brand-red/20 hover:scale-105 transition-all uppercase tracking-widest text-sm"
                        >
                          Ver Calendário
                        </button>
                        <button 
                          onClick={() => setShowRules(true)}
                          className="px-8 py-4 bg-[var(--card-bg)] text-[var(--text-main)] font-bold rounded-xl border border-[var(--card-border)] hover:bg-white/10 transition-all uppercase tracking-widest text-sm flex items-center gap-2"
                        >
                          <Info className="w-4 h-4" /> Regras e Formato
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 bg-brand-red/20 blur-[100px] rounded-full" />
                      <div className="relative glass-card p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center">
                              {React.createElement(IconMap[selectedCategory.icon], { className: "text-white w-6 h-6" })}
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Próxima Etapa</div>
                              <div className="font-display font-black text-xl text-[var(--text-main)]">
                                {selectedCategory.calendar.find(r => r.status === 'upcoming')?.name || 'Fim da Temporada'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Data</div>
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
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Local</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-brand-red" />
                              <span className="text-sm font-bold text-[var(--text-main)]">
                                {selectedCategory.calendar.find(r => r.status === 'upcoming')?.circuit || 'N/A'}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Circuito</span>
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
                      { id: 'overview', label: 'Visão Geral', icon: Info },
                      { id: 'teams', label: 'Equipes', icon: Users },
                      { id: 'calendar', label: 'Calendário', icon: Calendar },
                      { id: 'standings', label: 'Pontuação', icon: Trophy },
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
                            <Users className="text-brand-red" /> Equipes
                          </h3>
                          <div className="text-4xl font-display font-black text-brand-red mb-2">
                            {selectedCategory.teams.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">Equipes Oficiais</p>
                        </div>
                        <div className="glass-card p-8">
                          <h3 className="text-xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Flag className="text-brand-red" /> Pilotos
                          </h3>
                          <div className="text-4xl font-display font-black text-brand-red mb-2">
                            {selectedCategory.drivers.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">Pilotos no Grid</p>
                        </div>
                        <div className="glass-card p-8">
                          <h3 className="text-xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                            <Calendar className="text-brand-red" /> Etapas
                          </h3>
                          <div className="text-4xl font-display font-black text-brand-red mb-2">
                            {selectedCategory.calendar.length}
                          </div>
                          <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">Corridas na Temporada</p>
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-3 glass-card p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-brand-red/5 rounded-full group-hover:bg-brand-red/10 transition-colors" />
                          <div className="relative z-10">
                            <h3 className="text-2xl font-display font-black italic mb-6 flex items-center gap-2 text-[var(--text-main)]">
                              <Info className="text-brand-red" /> Sobre a Categoria
                            </h3>
                            <div className="prose prose-invert max-w-none">
                              <p className="text-lg leading-relaxed text-gray-400 font-medium">
                                {selectedCategory.longDescription}
                              </p>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-4">
                              <div className="px-4 py-2 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-black uppercase tracking-widest">
                                Temporada 2026
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
                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                          <Users className="w-4 h-4 text-gray-500" />
                                        </div>
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
                                                
                                                <div>
                                                  <div className="font-display font-black italic text-lg text-[var(--text-main)] group-hover/driver:text-brand-red transition-colors">
                                                    {driver.name.split(' ')[0]} <span className="text-brand-red group-hover/driver:text-[var(--text-main)]">{driver.name.split(' ').slice(1).join(' ')}</span>
                                                  </div>
                                                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                                                    <Flag className="w-2 h-2" />
                                                    {driver.nationality}
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Grid 2026</div>
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
                          <div className="col-span-1">Data</div>
                          <div className="col-span-4">Evento</div>
                          <div className="col-span-3">Local / Circuito</div>
                          <div className="col-span-2 text-center">Status</div>
                          <div className="col-span-2 text-right">Resultado</div>
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
                                <span className="md:hidden text-xs font-bold uppercase tracking-widest text-gray-500">Data</span>
                                <div className="font-mono text-sm text-[var(--text-main)]">
                                  {race.date.split('-').slice(1).reverse().join('/')}
                                </div>
                              </div>
                              <div className="w-full md:col-span-4">
                                <div className="font-bold text-lg text-[var(--text-main)]">{race.name}</div>
                              </div>
                              <div className="w-full md:col-span-3">
                                <div className="text-sm text-gray-400">{race.location}</div>
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
                                  {race.status === 'completed' ? 'Finalizado' : 
                                   race.status === 'cancelled' ? 'Cancelado' : 'Próximo'}
                                </span>
                              </div>
                              <div className="w-full md:col-span-2 flex justify-between md:justify-end items-center">
                                <span className="md:hidden text-xs font-bold uppercase tracking-widest text-gray-500">Resultado</span>
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
                                  Campeonato de Pilotos
                                </h3>
                                <div className="glass-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Pos</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Piloto</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Equipe</th>
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
                                  Campeonato de Construtores
                                </h3>
                                <div className="glass-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[400px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Pos</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Construtor</th>
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
                                  Campeonato de Equipes
                                </h3>
                                <div className="glass-card overflow-x-auto no-scrollbar">
                                  <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                      <tr className="border-b border-[var(--card-border)] bg-white/5">
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Pos</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">#</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Equipe</th>
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
                              Pontuação não disponível
                            </h3>
                            <p className="text-gray-500">
                              As pontuações completas desta categoria não estão disponíveis publicamente no momento.
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
              © 2026 PitStop Hub. Todos os direitos reservados.
            </div>
            
            <div className="flex items-center gap-6">
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
                        Regras e Formato
                      </h2>
                      <p className="text-brand-red text-xs font-black uppercase tracking-widest">
                        {selectedCategory.fullName}
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
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-gray-400 font-medium whitespace-pre-line">
                    {selectedCategory.longDescription}
                  </p>
                </div>
                
                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={() => setShowRules(false)}
                    className="px-8 py-3 bg-brand-red text-white font-display font-black italic uppercase tracking-widest rounded-xl hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                  >
                    Entendido
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
