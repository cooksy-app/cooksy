/* Offline support: cache the app shell so Cooksy opens without a connection once installed.
   Bump CACHE when files change so phones pick up the new version. */
const CACHE = 'cooksy-1.0.0';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'assets/cooksy-logo.png', 'assets/cooksy-mark.png', 'assets/favicon.png', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png',
  'js/config.js', 'js/vendor/supabase.js', 'js/core/auth.js', 'js/views/account.js',
  'js/data/countries.js', 'js/data/cuisines.js', 'js/data/allergens.js', 'js/data/ingredients.js', 'js/data/recipes.js',
  'js/core/util.js', 'js/core/store.js', 'js/core/safety.js', 'js/core/kitchen.js', 'js/core/catalog.js',
  'js/ui/components.js', 'js/views/shared.js', 'js/views/onboarding.js', 'js/views/home.js', 'js/views/explore.js',
  'js/views/cuisines.js', 'js/views/recipe.js', 'js/views/kitchen.js', 'js/views/shopping.js', 'js/views/settings.js',
  'js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first (so updates show up), falling back to cache when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
