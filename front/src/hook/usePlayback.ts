import { useEffect, useSyncExternalStore } from "react";
import { track } from "../type/track";
import { useTracks } from "./useTracks";
import {
  albumArtworkURL,
  isChromeIncompatible,
  trackArtworkURL,
} from "../library";
import { getEndpointURL } from "../api";
import { json } from "react-router-dom";

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
  useEffect(() => {
    loadQueue();
  }, []);

  useSyncExternalStore(queueStore.subscribe, queueStore.getSnapshot);

  const tracks = useTracks();

  useEffect(() => {
    navigator.mediaSession.setActionHandler("pause", () => {
      retObj.pause();
    });
    navigator.mediaSession.setActionHandler("stop", () => {
      retObj.pause();
    });
    navigator.mediaSession.setActionHandler("play", () => {
      retObj.resume();
    });
  });

  const setupMetadata = () => {
    const id = queueStore.queue[queueStore.position];
    const track = tracks.find((v) => v.PersistentID === id);
    if (!track) {
      return;
    }

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

  const retObj = {
    addQueue(...trackIDs: string[]) {
      trackIDs = trackIDs.filter(
        (v) =>
          !isChromeIncompatible(
            tracks.find((tf) => tf.PersistentID === v) ?? null
          )
      );
      queueStore.queue = [...queueStore.queue, ...trackIDs];
      queueStore.dispatch();
      saveQueue();
    },
    get queue() {
      const res: track[] = [];
      for (const id of queueStore.queue) {
        const t = tracks.find((v) => v.PersistentID === id);
        if (!t) {
          continue;
        }
        res.push(t);
      }
      return res;
    },
    get position() {
      return queueStore.position;
    },
    setPosition(i: number) {
      if (i >= queueStore.queue.length) {
        queueStore.position = 0;
      } else {
        queueStore.position = i;
      }
      queueStore.dispatch();
      setupMetadata();
      saveQueue();
    },
    get playing() {
      return queueStore.playing;
    },
    resume() {
      queueStore.playing = true;
      navigator.mediaSession.playbackState = "playing";
      queueStore.dispatch();
      setupMetadata();
    },
    pause() {
      queueStore.playing = false;
      navigator.mediaSession.playbackState = "paused";
      queueStore.dispatch();
    },
    removeFromQueue(p: number) {
      const curp = queueStore.position;

      queueStore.queue.splice(p, 1);

      if (curp > p) {
        queueStore.position -= 1;
      }

      if (queueStore.queue.length === 0) {
        queueStore.position = 0;
        queueStore.playing = false;
        navigator.mediaSession.playbackState = "paused";
      }

      queueStore.dispatch();
      saveQueue();
    },
    clearQueue() {
      queueStore.queue = [];
      queueStore.position = 0;
      queueStore.playing = false;
      navigator.mediaSession.playbackState = "paused";
      queueStore.dispatch();
      saveQueue();
    },
  };

  return retObj;
}

const queueStore = {
  queue: [] as string[],
  position: 0,
  playing: false,
  _listeners: [] as (() => unknown)[],

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
      queueStore.queue.toString() + queueStore.position + queueStore.playing
    );
  },

  dispatch() {
    for (const l of queueStore._listeners) {
      l();
    }
  },
};

function saveQueue() {
  const data = {
    q: queueStore.queue,
    p: queueStore.position,
  };
  localStorage.setItem("queue", JSON.stringify(data));
}

function loadQueue() {
  const s = localStorage.getItem("queue");
  if (!s) {
    return;
  }
  const d = JSON.parse(s);
  queueStore.queue = d.q;
  queueStore.position = d.p;
}
