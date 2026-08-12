export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  let registration: ServiceWorkerRegistration | null = null;
  let hasBeenBackgrounded = false;
  let reloadedForUpdate = false;
  // Se ja existe um service worker controlando esta pagina desde o boot, isto
  // nao e a primeira instalacao -- e uma reabertura do app que ja tinha uma
  // versao anterior. So nesse caso faz sentido forcar reload por causa de
  // atualizacao (ver listener de controllerchange abaixo).
  const hadControllerAtBoot = navigator.serviceWorker.controller != null;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;
        // Forca a checagem de atualizacao ja no boot, sem esperar o app ficar
        // visivel de novo -- e o que faz o "fechou e abriu de novo o app"
        // pegar a versao nova na hora, em vez de so na proxima volta do
        // segundo plano.
        void reg.update().catch(() => {});
      })
      .catch((error) => {
        console.error('Falha ao registrar o service worker.', error);
      });
  });

  // O navegador so checa sozinho se ha uma versao nova do service worker em
  // alguns gatilhos, e o PWA instalado (modo standalone, principalmente no
  // iOS) e' conhecido por nao fazer essa checagem de forma confiavel. Forca
  // uma checagem manual toda vez que o app volta a ficar visivel (reabrir
  // pelo icone, voltar de outro app) -- so compara o sw.js publicado com o
  // instalado, nunca recarrega a pagina sozinho por padrao (ver comentario
  // abaixo sobre a excecao do boot).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void registration?.update().catch(() => {});
    } else {
      hasBeenBackgrounded = true;
    }
  });

  // Excecao ao "nunca recarrega sozinho": se um service worker novo assumir o
  // controle ANTES do app ser colocado em segundo plano pela primeira vez
  // nesta sessao, recarrega uma unica vez. Esse e exatamente o caso de
  // "fechar e reabrir o app" que o usuario pediu -- o app acabou de abrir, o
  // service worker novo (baixado e ativado com skipWaiting/clientsClaim
  // enquanto o app estava fechado ou no boot) acaba de assumir, e nao existe
  // nenhuma outra aba/instancia viva por perto disputando a renovacao do
  // token do Supabase, entao o reload aqui e seguro. Depois que o app for
  // para segundo plano uma vez, essa excecao se desliga e valem as regras
  // de sempre (ver comentario grande abaixo).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate || hasBeenBackgrounded || !hadControllerAtBoot) return;
    reloadedForUpdate = true;
    window.location.reload();
  });

  // Antes, um `controllerchange` disparava window.location.reload() sempre
  // que ocorresse, inclusive assim que a aba ficasse oculta (troca de app,
  // tela bloqueada). O problema: o Supabase SO renova o token de sessao com
  // a aba em primeiro plano, e para/retoma esse timer exatamente nos mesmos
  // eventos de visibilitychange. Reload e renovacao de token disputando o
  // mesmo gatilho abriam uma corrida real: a pagina antiga (prestes a sumir)
  // e a pagina nova (recem recarregada) podiam tentar renovar o token quase
  // juntas: como o refresh token do Supabase so vale uma vez, a segunda
  // tentativa falhava e a pessoa aparecia deslogada sem motivo aparente.
  //
  // Por isso o reload automatico so acontece na excecao de boot acima (app
  // recem-aberto, nunca foi para segundo plano nesta sessao -- logo nao ha
  // pagina antiga viva por perto). Fora dessa janela, com clientsClaim, o
  // novo service worker so passa a responder as proximas requisicoes de rede
  // da aba ja aberta -- o bundle JS que ja esta rodando continua normalmente
  // ate a pessoa fechar e reabrir o app, quando ai sim pega a versao nova.
}
