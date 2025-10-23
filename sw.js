// Service Worker for Game Uji Geometri 3D PWA
const CACHE_NAME = 'geometri-3d-v1.0.0';
const STATIC_CACHE = 'geometri-3d-static-v1.0.0';
const DYNAMIC_CACHE = 'geometri-3d-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/lahan-bermain-complete.html',
  '/peta-konstruksi.html',
  '/lahan-syarat.html',
  '/petunjuk-konstruksi.html',
  '/level-1-simple.html',
  '/level-2-simple.html',
  '/level-3-simple.html',
  '/level-4-simple.html',
  '/level-5-simple.html',
  '/level-6-simple.html',
  '/styles.css',
  '/app.js',
  '/three.min.js',
  '/OrbitControls.js',
  '/manifest.json',
  '/pages/menu.js',
  '/pages/lahan-syarat.js',
  '/pages/shared-three.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
        // Continue with installation even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).catch((error) => {
      console.error('[SW] Error during activation:', error);
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle Three.js and OrbitControls with network-first strategy to avoid stale cache
  if (url.pathname === '/three.min.js' || url.pathname === '/OrbitControls.js') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle API requests (if any in future)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets - cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((response) => {
            // Cache the new response
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          });
        })
    );
    return;
  }

  // Handle HTML pages - network-first strategy
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline fallback
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Background sync for analytics (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: [100, 50, 100],
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Analytics sync function (placeholder for future implementation)
async function syncAnalytics() {
  try {
    const analyticsData = await getStoredAnalytics();

    if (analyticsData && analyticsData.length > 0) {
      // Send analytics to server
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analyticsData)
      });

      if (response.ok) {
        // Clear stored analytics
        await clearStoredAnalytics();
        console.log('[SW] Analytics synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Placeholder functions for future analytics
async function getStoredAnalytics() {
  // Implementation for storing analytics locally
  return null;
}

async function clearStoredAnalytics() {
  // Implementation for clearing stored analytics
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'performance') {
    // Handle performance metrics from main thread
    console.log('[SW] Performance data received:', event.data.payload);
  }
});