import { useEffect, useState, type ReactNode } from 'react';
import PitstopIntro from './intro/PitstopIntro';

const SESSION_KEY = 'ph-intro-shown';

function hasShownIntro() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    // Modo privado / storage bloqueado: melhor nao repetir a intro em todo re-render.
    return true;
  }
}

function markIntroShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Sem storage disponivel, a intro so vai tocar de novo -- sem problema.
  }
}

export default function IntroGate({ children }: { children: ReactNode }) {
  const [showIntro, setShowIntro] = useState(() => !hasShownIntro());

  // O app real ja monta por baixo (comeca a buscar dados em paralelo); so trava o
  // scroll do body enquanto a intro cobre a tela por cima.
  useEffect(() => {
    if (!showIntro) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showIntro]);

  return (
    <>
      {children}
      {showIntro && (
        <PitstopIntro
          onDone={() => {
            markIntroShown();
            setShowIntro(false);
          }}
        />
      )}
    </>
  );
}
