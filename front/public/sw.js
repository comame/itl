const version = "v1";

self.addEventListener("install", (e) =>
  e.waitUntil(caches.delete("v1").then(() => self.skipWaiting()))
);

/**
 * @param {Request} req
 * @returns {Promise<Response>}
 */
async function cacheRequest(req) {
  if (req.method !== "GET") {
    return fetch(req);
  }

  const cache = await caches.open("v1");
  const r = await cache.match(req.url);
  if (r) {
    return r;
  }

  const fr = await fetch(req.clone());
  cache.put(req.url, fr.clone());

  return fr;
}

self.addEventListener("fetch", (e) => e.respondWith(cacheRequest(e.request)));
