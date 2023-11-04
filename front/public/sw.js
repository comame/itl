//@ts-expect-error
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

/**
 * @param {Request} req
 * @returns {Promise<Response>}
 */
async function cacheRequest(req) {
  const cache = await caches.open("v1");
  const matched = await cache.match(req.url);

  if (matched) {
    return matched;
  }

  const fr = await fetch(req.clone());
  if (fr.ok) {
    cache.put(req.url, fr.clone());
  }

  return fr;
}

/**
 * @param {FetchEvent} e
 */
function fetchHandler(e) {
  const req = e.request;

  if (req.method !== "GET") {
    return;
  }

  // オフライン状態のみ Cache を見る
  if (!navigator.onLine) {
    e.respondWith(cacheRequest(req));
  }

  const pathname = new URL(req.url).pathname;
  if (!pathname.startsWith("/api")) {
    cacheRequest(req.clone());
    return;
  }

  e.respondWith(cacheRequest(req));
}

self.addEventListener("fetch", fetchHandler);
