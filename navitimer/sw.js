const CACHE_NAME = "e6b-shell-v1";
const APP_SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "app-render.js",
  "e6b-math.js",
  "manifest.json",
  "icon-192.svg",
  "icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => caches.match("./") || caches.match("index.html"));
    }),
  );
});
