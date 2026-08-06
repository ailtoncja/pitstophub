export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Falha ao registrar o service worker.', error);
    });
  });

  // Com skipWaiting + clientsClaim, o novo service worker assume o controle
  // de abas ja abertas sem elas saberem: sem este reload, a aba continua
  // rodando o bundle antigo ate ser fechada e reaberta manualmente.
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
