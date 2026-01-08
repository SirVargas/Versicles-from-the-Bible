self.addEventListener('install', (e) => {
  console.log('Service Worker Instalado');
});

// Lógica para mostrar notificación cada vez que se abre la app
self.addEventListener('activate', (e) => {
  self.registration.showNotification("Palabra del Cielo", {
    body: "Toca para leer el versículo de esta hora.",
    icon: "cdn-icons-png.flaticon.com",
    tag: "daily-verse"
  });
});
