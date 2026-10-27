/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Progressive Web App Service Worker
   Offline-first caching, static shell pre-caching, dynamic tile caching,
   and instant service worker lifecycle management.
   ========================================================================== */
var CACHE_NAME = 'solo-quest-v2.1';

var STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/leaflet.css',
  './js/icons.js',
  './js/data.js',
  './js/engine.js',
  './js/api.js',
  './js/auth.js',
  './js/audio.js',
  './js/leaflet.js',
  './js/tracker.js',
  './js/gate.js',
  './js/ui.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Install: Pre-cache application shell
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activate: Purge stale caches and claim clients immediately
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch: Stale-While-Revalidate / Cache-First for static, Network-First for tiles
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  // 1. Navigation requests (HTML shell): Network-First with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return networkResponse;
      }).catch(function () {
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }

  // 2. OpenStreetMap Tiles: Cache dynamically on the fly
  if (url.hostname.indexOf('tile.openstreetmap.org') !== -1 || url.hostname.indexOf('basemaps.cartocdn.com') !== -1) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            var copy = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        }).catch(function () {
          return new Response('', { status: 408, statusText: 'Tile Offline' });
        });
      })
    );
    return;
  }

  // 3. API & Cloud Database calls: Always bypass cache, direct network
  if (url.pathname.startsWith('/api/') || url.hostname.indexOf('supabase.co') !== -1) {
    return;
  }

  // 4. Local Static Assets: Cache-First with background revalidation
  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        // Background fetch to refresh cache
        fetch(request).then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, networkResponse);
            });
          }
        }).catch(function () {});
        return cachedResponse;
      }

      // If not in cache, fetch from network and store
      return fetch(request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return networkResponse;
      });
    })
  );
});
