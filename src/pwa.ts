export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Falha ao registrar o service worker.', error);
    });
  });

  // Com skipWaiting + clientsClaim, o novo service worker assume o controle
  // de abas ja abertas sem elas saberem: sem este reload, a aba continua
  // rodando o bundle antigo ate ser fechada e reaberta manualmente. Mas
  // recarregar na hora, no meio do uso (ex: enquanto a pessoa esta logada
  // navegando), interrompe a sessao em andamento e da a impressao de que o
  // app "deslogou sozinho". Em vez disso, so recarrega quando a aba estiver
  // em segundo plano (troca de app, tela bloqueada, etc) -- nunca durante
  // uso ativo.
  let reloaded = false;
  const reloadWhenSafe = () => {
    if (reloaded) return;
    if (document.visibilityState === 'hidden') {
      reloaded = true;
      window.location.reload();
      return;
    }
    document.addEventListener('visibilitychange', reloadWhenSafe, { once: true });
  };
  navigator.serviceWorker.addEventListener('controllerchange', reloadWhenSafe);
}
