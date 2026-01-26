/* Service Worker pour Push Notifications Planify */
self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
       // Try JSON first
       try {
         data = event.data.json();
       } catch (e) {
         // If JSON fails, treat as text
         const text = event.data.text();
         if (text) data.body = text;
       }
    }
  } catch (err) {
    console.error('Error parsing push data', err);
  }

  const title = data.title || 'Planify';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/planifyFichier_134x.webp?v=2',
    badge: data.badge || '/planifyFichier_134x.webp?v=2',
    data: data.data || { url: '/' },
    vibrate: [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});