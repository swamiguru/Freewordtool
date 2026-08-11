const CACHE = 'fwt-v8';

// HTML pages — always fetch fresh from network
const HTML_PAGES = [
  '/',
  '/character-counter',
  '/words-to-pages',
  '/reading-time-calculator',
  '/essay-word-counter',
  '/lorem-ipsum-generator',
  '/features',
];

// Static assets — cache-first for performance
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const isHtmlPage = HTML_PAGES.includes(pathname) || HTML_PAGES.includes(pathname + '/');

  if (isHtmlPage) {
    // Network-first for HTML: always get fresh markup, fall back to cache if offline
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for assets (JS, CSS, images, fonts)
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
  }
});
