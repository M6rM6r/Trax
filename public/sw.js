// Bump on deploy-related SW policy changes so activate purges old HTML shells.
const CACHE_NAME = "trax-v6-static";
// Only truly static, non-hashed shell assets. Never cache HTML/RSC/chunks.
const STATIC_ASSETS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Allow the page to force-activate a waiting worker after deploy.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept Next.js builds, APIs, or document navigations.
  // Caching HTML shells after deploy causes ChunkLoadError (stale chunk hashes).
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.includes("/login") ||
    url.pathname.includes("/register")
  ) {
    return;
  }

  // Same-origin static media only (icons, images, fonts) — cache-first.
  if (
    url.origin === location.origin &&
    (url.pathname.startsWith("/images/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".webp") ||
      url.pathname === "/manifest.json")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
