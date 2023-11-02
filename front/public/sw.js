const version = "v1";

self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

/**
 * @param {Request} req
 * @returns {Promise<Response>}
 */
async function cacheRequest(req) {
  if (req.method !== "GET") {
    return fetch(req);
  }

  // ログインチェック用にキャッシュをバイパスする
  if (new URL(req.url).pathname.startsWith("/logincheck")) {
    return fetch(req);
  }

  const cache = await caches.open("v1");
  const r = await cache.match(req.url);
  if (r) {
    fetch(req).then((res) => cache.put(req.url, res));
    return r;
  }

  const fr = await fetch(req.clone());
  cache.put(req.url, fr.clone());

  return fr;
}

self.addEventListener("fetch", (e) => e.respondWith(cacheRequest(e.request)));
