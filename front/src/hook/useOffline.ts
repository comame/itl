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
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!store.init) {
    store.init = true;
    throw caches
      .open("v1")
      .then((cache) => cache.keys())
      .then((keys) => keys.filter((r) => r.method === "GET").map((r) => r.url))
      .then((urls) => urls.map((u) => new URL(u).pathname))
      .then((paths) => paths.filter((p) => p.startsWith("/api/track/")))
      .then((paths) => paths.map((p) => p.slice("/api/track/".length)))
      .then((ids) => {
        store.saved = ids;
        store.ready = true;
      });
  }
  if (!store.ready) {
    throw Promise.resolve();
  }

  return {
    get cachedTrackIDs() {
      return store.saved;
    },
    async save(trackID: string) {
      const c = await caches.open("v1");
      const u = getEndpointURL(`/api/track/${trackID}`);
      const r = await fetch(u);
      if (r.ok) {
        await c.put(u, r);
        store.saved = [...store.saved, trackID];
        store.dispath();
      }
    },
  };
}

const store = {
  _listeners: [] as (() => unknown)[],
  init: false,
  ready: false,
  saved: [] as string[],

  subscribe(listener: () => unknown) {
    store._listeners = [...store._listeners, listener];
    return () => {
      store._listeners = store._listeners.filter((l) => l != listener);
    };
  },
  getSnapshot() {
    if (!store.ready) {
      return false;
    }
    return store.saved.toString();
  },

  dispath() {
    for (const l of store._listeners) {
      l();
    }
  },
};
