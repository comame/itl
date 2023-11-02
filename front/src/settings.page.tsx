import { useEffect, useState } from "react";

export default function Settings() {
  const deleteCacheApplication = async () => {
    if (!confirm("アプリケーションのキャッシュを削除？")) {
      return;
    }
    const c = await caches.open("v1");
    const keys = await c.keys();
    const target = keys.filter((r) => {
      const url = new URL(r.url);
      return !url.pathname.startsWith("/api");
    });

    for (const u of target) {
      await c.delete(u);
    }
  };

  const deleteCacheLbraryMetadata = async () => {
    if (!confirm("ライブラリのメタデータを削除？")) {
      return;
    }
    const c = await caches.open("v1");
    const keys = await c.keys();
    const target = keys.filter((r) => {
      const url = new URL(r.url);
      return (
        url.pathname === "/api/tracks" || url.pathname === "/api/playlists"
      );
    });

    for (const u of target) {
      await c.delete(u);
    }
  };

  const deleteCacheArtwork = async () => {
    if (!confirm("アートワークを削除？")) {
      return;
    }
    const c = await caches.open("v1");
    const keys = await c.keys();
    const target = keys.filter((r) => {
      const url = new URL(r.url);
      return url.pathname.startsWith("/api/artwork/");
    });

    for (const u of target) {
      await c.delete(u);
    }
  };

  const deleteCacheTrack = async () => {
    if (!confirm("ダウンロード楽曲を削除？")) {
      return;
    }
    const c = await caches.open("v1");
    const keys = await c.keys();
    const target = keys.filter((r) => {
      const url = new URL(r.url);
      return url.pathname.startsWith("/api/track/");
    });

    for (const u of target) {
      await c.delete(u);
    }
  };

  const deleteLocalStorage = () => {
    if (!confirm("ローカルストレージを削除？")) {
      return;
    }

    localStorage.removeItem("queue");
  };

  const deleteServiceWorker = async () => {
    if (!confirm("ServiceWorker を削除？")) {
      return;
    }

    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      await r.unregister();
    }
  };

  const [cached, setCached] = useState<string[]>([]);
  useEffect(() => {
    caches
      .open("v1")
      .then((c) => c.keys())
      .then((req) => req.map((r) => r.url))
      .then((urls) => {
        urls.sort();
        return urls;
      })
      .then((urls) => setCached(urls));
  }, []);

  return (
    <div className="m-16">
      <div className="block">
        ログインチェック{" "}
        <button
          className="font-bold"
          onClick={() => {
            location.href = "/logincheck";
          }}
        >
          実行
        </button>
      </div>
      <div className="block">
        Cache: アプリケーション{" "}
        <button className="font-bold" onClick={deleteCacheApplication}>
          実行
        </button>
      </div>
      <div className="block">
        Cache: ライブラリメタデータ{" "}
        <button className="font-bold" onClick={deleteCacheLbraryMetadata}>
          実行
        </button>
      </div>
      <div className="block">
        Cache: アートワーク{" "}
        <button className="font-bold" onClick={deleteCacheArtwork}>
          実行
        </button>
      </div>
      <div className="block">
        Cache: ダウンロード楽曲{" "}
        <button className="font-bold" onClick={deleteCacheTrack}>
          実行
        </button>
      </div>
      <div className="block">
        LocalStorage{" "}
        <button className="font-bold" onClick={deleteLocalStorage}>
          実行
        </button>
      </div>
      <div className="block">
        ServiceWorker{" "}
        <button className="font-bold" onClick={deleteServiceWorker}>
          実行
        </button>
      </div>

      <hr className="mt-16 mb-16" />

      <h2 className="font-bold text-lg">Caches</h2>
      <textarea
        value={cached.join("\n")}
        className="w-9/12 h-272 border-2 mr-auto ml-auto block"
      />

      <hr className="mt-16 mb-16" />

      <h2 className="font-bold text-lg">LocalStorage</h2>
      <textarea
        value={localStorage.getItem("queue") ?? ""}
        className="w-9/12 h-272 border-2 mr-auto ml-auto block"
      />
    </div>
  );
}
