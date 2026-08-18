import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AuthGate from './AuthGate.tsx';
import IntroGate from './IntroGate.tsx';
import './index.css';
import { registerServiceWorker } from './pwa';

registerServiceWorker();

// Impede o menu nativo de "salvar imagem"/context menu ao segurar em cima de
// fotos (toque longo no mobile ou botao direito no desktop) -- interferia com
// gestos de toque/segurar no app (ex.: easter eggs) e nao agrega nada aqui,
// ja que as imagens nao sao baixaveis pelo usuario final.
document.addEventListener('contextmenu', (event) => {
  if (event.target instanceof HTMLImageElement) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntroGate>
      <AuthGate />
    </IntroGate>
  </StrictMode>,
);
