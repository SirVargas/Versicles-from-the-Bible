// --- CONFIGURACIÓN DE VERSIÓN ---
// El index.html lee esto para el footer. ¡Cámbialo cuando hagas updates!
const CACHE_NAME = 'biblia-v11-SYNC-FIX'; 

const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',
  './img/icon.png',
  './img/badge.png',
  './manifest.json'
];

// 1. Instalación (Fuerza la espera para actualizar rápido)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 2. Activación (Borra cachés viejos para evitar conflictos)
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
    })
  )));
  self.clients.claim(); // Toma control inmediato
});

// 3. Intercepción de Red (Estrategia: Caché primero, excepto API)
self.addEventListener('fetch', (event) => {
  // Las APIs NUNCA se cachean, van directo a la red
  if (event.request.url.includes('/api/')) {
      return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// 4. MANEJO DE NOTIFICACIONES (PUSH)
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
    badge: './img/badge.png', // Icono pequeño (silueta blanca)
    data: { url: data.url },
    requireInteraction: true,
    
    // --- TRUCOS PARA NO ACUMULAR ---
    tag: 'verse-of-the-day', // Reemplaza cualquier notificación anterior con este ID
    renotify: true           // Vuelve a sonar/vibrar aunque reemplace la vieja
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. CLIC EN NOTIFICACIÓN
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cierra la notificación
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Intenta encontrar la ventana de la app ya abierta
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // Si está abierta, enfócala y RECARGA para ver el nuevo versículo
        if (client.url.includes(self.registration.scope)) {
            return client.focus().then(() => client.navigate('./'));
        }
      }
      // Si no está abierta, abre una nueva
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
