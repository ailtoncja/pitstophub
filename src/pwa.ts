export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Falha ao registrar o service worker.', error);
    });
  });

  // Antes, um `controllerchange` (novo service worker assumindo) disparava
  // window.location.reload() assim que a aba ficasse oculta (troca de app,
  // tela bloqueada). O problema: o Supabase SO renova o token de sessao com
  // a aba em primeiro plano, e para/retoma esse timer exatamente nos mesmos
  // eventos de visibilitychange. Reload e renovacao de token disputando o
  // mesmo gatilho abriam uma corrida real: a pagina antiga (prestes a sumir)
  // e a pagina nova (recem recarregada) podiam tentar renovar o token quase
  // juntas: como o refresh token do Supabase so vale uma vez, a segunda
  // tentativa falhava e a pessoa aparecia deslogada sem motivo aparente.
  //
  // Por isso NAO forcamos mais reload aqui. Com clientsClaim, o novo service
  // worker so passa a responder as proximas requisicoes de rede da aba ja
  // aberta -- o bundle JS que ja esta rodando continua rodando normalmente
  // ate a pessoa fechar e reabrir o app, quando ai sim pega a versao nova,
  // sem overlap entre dois clientes Supabase disputando o mesmo refresh token.
}
