/* A5 service worker v2: push notifications + smart Supabase media & font cache
   (never caches HTML/JS/CSS/config so app updates are always immediate). */
const A5_MEDIA_CACHE = 'a5-supabase-media-v2';
const A5_FONT_CACHE = 'a5-google-fonts-v1';
const A5_MEDIA_MAX_ENTRIES = 180;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('a5-') && key !== A5_MEDIA_CACHE && key !== A5_FONT_CACHE)
          .map((key) => caches.delete(key))
      );
    } catch (_) {}
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'a5-clear-media-cache') {
    event.waitUntil(caches.delete(A5_MEDIA_CACHE).catch(() => {}));
  }
});

function isCacheableSupabaseImage(url, request) {
  if (request.method !== 'GET' || request.headers.has('range')) return false;
  if (!url.pathname.includes('/storage/v1/object/sign/')) return false;
  if (!url.pathname.includes('/memory-media/') && !url.pathname.includes('/profile-avatars/')) return false;
  if (url.searchParams.has('download')) return false;
  const lower = url.pathname.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.endsWith('.m4v')) {
    return false;
  }
  return true;
}

function isGoogleFontAsset(url, request) {
  return request.method === 'GET' && (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com');
}

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const overflow = keys.length - maxEntries;
    for (let i = 0; i < overflow; i++) {
      await cache.delete(keys[i]);
    }
  } catch (_) {}
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  let url;
  try { url = new URL(request.url); }
  catch (_) { return; }

  if (isGoogleFontAsset(url, request)) {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(A5_FONT_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return fetch(request);
      }
    })());
    return;
  }

  if (isCacheableSupabaseImage(url, request)) {
    // Key by pathname (without rotating token query string) so even if a signed
    // URL token refreshes, the immutable Storage object hits the local cache!
    const cacheKeyUrl = `${url.origin}${url.pathname}`;
    event.respondWith((async () => {
      try {
        const cache = await caches.open(A5_MEDIA_CACHE);
        const cached = await cache.match(cacheKeyUrl);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.ok && response.status === 200) {
          cache.put(cacheKeyUrl, response.clone())
            .then(() => trimCache(A5_MEDIA_CACHE, A5_MEDIA_MAX_ENTRIES))
            .catch(() => {});
        }
        return response;
      } catch (_) {
        return fetch(request);
      }
    })());
  }
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
