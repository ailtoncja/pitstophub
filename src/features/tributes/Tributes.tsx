import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bug, Heart } from 'lucide-react';

// Homenagens pessoais escondidas (easter eggs) do site. Os textos sao os mesmos do App.tsx antigo.
//  - 5 toques na foto do Hamilton           -> "Para Thata"
//  - segurar a foto do Hamilton por 5 s      -> "Bug Hunters — Para Nay"
//  - 5 toques no logo do rodape              -> "Bug Hunters — Para Lucas"
//  - 5 toques no brasao da AF Corse (WEC)    -> "Bug Hunters — Para Brunão"
// Cada uma pede 2 toques para fechar (absorve o "clique fantasma" de quem solta o dedo apos segurar).

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 };

type TributeId = 'thata' | 'nay' | 'lucas' | 'brunao';

type TributeDef = {
  color: string;
  icon: 'heart' | 'bug';
  iconInk: string;
  label: string;
  text: string;
};

const TRIBUTES: Record<TributeId, TributeDef> = {
  thata: {
    color: '#00D2BE',
    icon: 'heart',
    iconInk: 'text-black',
    label: 'Para Thata',
    text: 'Obrigado pelas lições de vida e pela ajuda no app, sou eternamente grato.',
  },
  nay: {
    color: '#DC0000',
    icon: 'heart',
    iconInk: 'text-white',
    label: 'Bug Hunters — Para Nay',
    text: 'Obrigado pela ajuda na facul e no app, você é incrível.',
  },
  lucas: {
    color: '#4ADE80',
    icon: 'bug',
    iconInk: 'text-black',
    label: 'Bug Hunters — Para Lucas',
    text: 'Obrigado pela ajuda em tudo, não só no app.',
  },
  brunao: {
    color: '#4ADE80',
    icon: 'bug',
    iconInk: 'text-black',
    label: 'Bug Hunters — Para Brunão',
    text: 'Vlw por me ajudar a voltar pros eixos meu querido, sem você eu não estaria aqui, tmj irmão.',
  },
};

type TributesApi = {
  onHamiltonTap: () => void;
  onHamiltonHoldStart: () => void;
  onHamiltonHoldEnd: () => void;
  onFooterLogoTap: () => void;
  onFerrariWecTap: () => void;
};

const noop = () => undefined;
const TributesContext = createContext<TributesApi>({
  onHamiltonTap: noop,
  onHamiltonHoldStart: noop,
  onHamiltonHoldEnd: noop,
  onFooterLogoTap: noop,
  onFerrariWecTap: noop,
});

export const useTributes = () => useContext(TributesContext);

/** Conta N toques seguidos (janela de 2,5 s entre toques) e dispara `onReach`. */
function useTapCounter(required: number, onReach: () => void) {
  const count = useRef(0);
  const timer = useRef<number | null>(null);
  return useCallback(() => {
    count.current += 1;
    if (timer.current) window.clearTimeout(timer.current);
    if (count.current >= required) {
      count.current = 0;
      onReach();
      return;
    }
    timer.current = window.setTimeout(() => {
      count.current = 0;
    }, 2500);
  }, [required, onReach]);
}

export function TributesProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<TributeId | null>(null);
  const dismissTaps = useRef(0);
  const holdTimer = useRef<number | null>(null);

  const show = useCallback((id: TributeId) => {
    dismissTaps.current = 0;
    setOpen(id);
  }, []);

  const onHamiltonTap = useTapCounter(5, useCallback(() => show('thata'), [show]));
  const onFooterLogoTap = useTapCounter(5, useCallback(() => show('lucas'), [show]));
  const onFerrariWecTap = useTapCounter(5, useCallback(() => show('brunao'), [show]));

  const onHamiltonHoldStart = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => show('nay'), 5000);
  }, [show]);

  const onHamiltonHoldEnd = useCallback(() => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const dismissTap = useCallback(() => {
    dismissTaps.current += 1;
    if (dismissTaps.current >= 2) {
      dismissTaps.current = 0;
      setOpen(null);
    }
  }, []);

  const api = useMemo<TributesApi>(
    () => ({ onHamiltonTap, onHamiltonHoldStart, onHamiltonHoldEnd, onFooterLogoTap, onFerrariWecTap }),
    [onHamiltonTap, onHamiltonHoldStart, onHamiltonHoldEnd, onFooterLogoTap, onFerrariWecTap],
  );

  const def = open ? TRIBUTES[open] : null;

  return (
    <TributesContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {def && (
          <motion.div
            key={open}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissTap}
            className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={SPRING}
              className="relative max-w-sm w-full text-center"
            >
              <div className="absolute inset-0 -z-10 blur-3xl opacity-40 rounded-full" style={{ backgroundColor: def.color }} />
              <div className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: def.color }}>
                {def.icon === 'heart' ? <Heart className={`w-6 h-6 ${def.iconInk}`} fill="currentColor" /> : <Bug className={`w-6 h-6 ${def.iconInk}`} />}
              </div>
              <div className="type-label-badge text-[0.8125rem] mb-3" style={{ color: def.color }}>
                {def.label}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-white leading-snug text-balance">{def.text}</p>
              <p className="type-label-telemetry text-silver-dim mt-6">(toque 2x pra fechar)</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TributesContext.Provider>
  );
}
