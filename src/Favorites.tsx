import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, X, Heart, Users } from 'lucide-react';
import type { Category } from './types';
import { cn } from './lib/utils';

type PriorityKind = 'team' | 'driver';

export type PriorityEntry = {
  key: string;
  kind: PriorityKind;
  categoryId: string;
  categoryName: string;
  categoryAccent: string;
  id: string;
  name: string;
  image?: string;
};

const TEXT = {
  pt: {
    priorityOrder: 'Ordem de Prioridade',
    priorityOrderDesc: 'As notificações vão priorizar quem estiver no topo desta lista.',
    noFavoritesYet: 'Você ainda não segue nenhum time ou piloto. Escolha abaixo.',
    browseTitle: 'Escolha times e pilotos',
    teams: 'Times',
    drivers: 'Pilotos',
    remove: 'Remover',
    moveUp: 'Subir prioridade',
    moveDown: 'Descer prioridade',
  },
  en: {
    priorityOrder: 'Priority Order',
    priorityOrderDesc: 'Notifications will prioritize whoever is at the top of this list.',
    noFavoritesYet: "You don't follow any team or driver yet. Choose below.",
    browseTitle: 'Choose teams and drivers',
    teams: 'Teams',
    drivers: 'Drivers',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
  },
} as const;

export function buildPriorityEntries(
  categories: Category[],
  priorityFollowIds: string[],
): PriorityEntry[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return priorityFollowIds
    .map((key): PriorityEntry | null => {
      const [kind, categoryId, id] = key.split('::') as [PriorityKind, string, string];
      const category = categoryById.get(categoryId);
      if (!category) return null;
      if (kind === 'team') {
        const team = category.teams.find((t) => t.id === id);
        if (!team) return null;
        return {
          key, kind, categoryId, id,
          categoryName: category.name,
          categoryAccent: `#${team.color?.replace('#', '') || 'C1121F'}`,
          name: team.name,
          image: team.badge,
        };
      }
      const driver = category.drivers.find((d) => d.id === id);
      if (!driver) return null;
      const team = category.teams.find((t) => t.id === driver.teamId);
      return {
        key, kind, categoryId, id,
        categoryName: category.name,
        categoryAccent: `#${team?.color?.replace('#', '') || 'C1121F'}`,
        name: driver.name,
        image: driver.cutout || driver.image,
      };
    })
    .filter((entry): entry is PriorityEntry => entry !== null);
}

const MODAL_TEXT = {
  pt: {
    title: 'Escolha seus favoritos',
    desc: 'Selecione os times e pilotos que você quer acompanhar de perto. Você pode mudar isso quando quiser.',
    skip: 'Pular',
    finish: 'Concluir',
  },
  en: {
    title: 'Choose your favorites',
    desc: 'Pick the teams and drivers you want to follow closely. You can change this anytime.',
    skip: 'Skip',
    finish: 'Done',
  },
} as const;

interface FavoritesOnboardingModalProps extends FavoritesPickerProps {
  onSkip: () => void;
  onFinish: () => void;
}

export function FavoritesOnboardingModal({ onSkip, onFinish, language, ...pickerProps }: FavoritesOnboardingModalProps) {
  const t = MODAL_TEXT[language];
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onSkip}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="relative w-full sm:max-w-lg max-h-[90vh] flex flex-col bg-[var(--header-bg)] border border-[var(--card-border)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--card-border)] shrink-0">
          <div>
            <h2 className="text-lg font-apex font-extrabold italic text-[var(--text-main)]">{t.title}</h2>
            <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
          </div>
          <button type="button" onClick={onSkip} className="p-1.5 text-gray-500 hover:text-[var(--text-main)] shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 no-scrollbar">
          <FavoritesPicker language={language} {...pickerProps} />
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--card-border)] shrink-0">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-[var(--text-main)] transition-colors"
          >
            {t.skip}
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="px-5 py-2.5 bg-brand-red text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {t.finish}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface FavoritesPickerProps {
  categories: Category[];
  language: 'pt' | 'en';
  followedTeamIds: string[];
  followedDriverIds: string[];
  priorityFollowIds: string[];
  onToggleTeam: (categoryId: string, teamId: string) => void;
  onToggleDriver: (categoryId: string, driverId: string) => void;
  onMovePriority: (key: string, direction: -1 | 1) => void;
}

