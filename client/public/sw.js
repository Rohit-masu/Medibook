// Minimal service worker: makes the app installable everywhere without caching anything,
// so demo users always get the latest build. Offline support can be added later.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Network passthrough (no respondWith = browser handles the request normally).
});
