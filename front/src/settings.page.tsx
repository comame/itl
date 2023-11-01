export default function Settings() {
  const deleteAppCache = async () => {
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

    const regs = await navigator.serviceWorker.getRegistrations();
    console.log(regs);

    for (const reg of regs) {
      await reg.unregister();
    }

    console.log("done");
  };

  const deleteLibraryCache = async () => {
    if (!confirm("ライブラリのキャッシュを削除？")) {
      return;
    }
    const c = await caches.open("v1");
    const keys = await c.keys();
    const target = keys.filter((r) => {
      const url = new URL(r.url);
      return url.pathname.startsWith("/api");
    });

    for (const u of target) {
      await c.delete(u);
    }
  };

  const purgeAll = async () => {
    if (!confirm("すべてののキャッシュを削除？")) {
      return;
    }

    await caches.delete("v1");

    const regs = await navigator.serviceWorker.getRegistrations();
    console.log(regs);

    for (const reg of regs) {
      await reg.unregister();
    }

    console.log("done");
  };

  return (
    <div>
      <label className="block">
        アプリケーションのキャッシュを削除{" "}
        <button className="font-bold" onClick={deleteAppCache}>
          実行
        </button>
      </label>
      <label className="block">
        ライブラリのキャッシュを削除{" "}
        <button className="font-bold" onClick={deleteLibraryCache}>
          実行
        </button>
      </label>
      <label className="block">
        すべてのキャッシュを削除{" "}
        <button className="font-bold" onClick={purgeAll}>
          実行
        </button>
      </label>
    </div>
  );
}
