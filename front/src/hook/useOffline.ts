import { useEffect, useSyncExternalStore } from "react";
import { getEndpointURL } from "../api";

export function useOffline(): {
  cachedTrackIDs: string[];
  save(trackID: string): Promise<void>;
} {
  useSyncExternalStore(store.subscribe, store.getSnapshot);

  useEffect(() => {
    const interval = setInterval(function () {
      caches
        .open("v1")
        .then((cache) => cache.keys())
        .then((keys) =>
          keys.filter((r) => r.method === "GET").map((r) => r.url)
        )
        .then((urls) => urls.map((u) => new URL(u).pathname))
        .then((paths) => paths.filter((p) => p.startsWith("/api/track/")))
        .then((paths) => paths.map((p) => p.slice("/api/track/".length)))
        .then((ids) => {
          store.saved = ids;
          store.dispath();
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!store.init) {
    // Android の Chrome でなぜか Cache API が遅くてロードが終わらないので、完了を待たない
    store.init = true;
    caches
      .open("v1")
      .then((cache) => cache.keys())
      .then((keys) => keys.filter((r) => r.method === "GET").map((r) => r.url))
      .then((urls) => urls.map((u) => new URL(u).pathname))
      .then((paths) => paths.filter((p) => p.startsWith("/api/track/")))
      .then((paths) => paths.map((p) => p.slice("/api/track/".length)))
      .then((ids) => {
        store.saved = ids;
      });
  }

  return {
    get cachedTrackIDs() {
      return store.saved;
    },
    async save(trackID: string) {
      // fetch すれば Service Worker でキャッシュされる
      const u = getEndpointURL(`/api/track/${trackID}`);
      await fetch(u);
    },
  };
}

const store = {
  _listeners: [] as (() => unknown)[],
  init: false,
  saved: [] as string[],

  subscribe(listener: () => unknown) {
    store._listeners = [...store._listeners, listener];
    return () => {
      store._listeners = store._listeners.filter((l) => l != listener);
    };
  },
  getSnapshot() {
    return store.saved.toString();
  },

  dispath() {
    for (const l of store._listeners) {
      l();
    }
  },
};