export function FavoritesPicker({
  categories, language, followedTeamIds, followedDriverIds, priorityFollowIds,
  onToggleTeam, onToggleDriver, onMovePriority,
}: FavoritesPickerProps) {
  const t = TEXT[language];
  const followedTeamSet = useMemo(() => new Set(followedTeamIds), [followedTeamIds]);
  const followedDriverSet = useMemo(() => new Set(followedDriverIds), [followedDriverIds]);
  const priorityEntries = useMemo(
    () => buildPriorityEntries(categories, priorityFollowIds),
    [categories, priorityFollowIds]
  );
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-1">{t.priorityOrder}</h3>
        <p className="text-xs text-gray-500 mb-4">{t.priorityOrderDesc}</p>
        {priorityEntries.length === 0 ? (
          <div className="p-4 bg-white/5 border border-dashed border-white/10 text-xs text-gray-500 text-center">
            {t.noFavoritesYet}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {priorityEntries.map((entry, index) => (
                <motion.div
                  key={entry.key}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)]"
                >
                  <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-black text-gray-500 bg-white/5 rounded-full">
                    {index + 1}
                  </div>
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name}
                      className="w-9 h-9 object-contain shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-9 h-9 shrink-0 bg-white/5 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--text-main)] truncate">{entry.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 truncate">{entry.categoryName}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={t.moveUp}
                      disabled={index === 0}
                      onClick={() => onMovePriority(entry.key, -1)}
                      className="p-1.5 text-gray-500 hover:text-[var(--text-main)] disabled:opacity-20 disabled:hover:text-gray-500 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t.moveDown}
                      disabled={index === priorityEntries.length - 1}
                      onClick={() => onMovePriority(entry.key, 1)}
                      className="p-1.5 text-gray-500 hover:text-[var(--text-main)] disabled:opacity-20 disabled:hover:text-gray-500 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t.remove}
                      onClick={() => entry.kind === 'team' ? onToggleTeam(entry.categoryId, entry.id) : onToggleDriver(entry.categoryId, entry.id)}
                      className="p-1.5 text-gray-500 hover:text-brand-red transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-3">{t.browseTitle}</h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const isExpanded = expandedCategoryId === category.id;
            const followedCount = category.teams.filter((tm) => followedTeamSet.has(`${category.id}::${tm.id}`)).length
              + category.drivers.filter((d) => followedDriverSet.has(`${category.id}::${d.id}`)).length;
            return (
              <div key={category.id} className="border border-[var(--card-border)] bg-[var(--card-bg)]">
                <button
                  type="button"
                  onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-bold text-[var(--text-main)]">{category.name}</span>
                  <div className="flex items-center gap-3">
                    {followedCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-brand-red">
                        <Heart className="w-3 h-3 fill-current" />{followedCount}
                      </span>
                    )}
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-[var(--card-border)] pt-4">
                    {category.teams.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{t.teams}</div>
                        <div className="flex flex-wrap gap-2">
                          {category.teams.map((team) => {
                            const isFollowed = followedTeamSet.has(`${category.id}::${team.id}`);
                            return (
                              <button
                                key={team.id}
                                type="button"
                                onClick={() => onToggleTeam(category.id, team.id)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border transition-colors",
                                  isFollowed
                                    ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-brand-red"
                                )}
                              >
                                {team.badge && (
                                  <img src={team.badge} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                                )}
                                {team.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {category.drivers.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{t.drivers}</div>
                        <div className="flex flex-wrap gap-2">
                          {category.drivers.map((driver) => {
                            const isFollowed = followedDriverSet.has(`${category.id}::${driver.id}`);
                            return (
                              <button
                                key={driver.id}
                                type="button"
                                onClick={() => onToggleDriver(category.id, driver.id)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border transition-colors",
                                  isFollowed
                                    ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-brand-red"
                                )}
                              >
                                {(driver.cutout || driver.image) && (
                                  <img src={driver.cutout || driver.image} alt="" className="w-5 h-5 object-cover object-top rounded-full" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                                )}
                                {driver.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
