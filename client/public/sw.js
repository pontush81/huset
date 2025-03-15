// Service worker to intercept network requests and catch module loading errors
const version = 1;
const cacheName = `brf-ellagarden-sw-v${version}`;

// List of server-side modules that shouldn't be loaded by the client
const serverOnlyModules = [
  'drizzle-zod',
  'drizzle-orm',
  '@neondatabase/serverless',
  'express'
];

// Install service worker
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing new version', version);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      // Cache fallback and diagnostic pages
      return cache.addAll([
        '/fallback.html',
        '/check.html'
      ]);
    })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== cacheName)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      // Claim clients to control all pages immediately
      return self.clients.claim();
    })
  );
});

// Intercept fetch requests to catch module errors
self.addEventListener('fetch', event => {
  // Don't intercept non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Check if request is for a server-only module
  const isServerModule = serverOnlyModules.some(module => 
    url.pathname.includes(module) || 
    url.href.includes(`/${module}`) ||
    url.href.includes(`=${module}`)
  );
  
  // If request is for a server module, redirect to fallback
  if (isServerModule) {
    console.log('[ServiceWorker] Blocking server module:', url.href);
    
    // Respond with fallback page
    event.respondWith(
      caches.match('/fallback.html').then(response => {
        return response || fetch('/fallback.html').catch(() => {
          return new Response(
            `Failed to load server-only module: ${url.pathname}`,
            { status: 500, headers: { 'Content-Type': 'text/plain' } }
          );
        });
      })
    );
    return;
  }
  
  // For all other requests, use network first, then fallback to cache
  event.respondWith(
    fetch(event.request).catch(error => {
      console.log('[ServiceWorker] Fetch failed, serving from cache', error);
      
      return caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If we're trying to load an HTML page and it fails, show fallback
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/fallback.html');
        }
        
        // Otherwise just throw the error
        throw error;
      });
    })
  );
}); 