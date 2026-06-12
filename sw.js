const CACHE_NAME = 'signage-media-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // --- FIX 1: Bypass caching for POST or any non-GET requests immediately ---
  if (e.request.method !== 'GET') {
    return; 
  }

  const url = e.request.url;

  // Intercept Firebase Storage assets, local schedule images, and school site assets
  if (url.includes('firebasestorage.googleapis.com') || url.includes('/schedule/') || url.includes('school%20site/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve cached asset immediately, but fetch a fresh copy in the background
            fetch(e.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                // --- FIX 2: Added .clone() here to prevent stream-reading errors ---
                cache.put(e.request, networkResponse.clone()); 
              }
            }).catch(() => {});
            
            return cachedResponse;
          }

          // Not in cache? Fetch it normally and save a copy for next time
          return fetch(e.request).then((networkResponse) => {
            if (networkResponse.status === 200 || networkResponse.status === 206) {
              cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  }
});
