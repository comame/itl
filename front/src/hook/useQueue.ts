import { useSyncExternalStore } from "react";
import { track } from "../type/track";
import { useTracks } from "./useTracks";

type ret = {
  setQueue: (...trackIDs: string[]) => void;
  addQueue: (...trackIDs: string[]) => void;
  setPosition: (i: number) => void;
  queue: track[];
  position: number;
  playing: boolean;
  resume: () => void;
  pause: () => void;
};

export function useQueue(): ret {
  useSyncExternalStore(queueStore.subscribe, queueStore.getSnapshot);

  const tracks = useTracks();

  return {
    setQueue(...trackIDs) {
      queueStore.set(trackIDs);
    },
    addQueue(...trackIDs) {
      for (const id of trackIDs) {
        queueStore.add(id);
      }
    },
    get queue() {
      const ids = queueStore.get();
      const res: track[] = [];
      for (const id of ids) {
        const t = tracks.find((v) => v.PersistentID === id);
        res.push(t!);
      }
      return res;
    },
    get position() {
      return queueStore.getPosition();
    },
    setPosition(i) {
      queueStore.setPosition(i);
    },
    get playing() {
      return queueStore.getPlayState();
    },
    resume() {
      queueStore.setPlayState(true);
    },
    pause() {
      queueStore.setPlayState(false);
    },
  };
}

const queueStore = {
  _queue: [] as string[],
  _position: -1,
  _listeners: [] as (() => unknown)[],
  _playing: false,

  set(trackIDs: string[]) {
    queueStore._queue = trackIDs;
    if (queueStore._position >= queueStore._queue.length) {
      queueStore._position = -1;
    }
    queueStore._dispatch();
  },
  add(trackID: string) {
    queueStore._queue = [...queueStore._queue, trackID];
    queueStore._dispatch();
  },
  get() {
    return queueStore._queue;
  },

  setPosition(i: number) {
    if (i >= queueStore._queue.length) {
      queueStore._position = 0;
    } else {
      queueStore._position = i;
    }
    queueStore._dispatch();
  },
  getPosition() {
    return queueStore._position;
  },

  getPlayState(): boolean {
    return queueStore._playing;
  },
  setPlayState(b: boolean) {
    queueStore._playing = b;
  },

  subscribe(listener: () => unknown) {
    queueStore._listeners = [...queueStore._listeners, listener];
    return () => {
      queueStore._listeners = queueStore._listeners.filter(
        (l) => l != listener
      );
    };
  },
  getSnapshot() {
    return (
      queueStore._queue.toString() + queueStore._position + queueStore._playing
    );
  },

  _dispatch() {
    for (const l of queueStore._listeners) {
      l();
    }
  },
};
