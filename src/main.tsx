import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AuthGate from './AuthGate.tsx';
import IntroGate from './IntroGate.tsx';
import './index.css';
import { registerServiceWorker } from './pwa';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntroGate>
      <AuthGate />
    </IntroGate>
  </StrictMode>,
);
