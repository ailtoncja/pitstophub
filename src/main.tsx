import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './app/AppRouter';
import AuthGate from './AuthGate';
import { ToastProvider } from './components/Toast';
import { TributesProvider } from './features/tributes/Tributes';
import IntroGate from './IntroGate';
import './index.css';
import { LiveDataProvider } from './state/live-data';
import { SettingsProvider } from './state/settings';

// Remove service workers e caches antigos do PWA em navegadores que ja visitaram o site.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        const scriptUrl =
          registration.active?.scriptURL ||
          registration.waiting?.scriptURL ||
          registration.installing?.scriptURL ||
          '';
        if (scriptUrl.endsWith('/sw.js')) {
          void registration.unregister();
        }
      }
    })
    .catch(() => {});
}
if ('caches' in window) {
  caches
    .keys()
    .then((keys) => {
      for (const key of keys) {
        if (key.startsWith('workbox-')) {
          void caches.delete(key);
        }
      }
    })
    .catch(() => {});
}

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
      <AuthGate>
        <SettingsProvider>
          <LiveDataProvider>
            <ToastProvider>
              <TributesProvider>
                <AppRouter />
              </TributesProvider>
            </ToastProvider>
          </LiveDataProvider>
        </SettingsProvider>
      </AuthGate>
    </IntroGate>
  </StrictMode>,
);
