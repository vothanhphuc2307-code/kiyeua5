/* A5 service worker: no aggressive shell cache, to avoid serving stale app/config. */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  const title = String(data.title || 'NHỮNG BÉ BÁO 12A5');
  const options = {
    body: String(data.body || 'A5 vừa có một tin nhắn mới. Ghé xem nhé ♡'),
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: String(data.tag || 'a5-notice'),
    renotify: false,
    data: { url: data.url || '/?from=notification' },
    vibrate: [80, 30, 80]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification?.data?.url || '/';
  event.waitUntil((async () => {
    let target;
    try { target = new URL(rawUrl, self.location.origin); }
    catch (_) { target = new URL('/', self.location.origin); }
    if (target.origin !== self.location.origin) target = new URL('/', self.location.origin);
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if ('focus' in client) {
        if ('navigate' in client) await client.navigate(target.href);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target.href);
  })());
});
