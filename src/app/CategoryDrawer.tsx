import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Crown, X } from 'lucide-react';
import { CategoryList } from '../components/CategoryList';
import { useT } from '../lib/i18n';
import { paths } from './paths';

/** Gaveta de categorias (celular): a mesma lista do trilho lateral, para trocar de categoria sem sair da pagina. */
export function CategoryDrawer({ open, onClose, activeId }: { open: boolean; onClose: () => void; activeId?: string | null }) {
  const { t } = useT();
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
            className="absolute inset-y-0 left-0 w-[320px] max-w-[88vw] bg-black overflow-y-auto outline-none pb-safe pt-safe border-r border-hairline"
          >
            <div className="flex items-center justify-between gap-3 px-5 h-16">
              <p className="type-headline-md text-white">{t('drawer.title')}</p>
              <button type="button" onClick={onClose} aria-label={t('common.close')} className="w-11 h-11 -mr-3 flex items-center justify-center text-silver hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 pb-8 space-y-4">
              <Link to={paths.champions} onClick={onClose} className="flex items-center gap-3 h-11 px-3 rounded-xl text-silver hover:text-white hover:bg-white/10 type-body-md">
                <Crown className="w-[18px] h-[18px]" />
                {t('drawer.champions')}
              </Link>
              <CategoryList activeId={activeId} onNavigate={onClose} />
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
