import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Folha inferior no celular, modal centralizado no desktop. Fecha com Esc, toque no fundo ou no X,
 * trava a rolagem da pagina e devolve o foco ao botao que a abriu.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Quem abre a folha costuma passar um onClose novo a cada render; guardar na ref evita refazer o efeito
  // (e roubar o foco do campo de busca) toda vez que o pai atualiza.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ y: 40, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'relative w-full md:max-w-lg max-h-[88dvh] overflow-y-auto rounded-t-lg md:rounded-lg bg-surface border border-hairline shadow-[0_-8px_40px_rgba(0,0,0,0.6)] outline-none pb-safe',
              className,
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-margin py-3 bg-surface/95 backdrop-blur border-b-2 border-outline-variant">
              <h2 className="type-headline-md uppercase text-on-surface truncate border-l-4 border-primary pl-3">{title}</h2>
              <button type="button" onClick={onClose} aria-label={closeLabel} className="w-9 h-9 -mr-2 flex items-center justify-center rounded-sm text-primary hover:text-white active:scale-95 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-margin py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
