const CACHE_NAME = 'bazar-v1';
const BASE = self.location.pathname.replace(/\/sw\.js$/, '/');
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'historial.html',
  BASE + 'css/styles.css',
  BASE + 'js/app.js',
  BASE + 'js/historial.js',
  BASE + 'manifest.json',
  BASE + 'icons/icon-72.png',
  BASE + 'icons/icon-96.png',
  BASE + 'icons/icon-128.png',
  BASE + 'icons/icon-144.png',
  BASE + 'icons/icon-152.png',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-384.png',
  BASE + 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
