const CACHE_NAME = 'biblia-v16-URL-FIX'; // Versión nueva
const urlsToCache = [
  '/', 
  '/index.html',
  '/js/verses.js',
  '/img/icon.png',
  '/img/badge.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
    })
  )));
  self.clients.claim();
});

// Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {});
        return cachedResponse || fetchPromise;
      });
    })
  );
});

self.addEventListener('push', function(event) {
  let data = { title: 'Biblia', body: 'Nueva bendición disponible', url: '/' };
  try { data = { ...data, ...event.data.json() }; } catch (e) { data.body = event.data.text(); }

  const options = {
    body: data.body,
    icon: '/img/icon.png',
    badge: '/img/badge.png',
    data: { url: data.url }, // Mantenemos data.url
    requireInteraction: true,
    tag: 'verse-of-the-day',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// --- CLIC CON URL EXACTA ---
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // USAMOS TU URL EXACTA AQUÍ
  const targetUrl = 'https://versicles-from-the-bible.vercel.app/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // 1. Si la App ya está abierta, la enfocamos
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl || client.url.startsWith(targetUrl)) {
            return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      // 2. Si no, abrimos la App
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
