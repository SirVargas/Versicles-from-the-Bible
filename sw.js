self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('Service Worker Activo');
});

// Cuando el usuario toca la notificación en la pantalla de bloqueo
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cierra la notificación
  
  // Abre la app
  event.waitUntil(
    clients.matchAll({type: 'window'}).then( windowClients => {
      // Si ya está abierta, enfócala
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
