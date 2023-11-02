//@ts-expect-error
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

const ignoreSWRPrefixes = ["/api/artwork/", "/api/track/"];

/**
 * @param {Request} req
 * @returns {Promise<Response>}
 */
async function cacheRequest(req) {
  const cache = await caches.open("v1");
  const matched = await cache.match(req.url);

  const pathname = new URL(req.url).pathname;
  if (matched) {
    if (
      !ignoreSWRPrefixes.some((pf) => pathname.startsWith(pf)) &&
      pathname !== "/"
    ) {
      fetch(req).then((res) => cache.put(req.url, res));
    }
    return matched;
  }

  const fr = await fetch(req.clone());
  cache.put(req.url, fr.clone());

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

  const pathname = new URL(req.url).pathname;

  if (pathname.startsWith("/__idproxy")) {
    return;
  }

  // ログインチェック用にキャッシュをバイパスする
  if (pathname.startsWith("/logincheck")) {
    return;
  }

  e.respondWith(cacheRequest(req));
}

//@ts-expect-error
self.addEventListener("fetch", fetchHandler);
