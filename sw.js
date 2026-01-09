const CACHE_NAME = 'biblia-push-v1';
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
  // Estrategia Network First para API, Cache First para archivos
  if (event.request.url.includes('/api/')) {
    return; // Dejar pasar las llamadas a la API
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// --- AQUÍ OCURRE LA MAGIA DEL PUSH ---
self.addEventListener('push', function(event) {
  let data = {};
  
  if (event.data) {
    data = event.data.json(); // Leemos lo que mandó Vercel
  } else {
    data = { title: 'Biblia', body: 'Nuevo versículo disponible' };
  }

  const options = {
    body: data.body,
    icon: './img/icon.png',  // Icono local
    badge: './img/icon.png', // Badge local
    data: { url: data.url || './' }, // Guardamos la URL para abrirla al tocar
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Al tocar la notificación, abrimos la app
  event.waitUntil(
    clients.matchAll({type: 'window'}).then( windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === './' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
