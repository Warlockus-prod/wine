// v4 — current Vinovigator routes (no more legacy /v1/ paths). Bumping
// CACHE_NAME on every SW change forces all clients to drop the old shell
// in the activate handler below. Restaurant slug pages are cached
// network-first by the navigation handler; menu/wine photos under
// /dishes/* and /wines/* are cached cache-first so once a guest scans
// the QR at a table, the menu keeps working even if Wi-Fi drops.
const CACHE_NAME = "wine-shell-v4";
const OFFLINE_URL = "/offline";
const SHELL_ROUTES = [
  "/",
  "/pl",
  "/pairing",
  "/pl/pairing",
  "/samouczek",
  "/pl/samouczek",
  "/admin",
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ROUTES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    }),
  );
});
