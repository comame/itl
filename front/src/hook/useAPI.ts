import { createContext, useContext, useSyncExternalStore } from "react";
import { client, getClient } from "../api/index";

export function useJSONAPI<T extends (client: client) => Promise<unknown>>(
  api: T
): T extends (client: client) => Promise<infer S> ? [S, string] : never {
  const store = useSyncExternalStore(
    globalStore.subscribe,
    globalStore.getSnapshot
  );
  const state = store.get(api);

  if (!state) {
    const f = () =>
      api(getClient())
        .then((d) => {
          globalStore.set(api, {
            ready: true,
            data: d,
            error: "",
          });
        })
        .catch((err) => {
          globalStore.set(api, {
            ready: true,
            data: undefined,
            error: err,
          });
        });
    throw f();
  }
  if (!state.ready) {
    throw new Promise(() => {});
  }

  return [state.data, state.error.toString()] as any;
}

type state = {
  ready: boolean;
  data: any;
  error: any;
};

const globalStore = {
  _self: new Map<(client: client) => Promise<unknown>, state>(),
  _listeners: [] as (() => unknown)[],

  set(key: (client: client) => Promise<unknown>, value: state) {
    globalStore._self = new Map(globalStore._self.set(key, value));
    globalStore._dispatch();
  },

  subscribe(listener: () => unknown) {
    globalStore._listeners = [...globalStore._listeners, listener];
    return () => {
      globalStore._listeners = globalStore._listeners.filter(
        (l) => l != listener
      );
    };
  },
  getSnapshot() {
    return globalStore._self;
  },

  _dispatch() {
    for (const l of globalStore._listeners) {
      l();
    }
  },
};
