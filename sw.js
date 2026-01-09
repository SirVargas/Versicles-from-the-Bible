const CACHE_NAME = 'biblia-push-v5'; // Versión 5 para forzar actualización
const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',       // Importante cachear esto
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
  // Las llamadas a /api/ NO se guardan en caché
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// ESCUCHAR NOTIFICACIÓN PUSH (Desde Vercel)
self.addEventListener('push', function(event) {
  let data = event.data ? event.data.json() : { title: 'Biblia', body: 'Nuevo mensaje' };
  
  const options = {
    body: data.body,
    icon: './img/icon.png',
    badge: './img/icon.png',
    data: { url: './' },
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
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
