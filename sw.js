const CACHE_NAME = 'biblia-push-v7-debug'; // Versión 7 para forzar recarga
const urlsToCache = [
  './',
  './index.html',
  './js/verses.js',
  './img/icon.png',
  './manifest.json'
];

// Instalación
self.addEventListener('install', (event) => {
  console.log("👷 [SW] Instalando nueva versión...");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activación y Limpieza
self.addEventListener('activate', (event) => {
  console.log("👷 [SW] Activado y listo.");
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
    })
  )));
});

// Intercepción de red
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// --- EVENTO PUSH (LO IMPORTANTE) ---
self.addEventListener('push', function(event) {
  console.log("🔔 [SW] ¡Evento Push detectado!");

  let data = { title: 'Biblia', body: 'Nueva bendición disponible' };
  
  if (event.data) {
    try {
        data = event.data.json();
        console.log("📦 [SW] Datos recibidos:", data);
    } catch (e) {
        console.warn("⚠️ [SW] No es JSON, usando texto plano.");
        data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './img/icon.png',
    badge: './img/icon.png',
    data: { url: './' }, // Para abrir la app al tocar
    requireInteraction: true // Mantiene la notificación visible
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
    .then(() => console.log("✅ [SW] Notificación mostrada en pantalla."))
    .catch(err => console.error("❌ [SW] Error al mostrar notificación:", err))
  );
});

// Click en notificación
self.addEventListener('notificationclick', function(event) {
  console.log("👆 [SW] Click en notificación.");
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
