// DankDeals Cannabis Delivery - Service Worker
// Version: 1.0.0

const CACHE_NAME = 'dankdeals-v1.0.0';
const RUNTIME_CACHE = 'dankdeals-runtime-v1.0.0';

// Essential files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add critical assets that are needed for offline functionality
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  new RegExp('^https://.*\\.supabase\\.co/rest/.*'),
  new RegExp('^https://.*\\.supabase\\.co/storage/.*'),
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  new RegExp('/api/'),
  new RegExp('/auth/'),
  new RegExp('/checkout/'),
  new RegExp('/orders/'),
];

// Cache-first patterns (for static assets)
const CACHE_FIRST_PATTERNS = [
  new RegExp('\\.(?:js|css|woff2?|png|jpg|jpeg|webp|svg|ico)$'),
  new RegExp('/assets/'),
];

// Install event - Cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential files');
      return cache.addAll(
        STATIC_CACHE_FILES.map(
          (url) =>
            new Request(url, {
              cache: 'reload', // Force fresh download during install
            })
        )
      );
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - Handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip requests to different origins (except API endpoints)
  if (url.origin !== location.origin && !isApiRequest(url)) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests with appropriate strategies
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Network-first strategy for critical user data
    if (isNetworkFirst(url)) {
      return await networkFirst(request);
    }

    // Cache-first strategy for static assets
    if (isCacheFirst(url)) {
      return await cacheFirst(request);
    }

    // API requests - stale-while-revalidate
    if (isApiRequest(url)) {
      return await staleWhileRevalidate(request);
    }

    // Default: network-first with fallback
    return await networkFirst(request);
  } catch (error) {
    console.error('[SW] Request handling error:', error);

    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return getOfflineFallback();
    }

    // For other requests, try cache or return error
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return a basic error response
    return new Response('Network error occurred', {
      status: 408,
      statusText: 'Network timeout',
    });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // If not in cache, fetch and cache
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  // Always try to fetch fresh data in the background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // If network fails, we'll use the cached version
      return cachedResponse;
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cached version, wait for network
  return fetchPromise;
}

// Get offline fallback page
async function getOfflineFallback() {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match('/');

  if (cachedResponse) {
    return cachedResponse;
  }

  // Create a basic offline page
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DankDeals - Offline</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #185a1b, #22c55e);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          max-width: 400px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        button {
          background: white;
          color: #185a1b;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌿 DankDeals</h1>
        <p>You're currently offline. Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

// Helper functions to determine request types
function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isApiRequest(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCart());
  }

  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  }
});

// Sync cart data when back online
async function syncCart() {
  try {
    // Get pending cart updates from IndexedDB
    const pendingUpdates = await getPendingCartUpdates();

    for (const update of pendingUpdates) {
      try {
        await fetch('/api/cart/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        });

        // Remove from pending updates after successful sync
        await removePendingCartUpdate(update.id);
      } catch (error) {
        console.error('[SW] Failed to sync cart update:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

// Sync order data when back online
async function syncOrders() {
  try {
    // Implementation for syncing order-related data
    console.log('[SW] Syncing orders...');
  } catch (error) {
    console.error('[SW] Order sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'Your DankDeals order update is ready!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'dankdeals-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/icon-96x96.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-96x96.png',
      },
    ],
    data: {
      url: '/profile?tab=orders',
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.error('[SW] Failed to parse push payload:', error);
    }
  }

  event.waitUntil(self.registration.showNotification('DankDeals Update', options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Helper functions for IndexedDB operations (simplified)
async function getPendingCartUpdates() {
  // In a real implementation, you'd use IndexedDB to store pending updates
  return [];
}

async function removePendingCartUpdate(id) {
  // In a real implementation, you'd remove the update from IndexedDB
  console.log('[SW] Removing pending cart update:', id);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service worker loaded successfully');
