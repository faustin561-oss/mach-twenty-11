// Minimal service worker — increment 6 PWA polish. Caches the app shell
// (static assets Next.js already fingerprints) for faster repeat loads and
// offline fallback for previously-visited pages. This is not full offline
// support: API routes are always network-only (correct — shipment/bid data
// must never serve stale from cache), and there's no background sync for
// actions taken while offline.
const CACHE_NAME = "mach2011-shell-v2";

self.addEventListener("install", (event) => {
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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls, auth routes, or Next.js's own internal
  // routes (_next/*: build assets, RSC flight payloads, HMR-adjacent
  // requests). Caching build assets is what Next.js's own fingerprinted
  // filenames + HTTP caching headers already handle correctly; a service
  // worker layering its own cache on top of _next/* is exactly what
  // causes pages to hang or serve stale RSC payloads. Scope this to
  // actual public/ static assets and top-level page shells only.
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;
  if (event.request.method !== "GET") return;
  if (event.request.headers.get("accept")?.includes("text/x-component")) return; // RSC payload requests

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
