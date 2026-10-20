// Protecoes comuns dos jobs de push (send-race-notifications.mjs e
// send-result-notifications.mjs). As linhas de push_subscriptions e
// user_settings sao escritas pelo proprio usuario no navegador, entao o job
// nao confia nelas: o endpoint tem que ser de um servico de push conhecido
// (senao o job viraria um "fetch para qualquer URL" com a chave VAPID) e o
// fuso tem que ser valido (senao o Intl derruba o job inteiro).

export const DEFAULT_TZ = 'America/Sao_Paulo';

// Servicos de push dos navegadores (Chrome/Edge/Android, Safari, Firefox, Windows/WNS).
const ALLOWED_PUSH_HOSTS = ['fcm.googleapis.com', 'web.push.apple.com', 'updates.push.services.mozilla.com'];
const ALLOWED_PUSH_HOST_SUFFIXES = ['.notify.windows.com'];

/** true so para https:// em um host de push conhecido (sem porta nem credenciais na URL). */
export function isAllowedPushEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return false;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_PUSH_HOSTS.includes(host) || ALLOWED_PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** Fuso IANA valido ou o padrao (America/Sao_Paulo). */
export function safeTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
    return timeZone;
  } catch {
    return DEFAULT_TZ;
  }
}
