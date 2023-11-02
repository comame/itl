const version = "v1";

self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

const ignoreSWRPrefixes = ["/api/artwork/", "/api/track/"];

/**
 * @param {Request} req
 * @returns {Promise<Response>}
 */
async function cacheRequest(req) {
  if (req.method !== "GET") {
    return fetch(req);
  }

  const pathname = new URL(req.url).pathname;

  if (pathname.startsWith("/__idproxy")) {
    return fetch(req);
  }

  // ログインチェック用にキャッシュをバイパスする
  if (pathname.startsWith("/logincheck")) {
    return fetch(req);
  }

  const cache = await caches.open("v1");
  const r = await cache.match(req.url);
  if (r) {
    if (!ignoreSWRPrefixes.some((pf) => pathname.startsWith(pf))) {
      fetch(req).then((res) => cache.put(req.url, res));
    }
    return r;
  }

  const fr = await fetch(req.clone());
  cache.put(req.url, fr.clone());

  return fr;
}

self.addEventListener("fetch", (e) => e.respondWith(cacheRequest(e.request)));
