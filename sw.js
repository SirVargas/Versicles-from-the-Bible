const CACHE_NAME = 'biblia-v27-OFFLINE-QUEUE'; // Subimos versión
const urlsToCache = [
  '/',                
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
    data: { url: data.url },
    requireInteraction: true,
    tag: 'verse-of-the-day',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// --- CLIC INTELIGENTE (Solución Pestañas Duplicadas) ---
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // URL destino (La raíz de tu sitio)
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Buscamos cualquier cliente que pertenezca a nuestro dominio/scope
      const matchingClient = windowClients.find(client => 
        client.url === urlToOpen || 
        client.url.includes(self.registration.scope) || 
        client.url.includes('index.html')
      );

      if (matchingClient) {
        // Si encontramos uno (sea App o Pestaña), lo enfocamos y recargamos
        return matchingClient.focus().then(() => matchingClient.navigate(urlToOpen));
      }
      
      // Si no hay ninguno abierto, abrimos uno nuevo
      return clients.openWindow(urlToOpen);
    })
  );
});
