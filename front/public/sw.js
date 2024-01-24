self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

const bc = new BroadcastChannel("cache_done");

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
  if (fr.status === 200) {
    cache.put(req.url, fr.clone()).then(() => {
      bc.postMessage(req.url);
    });
  }

  return fr;
}

/**
 * @param {Request} req
 * @returns {Promise<response>}
 */
async function handleIndexRequest(req) {
  const res = await fetch(req);

  if (res.ok) {
    const cr = res.clone();
    caches.open("v1").then((cache) => cache.put(req.url, cr));
  }

  return res;
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

  const pathname = new URL(req.url).pathname;

  // ログイン部分はキャッシュ不可能
  if (pathname.startsWith("/__idproxy")) {
    return;
  }

  // オフライン時、すべてをキャッシュから読む
  if (!navigator.onLine) {
    e.respondWith(requestWithCache(req));
    return;
  }

  // index はログイン画面にリダイレクトすることがあるので、二重リクエストできない
  if (pathname === "/") {
    e.respondWith(handleIndexRequest(req));
    return;
  }

  // API レスポンスはキャッシュから返す
  if (pathname.startsWith("/api")) {
    e.respondWith(requestWithCache(req));
    return;
  }

  // アプリケーション本体はバックグラウンドでキャッシュする
  // 二重にリクエストが飛ぶことになるが、そこまで大きくないので気にしない
  updateCache(req);
}

async function backgroundFetchSuccessHandler(e) {
  /** @type {BackGroundFetchRegistration} */
  const reg = e.registration;
  const urls = reg.id.split("\n");

  e.waitUntil(
    (async () => {
      const cache = await caches.open("v1");

      for (const url of urls) {
        const rec = await reg.match(url);
        if (!rec) {
          continue;
        }
        const res = await rec.responseReady;
        await cache.put(rec.request, res);
      }

      bc.postMessage("backgroundfetch done");
    })()
  );
}

self.addEventListener("fetch", fetchHandler);
self.addEventListener("backgroundfetchsuccess", backgroundFetchSuccessHandler);
