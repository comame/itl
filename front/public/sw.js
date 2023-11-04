self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

/**
 * @param {Request} req
 * @returns {Promise<Response>}
 */
async function requestWithCache(req) {
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
 * @param {Request} req
 * @return {Promise<void>}
 */
async function updateCache(req) {
  const cache = await caches.open("v1");
  const r = await fetch(req);
  if (r.ok) {
    await cache.put(req.url, r);
  }
}

/**
 * @param {FetchEvent} e
 */
function fetchHandler(e) {
  const req = e.request;

  // GET 以外はキャッシュ不可能
  if (req.method !== "GET") {
    return;
  }

  // オフライン時、すべてをキャッシュから読む
  if (!navigator.onLine) {
    e.respondWith(requestWithCache(req));
    return;
  }

  const pathname = new URL(req.url).pathname;

  // API レスポンスはキャッシュから返す
  if (pathname.startsWith("/api")) {
    e.respondWith(requestWithCache(req));
    return;
  }

  // アプリケーション本体はバックグラウンドでキャッシュする
  // 二重にリクエストが飛ぶことになるが、そこまで大きくないので気にしない
  updateCache(req);
}

self.addEventListener("fetch", fetchHandler);
