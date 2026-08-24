import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, X, Heart, Users, Bell, BellOff, BellRing } from 'lucide-react';
import type { Category } from './types';
import { cn } from './lib/utils';
import { getExistingPushSubscription, isIosPwaRequired, isPushSupported, sendTestNotification, subscribeToPush, unsubscribeFromPush } from './push';

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
    priorityOrderDesc: 'Define a ordem dos avisos de resultado: o piloto ou time no topo aparece primeiro na notificação.',
    noFavoritesYet: 'Você ainda não segue nenhum time ou piloto. Escolha abaixo.',
    browseTitle: 'Escolha categorias, times e pilotos',
    followCategory: 'Seguir categoria inteira',
    followingCategory: 'Seguindo categoria inteira',
    teams: 'Times',
    drivers: 'Pilotos',
    teamKind: 'Time',
    driverKind: 'Piloto',
    remove: 'Remover',
    moveUp: 'Subir prioridade',
    moveDown: 'Descer prioridade',
    favoritesCount: 'favoritos',
  },
  en: {
    priorityOrder: 'Priority Order',
    priorityOrderDesc: 'Sets the order of result alerts: the driver or team at the top shows first in the notification.',
    noFavoritesYet: "You don't follow any team or driver yet. Choose below.",
    browseTitle: 'Choose categories, teams and drivers',
    followCategory: 'Follow whole category',
    followingCategory: 'Following whole category',
    teams: 'Teams',
    drivers: 'Drivers',
    teamKind: 'Team',
    driverKind: 'Driver',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
    favoritesCount: 'favorites',
  },
} as const;

const NOTIF_TEXT = {
  pt: {
    title: 'Notificações',
    desc: 'Aviso no dia da corrida, 1 hora antes da largada e quando sair o resultado dos seus favoritos.',
    enable: 'Ativar notificações',
    enabled: 'Notificações ativadas',
    disable: 'Desativar',
    checking: 'Verificando...',
    unsupported: 'Notificações não são suportadas neste navegador. No celular, instale o app na tela inicial.',
    denied: 'Permissão de notificação bloqueada. Ative nas configurações do navegador.',
    error: 'Não foi possível ativar as notificações agora. Tente novamente.',
    ios: 'No iPhone, adicione o PitStopHub à tela inicial (Compartilhar → Adicionar à Tela de Início) e ative as notificações de dentro do app instalado.',
    test: 'Enviar teste',
    testSent: 'Teste enviado — olhe as notificações do celular.',
    testFail: 'Não deu para enviar o teste. Confira a permissão do navegador.',
    raceDay: 'Dia da corrida',
    t60: '1 hora antes',
    start: 'Largada',
    results: 'Resultado',
  },
  en: {
    title: 'Notifications',
    desc: 'Race day, one hour before lights out, and results for the drivers and teams you follow.',
    enable: 'Enable notifications',
    enabled: 'Notifications enabled',
    disable: 'Disable',
    checking: 'Checking...',
    unsupported: 'Notifications are not supported in this browser. On a phone, install the app to the home screen.',
    denied: 'Notification permission blocked. Enable it in your browser settings.',
    error: 'Could not enable notifications right now. Try again.',
    ios: 'On iPhone, add PitStopHub to the Home Screen (Share → Add to Home Screen) and enable notifications from the installed app.',
    test: 'Send test',
    testSent: 'Test sent — check your notification shade.',
    testFail: 'Could not send the test. Check the browser permission.',
    raceDay: 'Race day',
    t60: '1 hour before',
    start: 'Lights out',
    results: 'Results',
  },
} as const;

export type NotifyPrefs = {
  notifyRaceDay: boolean;
  notifyT60: boolean;
  notifyStart: boolean;
  notifyResults: boolean;
};

interface NotificationsToggleProps {
  userId: string;
  language: 'pt' | 'en';
  prefs: NotifyPrefs;
  onPrefChange: (key: keyof NotifyPrefs, value: boolean) => void;
}

