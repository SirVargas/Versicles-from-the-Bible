const CACHE_NAME = 'biblia-cache-v2';
// Lista de archivos para guardar y que funcione Offline
const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',       // <--- IMPORTANTE: Guardamos la base de datos
  './img/icon.png',
  './manifest.json'
];

// 1. INSTALACIÓN: Guardamos los archivos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Archivos cacheados correctamente');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. ACTIVACIÓN: Limpiamos cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. INTERCEPTOR: Servimos archivos desde el caché si no hay internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en caché, lo devolvemos. Si no, lo pedimos a internet.
        return response || fetch(event.request);
      })
  );
});

// 4. NOTIFICACIONES: Abrir la app al tocar
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
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
