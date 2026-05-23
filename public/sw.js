// v5 — cache strategy reworked so deploys propagate immediately.
//
// Previous v4 used cache-first for ALL sub-resources, which served stale
// JS/CSS chunks (and therefore stale UI copy) to returning visitors until
// the cache happened to evict. Fixed:
//   - Navigation (HTML)      → network-first (fresh content, offline
//                              falls back to cache then /offline).
//   - /dishes/* /wines/*     → cache-first (immutable heavy photos; the
//                              point of offline-at-the-table QR scans).
//   - everything else
//     (JS, CSS, fonts, API)  → network-first with cache fallback, so a
//                              new build's chunks always win when online.
const CACHE_NAME = "wine-shell-v5";
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

// Heavy immutable assets we WANT to keep cache-first for table-side
// offline resilience. These never change for a given URL.
const CACHE_FIRST_PREFIXES = ["/dishes/", "/wines/"];

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

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    // Only cache successful, basic/cors responses.
    if (response && response.status === 200) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match(OFFLINE_URL);
    throw new Error("network + cache miss");
  }
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cache-first only for the heavy immutable photo assets.
  if (CACHE_FIRST_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(cacheFirst(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Everything else (HTML, JS, CSS, fonts, API) — network-first so new
  // deploys win the moment the user is online.
  event.respondWith(networkFirst(request));
});
