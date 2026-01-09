// CAMBIA ESTO CADA VEZ QUE HAGAS UN UPDATE
const CACHE_NAME = 'biblia-v12-NETWORK-FIRST'; 

const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',
  './img/icon.png',
  './img/badge.png',
  './manifest.json'
];

// 1. Instalación
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 2. Activación (Limpieza de caché viejo)
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
    })
  )));
  self.clients.claim();
});

// 3. ESTRATEGIA DE RED HÍBRIDA (LO MÁS IMPORTANTE)
self.addEventListener('fetch', (event) => {
  // A. Las APIs nunca se cachean
  if (event.request.url.includes('/api/')) return;

  // B. Para la Navegación (HTML): INTERNET PRIMERO (Network First)
  // Esto obliga a bajar siempre la última versión del index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Si no hay internet, usa el caché
          return caches.match(event.request);
        })
    );
    return;
  }

  // C. Para Archivos (JS, CSS, Imágenes): CACHÉ PRIMERO (Cache First)
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// 4. Notificaciones Push
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
    badge: './img/badge.png',
    data: { url: data.url },
    requireInteraction: true,
    tag: 'verse-of-the-day', // Evita acumulación
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Clic en Notificación
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope)) {
            return client.focus().then(() => client.navigate('./'));
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
