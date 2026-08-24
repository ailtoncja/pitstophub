// Handlers de push notification. Importado dentro do service worker gerado
// pelo vite-plugin-pwa via workbox.importScripts (ver vite.config.ts) -- o
// generateSW ja cuida do precache, este arquivo so adiciona os eventos que
// ele nao sabe gerar sozinho.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'PitStopHub', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'PitStopHub';
  const kind = payload.kind || '';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/' },
    tag: payload.tag || 'pitstophub',
    renotify: true,
    vibrate: kind === 't-0' ? [300, 100, 300, 100, 300] : [200, 100, 200],
    requireInteraction: kind === 't-0' || kind === 't-60',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'pitstophub-open', url });
          const navigate = typeof client.navigate === 'function' ? client.navigate(url) : Promise.resolve();
          return navigate.then(() => client.focus());
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
