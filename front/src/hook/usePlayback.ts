import { useEffect, useSyncExternalStore } from "react";
import { track } from "../type/track";
import { useTracks } from "./useTracks";
import {
  albumArtworkURL,
  isChromeIncompatible,
  trackArtworkURL,
} from "../library";
import { getEndpointURL } from "../api";

type ret = {
  addQueue: (...trackIDs: string[]) => void;
  removeFromQueue: (position: number) => void;
  clearQueue: () => void;
  setPosition: (i: number) => void;
  queue: track[];
  position: number;
  playing: boolean;
  resume: () => void;
  pause: () => void;
};

export function usePlayback(): ret {
  useSyncExternalStore(queueStore.subscribe, queueStore.getSnapshot);

  const tracks = useTracks();

  useEffect(() => {
    navigator.mediaSession.setActionHandler("pause", () => {
      queueStore.setPlayState(false);
      navigator.mediaSession.playbackState = "paused";
    });
    navigator.mediaSession.setActionHandler("stop", () => {
      queueStore.setPlayState(false);
      navigator.mediaSession.playbackState = "paused";
    });
    navigator.mediaSession.setActionHandler("play", () => {
      queueStore.setPlayState(true);
      navigator.mediaSession.playbackState = "playing";
    });
  });

  const setupMetadata = () => {
    const id = queueStore.get()[queueStore.getPosition()];
    const track = tracks.find((v) => v.PersistentID === id)!;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.Name,
      artist: track.Artist,
      album: track.Album,
      artwork: [
        {
          src: trackArtworkURL(track.PersistentID),
          type: "image/jpeg",
        },
      ],
    });
  };

  return {
    addQueue(...trackIDs) {
      trackIDs = trackIDs.filter(
        (v) =>
          !isChromeIncompatible(tracks.find((tf) => tf.PersistentID === v)!)
      );
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
      setupMetadata();
    },
    get playing() {
      return queueStore.getPlayState();
    },
    resume() {
      queueStore.setPlayState(true);
      navigator.mediaSession.playbackState = "playing";
      setupMetadata();
    },
    pause() {
      queueStore.setPlayState(false);
      navigator.mediaSession.playbackState = "paused";
    },
    removeFromQueue(p: number) {
      const curp = queueStore._position;

      queueStore._queue.splice(p, 1);

      if (curp > p) {
        queueStore._position -= 1;
      }

      if (queueStore._queue.length === 0) {
        queueStore._position = 0;
        queueStore.setPlayState(false);
        navigator.mediaSession.playbackState = "paused";
      }

      queueStore._dispatch();
    },
    clearQueue() {
      queueStore._queue = [];
      queueStore._position = 0;
      queueStore.setPlayState(false);
      navigator.mediaSession.playbackState = "paused";
      queueStore._dispatch();
    },
  };
}

const queueStore = {
  _queue: [] as string[],
  _position: 0,
  _listeners: [] as (() => unknown)[],
  _playing: false,

  set(trackIDs: string[]) {
    queueStore._queue = trackIDs;
    if (queueStore._position >= queueStore._queue.length) {
      queueStore._position = 0;
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
    queueStore._dispatch();
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
