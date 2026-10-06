import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, CheckCircle2, Info, type LucideIcon } from 'lucide-react';

type ToastKind = 'ok' | 'alert' | 'info';
type ToastState = { id: number; message: string; kind: ToastKind; actionLabel?: string; onAction?: () => void };

type ToastApi = {
  show: (message: string, options?: { kind?: ToastKind; actionLabel?: string; onAction?: () => void }) => void;
};

const ToastContext = createContext<ToastApi>({ show: () => undefined });

const ICONS: Record<ToastKind, LucideIcon> = { ok: CheckCircle2, alert: BellRing, info: Info };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback<ToastApi['show']>((message, options) => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind: options?.kind ?? 'ok', actionLabel: options?.actionLabel, onAction: options?.onAction });
    timer.current = window.setTimeout(() => setToast(null), options?.actionLabel ? 5000 : 2400);
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const Icon = toast ? ICONS[toast.kind] : CheckCircle2;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 md:bottom-8 z-[300] flex justify-center px-margin" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2.5 bg-surface-raised border border-surface-border rounded-xl pl-3 pr-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.5)] max-w-sm"
            >
              <Icon className="w-4 h-4 text-racing-red shrink-0" aria-hidden />
              <span className="type-label-telemetry uppercase tracking-wider text-text-primary">{toast.message}</span>
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    setToast(null);
                  }}
                  className="ml-1 px-2.5 py-1.5 rounded-lg bg-racing-red text-white type-label-badge uppercase tracking-wider active:scale-95"
                >
                  {toast.actionLabel}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
