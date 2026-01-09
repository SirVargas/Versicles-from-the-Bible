const CACHE_NAME = 'biblia-v13-FAST-LOAD'; // Incrementamos versión
const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',
  './img/icon.png',
  './img/badge.png',
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
  self.clients.claim();
});

// --- ESTRATEGIA: STALE-WHILE-REVALIDATE ---
// 1. Muestra caché inmediatamente (Velocidad).
// 2. Va a la red en segundo plano para actualizar caché (Actualización).
self.addEventListener('fetch', (event) => {
  // Ignorar API (siempre red)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        
        // Promesa de Red: Busca lo nuevo y actualiza el caché
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
           // Si falla la red, no pasa nada, ya mostramos el caché
        });

        // Si hay caché, devuélvelo YA. Si no, espera a la red.
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Notificaciones (Igual que antes)
self.addEventListener('push', function(event) {
  let data = { title: 'Biblia', body: 'Nueva bendición disponible', url: './' };
  try { data = { ...data, ...event.data.json() }; } catch (e) { data.body = event.data.text(); }

  const options = {
    body: data.body,
    icon: './img/icon.png',
    badge: './img/badge.png',
    data: { url: data.url },
    requireInteraction: true,
    tag: 'verse-of-the-day',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clic en notificación
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope)) {
            // Enfoca y navega para forzar actualización visual
            return client.focus().then(() => client.navigate('./'));
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
