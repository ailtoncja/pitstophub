import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronRight, Crown, Heart, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import { CATEGORY_GROUPS, accentOf, categorySummary } from '../lib/categories-meta';
import { iconOfCategory } from '../lib/category-icons';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import { useSettings } from '../state/settings';
import type { Category } from '../types';
import { paths } from './paths';

const TAB_SECTIONS = new Set(['', 'calendario', 'classificacao', 'grid']);

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Menu lateral: todas as categorias, agrupadas, com icone, seguir e atalho para a pagina da categoria (igual ao app). */
export function CategoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { categories } = useLiveData();
  const { selectedId, select } = useSelectedCategory();
  const settings = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open]);

  const byId = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const today = todayIso();

  const choose = (category: Category) => {
    select(category.id);
    // Em paginas de detalhe (piloto, equipe, circuito...) a escolha leva para o inicio da categoria.
    if (!TAB_SECTIONS.has(pathname.split('/')[1] ?? '')) navigate(paths.home);
    onClose();
  };

  const toggleFollow = (category: Category) => {
    const following = settings.isFollowingCategory(category.id);
    if (settings.toggleCategory(category.id)) {
      toast.show(following ? t('toast.unfollowed', { name: category.name }) : t('toast.followed', { name: category.name }), { kind: 'ok' });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[210]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          <button type="button" aria-label={t('common.close')} onClick={onClose} className="absolute inset-0 bg-black/70 cursor-default" />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('drawer.title')}
            tabIndex={-1}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 left-0 w-[340px] max-w-[88vw] bg-surface overflow-y-auto outline-none pb-safe pt-safe border-r border-hairline"
          >
            <div className="flex items-center gap-3 px-5 py-[18px]">
              <img src="/icons/icon-192.png" alt="" className="w-10 h-10 object-contain" />
              <div className="flex-1 min-w-0">
                <p className="type-headline-md uppercase text-primary">{t('drawer.title')}</p>
                <p className="type-label-badge text-on-surface-variant">{t('drawer.subtitle', { n: categories.length })}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t('common.close')} className="w-9 h-9 -mr-2 flex items-center justify-center text-on-surface-variant hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 space-y-2">
              <Link to={paths.categories} onClick={onClose} className="flex items-center justify-between rounded-sm bg-surface-container-high border border-hairline px-3.5 py-3 type-label-badge uppercase tracking-wider text-on-surface hover:bg-surface-container-highest">
                {t('drawer.explore')}
                <ArrowRight className="w-[18px] h-[18px] text-primary" />
              </Link>
              <Link to={paths.champions} onClick={onClose} className="flex items-center justify-between rounded-sm bg-surface-container-high border border-hairline px-3.5 py-3 type-label-badge uppercase tracking-wider text-on-surface hover:bg-surface-container-highest">
                <span className="inline-flex items-center gap-2"><Crown className="w-4 h-4 text-primary" />{t('drawer.champions')}</span>
                <ArrowRight className="w-[18px] h-[18px] text-primary" />
              </Link>
            </div>
            <div className="h-2" />
            <div className="border-t-2 border-outline-variant" />

            {CATEGORY_GROUPS.map((group) => {
              const items = group.ids.map((id) => byId.get(id)).filter((c): c is Category => Boolean(c));
              if (items.length === 0) return null;
              return (
                <section key={group.id}>
                  <div className="flex items-center gap-2.5 px-5 pt-[22px] pb-2">
                    <span className="type-label-badge uppercase text-on-surface-variant">{group.label[lang]}</span>
                    <span className="flex-1 h-px bg-hairline-soft" />
                    <span className="type-label-badge text-on-surface-variant">{items.length}</span>
                  </div>
                  {items.map((category) => {
                    const selected = category.id === selectedId;
                    const accent = accentOf(category.id);
                    const Icon = iconOfCategory(category.id);
                    const following = settings.isFollowingCategory(category.id);
                    const liveToday = category.calendar.some((race) => race.status !== 'cancelled' && race.date === today);
                    return (
                      <div key={category.id} className={cn('mx-3 my-0.5 flex items-center rounded-lg', selected && 'bg-primary-container/[0.16]')}>
                        <span className={cn('w-[3px] h-12 shrink-0', selected ? 'bg-primary-container' : 'bg-transparent')} aria-hidden />
                        <button type="button" onClick={() => choose(category)} className="flex-1 min-w-0 flex items-center gap-3 pl-3 py-1.5 text-left" aria-current={selected ? 'true' : undefined}>
                          <span className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${accent}29`, borderColor: `${accent}66` }}>
                            <Icon className="w-[22px] h-[22px]" style={{ color: accent }} />
                          </span>
                          <span className="min-w-0 flex-1 py-1">
                            <span className="flex items-center gap-1.5">
                              <span className={cn('font-inter text-[14px] leading-5 line-clamp-2', selected ? 'text-primary font-bold' : 'text-on-surface font-medium')}>
                                {lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}
                              </span>
                              {liveToday && <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse shrink-0" aria-hidden />}
                            </span>
                            <span className="type-label-telemetry uppercase text-on-surface-variant block truncate">{categorySummary(category, lang).replace(/ • /g, ' · ') || category.name}</span>
                          </span>
                        </button>
                        <button type="button" onClick={() => toggleFollow(category)} aria-pressed={following} aria-label={following ? t('common.following') : t('common.follow')} className="w-10 h-11 flex items-center justify-center shrink-0">
                          <Heart className={cn('w-5 h-5', following ? 'fill-primary-container text-primary-container' : 'text-on-surface-variant/70')} />
                        </button>
                        <Link to={paths.category(category.id)} onClick={onClose} aria-label={t('drawer.about')} className="w-9 h-11 flex items-center justify-center shrink-0 text-on-surface-variant/70 hover:text-white">
                          <ChevronRight className="w-[18px] h-[18px]" />
                        </Link>
                      </div>
                    );
                  })}
                </section>
              );
            })}
            <div className="h-6" />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
