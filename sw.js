const CACHE_NAME = 'biblia-v10-FORCE-UPDATE'; // <--- CAMBIO CRÍTICO
const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',
  './img/icon.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // <--- OBLIGA A ACTIVARSE DE INMEDIATO
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName !== CACHE_NAME) {
          console.log("Borrando caché viejo:", cacheName);
          return caches.delete(cacheName);
      }
    })
  )));
  self.clients.claim(); // <--- TOMA CONTROL INMEDIATO DE LA PÁGINA
});

self.addEventListener('fetch', (event) => {
  // Las APIs NUNCA se cachean, siempre van a red
  if (event.request.url.includes('/api/')) {
      return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// --- PUSH CON ETIQUETA (TAG) PARA EVITAR ACUMULACIÓN ---
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
    badge: './img/badge.png', // Asegúrate de tener este archivo
    data: { url: data.url },
    requireInteraction: true,
    tag: 'verse-of-the-day', // <--- ESTA ETIQUETA HACE LA MAGIA (Reemplaza la anterior)
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope)) {
            return client.focus().then(() => client.navigate('./')); // Recarga forzosa
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
