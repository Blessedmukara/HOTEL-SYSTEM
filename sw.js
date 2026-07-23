const CACHE_NAME = "rose-cafe-pos-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the app shell (so waiters always get the latest version when online),
// falling back to cache when offline. Supabase API calls are left untouched — they need a
// live connection to actually take orders, this only keeps the app itself loadable offline.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAppShell = APP_SHELL.some((path) => url.pathname.endsWith(path.replace("./", "/")));
  if (event.request.method !== "GET" || !isAppShell) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
