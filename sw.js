const CACHE_NAME = 'biblia-sync-v1'; // Cambiamos nombre para forzar actualización
const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',
  './img/icon.png',
  './manifest.json'
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
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// --- PUSH CON ETIQUETA (TAG) ---
self.addEventListener('push', function(event) {
  let data = { title: 'Biblia', body: 'Nueva bendición disponible', url: './' };
  
  if (event.data) {
    try {
        const json = event.data.json();
        data = { ...data, ...json };
    } catch (e) {
        data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './img/icon.png',
    badge: './img/icon.png',
    data: { url: data.url },
    requireInteraction: true,
    tag: 'verse-of-the-day', // <--- ESTO EVITA LA ACUMULACIÓN
    renotify: true           // <--- Vuelve a sonar/vibrar al actualizarse
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then( windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === './' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