export function NotificationsToggle({ userId, language, prefs, onPrefChange }: NotificationsToggleProps) {
  const t = NOTIF_TEXT[language];
  const [status, setStatus] = useState<'checking' | 'unsupported' | 'ios' | 'subscribed' | 'not-subscribed' | 'busy'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isIosPwaRequired()) {
      setStatus('ios');
      return;
    }
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }
    getExistingPushSubscription().then((sub) => {
      if (!isMounted) return;
      setStatus(sub ? 'subscribed' : 'not-subscribed');
    });
    return () => { isMounted = false; };
  }, []);

  const handleEnable = async () => {
    setStatus('busy');
    setErrorMsg(null);
    setTestMsg(null);
    const result = await subscribeToPush(userId);
    if (result.ok) {
      setStatus('subscribed');
    } else {
      setStatus(isIosPwaRequired() ? 'ios' : 'not-subscribed');
      setErrorMsg(result.reason === 'denied' ? t.denied : result.reason === 'unsupported' ? t.unsupported : t.error);
    }
  };

  const handleDisable = async () => {
    setStatus('busy');
    setTestMsg(null);
    await unsubscribeFromPush();
    setStatus('not-subscribed');
  };

  const handleTest = async () => {
    const ok = await sendTestNotification(language);
    setTestMsg(ok ? t.testSent : t.testFail);
  };

  const prefRows: Array<{ key: keyof NotifyPrefs; label: string }> = [
    { key: 'notifyRaceDay', label: t.raceDay },
    { key: 'notifyT60', label: t.t60 },
    { key: 'notifyStart', label: t.start },
    { key: 'notifyResults', label: t.results },
  ];

  const hint = errorMsg
    ?? (status === 'ios' ? t.ios : status === 'unsupported' ? t.unsupported : t.desc);

  return (
    <div className="p-5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] mb-6">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-11 h-11 rounded-lg shrink-0 flex items-center justify-center",
          status === 'subscribed' ? "bg-brand-red/10 text-brand-red" : "bg-white/5 text-gray-500"
        )}>
          {status === 'subscribed' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-[var(--text-main)]">{t.title}</div>
          <div className="text-xs text-gray-500">{hint}</div>
        </div>
        {status === 'unsupported' || status === 'ios' ? null : status === 'subscribed' ? (
          <button
            type="button"
            onClick={() => void handleDisable()}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[var(--card-border)] text-gray-500 hover:text-brand-red transition-colors"
          >
            <BellOff className="w-3.5 h-3.5" />
            {t.disable}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={status === 'checking' || status === 'busy'}
            className="shrink-0 px-4 py-2 rounded-lg bg-brand-red text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === 'checking' ? t.checking : t.enable}
          </button>
        )}
      </div>

      {status === 'subscribed' && (
        <div className="mt-4 pt-4 border-t border-[var(--card-border)] space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {prefRows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => onPrefChange(row.key, !prefs[row.key])}
                className={cn(
                  "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border text-left transition-colors",
                  prefs[row.key]
                    ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                    : "bg-white/5 border-white/10 text-gray-500 hover:text-[var(--text-main)]"
                )}
              >
                {row.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void handleTest()}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-red transition-colors"
            >
              {t.test}
            </button>
            {testMsg && <span className="text-[10px] text-gray-500 text-right">{testMsg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

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
        className="relative w-full sm:max-w-lg max-h-[90dvh] flex flex-col rounded-2xl overflow-hidden bg-[var(--header-bg)] border border-[var(--card-border)] shadow-2xl"
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
  followedCategoryIds: string[];
  followedTeamIds: string[];
  followedDriverIds: string[];
  priorityFollowIds: string[];
  onToggleCategory: (categoryId: string) => void;
  onToggleTeam: (categoryId: string, teamId: string) => void;
  onToggleDriver: (categoryId: string, driverId: string) => void;
  onMovePriority: (key: string, direction: -1 | 1) => void;
}

export function FavoritesPicker({
  categories, language, followedCategoryIds, followedTeamIds, followedDriverIds, priorityFollowIds,
  onToggleCategory, onToggleTeam, onToggleDriver, onMovePriority,
}: FavoritesPickerProps) {
  const t = TEXT[language];
  const followedCategorySet = useMemo(() => new Set(followedCategoryIds), [followedCategoryIds]);
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
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">{t.priorityOrder}</h3>
          {priorityEntries.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-black">
              {priorityEntries.length}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">{t.priorityOrderDesc}</p>
        {priorityEntries.length === 0 ? (
          <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-xs text-gray-500 text-center">
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-brand-red/30 transition-colors"
                >
                  <div className="w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-black text-gray-500 bg-white/5 rounded-full">
                    {index + 1}
                  </div>
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name}
                      className="w-10 h-10 rounded-lg object-contain shrink-0 bg-white/5 p-1"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg shrink-0 bg-white/5 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--text-main)] truncate">{entry.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0"
                        style={{ backgroundColor: `${entry.categoryAccent}22`, color: entry.categoryAccent }}
                      >
                        {entry.categoryName}
                      </span>
                      <span className="text-[10px] font-apex-mono uppercase tracking-widest text-gray-500 truncate">
                        {entry.kind === 'team' ? t.teamKind : t.driverKind}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={t.moveUp}
                      disabled={index === 0}
                      onClick={() => onMovePriority(entry.key, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-[var(--text-main)] hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t.moveDown}
                      disabled={index === priorityEntries.length - 1}
                      onClick={() => onMovePriority(entry.key, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-[var(--text-main)] hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t.remove}
                      onClick={() => entry.kind === 'team' ? onToggleTeam(entry.categoryId, entry.id) : onToggleDriver(entry.categoryId, entry.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-brand-red hover:bg-brand-red/10 transition-colors"
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
            const isCategoryFollowed = followedCategorySet.has(category.id);
            const categoryAccent = `#${category.teams[0]?.color?.replace('#', '') || 'C1121F'}`;
            const followedCount = category.teams.filter((tm) => followedTeamSet.has(`${category.id}::${tm.id}`)).length
              + category.drivers.filter((d) => followedDriverSet.has(`${category.id}::${d.id}`)).length;
            return (
              <div key={category.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedCategoryId(isExpanded ? null : category.id);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="w-[3px] h-6 rounded-full shrink-0" style={{ backgroundColor: categoryAccent }} />
                  <span className="text-sm font-bold text-[var(--text-main)] truncate flex-1">{category.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {followedCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-red/10 text-[10px] font-black text-brand-red">
                        <Heart className="w-3 h-3 fill-current" />{followedCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCategory(category.id);
                      }}
                      title={isCategoryFollowed ? t.followingCategory : t.followCategory}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        isCategoryFollowed ? "text-brand-red bg-brand-red/10" : "text-gray-500 hover:text-brand-red hover:bg-white/5"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", isCategoryFollowed && "fill-brand-red")} />
                    </button>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </div>
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
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
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
                                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
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
