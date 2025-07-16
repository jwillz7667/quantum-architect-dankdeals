// Simple service worker for caching static assets
const CACHE_NAME = 'dankdeals-v1';
const urlsToCache = [
  '/',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/logos/dankdeals-logo.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
