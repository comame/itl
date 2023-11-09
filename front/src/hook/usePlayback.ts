import { useEffect, useState } from "react";

import { loadQueue, store } from "../lib/audio";
import { track } from "../type/track";

import { useTracks } from "./useTracks";

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
  setVolume: (volume: number) => void;
};

export function usePlayback(): ret {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const p = () => {
      setPlaying(true);
    };
    const e = () => {
      setPlaying(false);
    };
    store.element.addEventListener("play", p);
    store.element.addEventListener("pause", e);
    return () => {
      store.element.removeEventListener("play", p);
      store.element.removeEventListener("pause", e);
    };
  }, []);

  const tracks = useTracks();
  store.setTracks(tracks);

  const [derivedPosition, setDerivedPosition] = useState(store.position);
  const [derivedQueue, setDerivedQueue] = useState(store.queue);
  useEffect(() => {
    const f = () => {
      setDerivedPosition(store.position);
      setDerivedQueue(store.queue);
    };
    store.addOnQueueUpdate(f);
    return () => {
      store.removeOnQueueUpdate(f);
    };
  }, []);

  useEffect(() => {
    if (tracks.length === 0) {
      return;
    }
    console.log("load queue from localStorage");
    loadQueue();
    setDerivedQueue(store.queue);
    setDerivedPosition(store.position);
  }, [tracks]);

  return {
    addQueue(...trackIDs) {
      for (const id of trackIDs) {
        store.addToQueue(id);
      }
    },
    removeFromQueue(position) {
      store.removeFromQueue(position);
    },
    clearQueue() {
      store.clearQueue();
    },
    setPosition(i) {
      store.setPositionAndPlay(i);
    },
    resume() {
      store.play();
    },
    pause() {
      store.stop();
    },
    setVolume(volume) {
      // TODO: なんかできるだろ
      store.element.volume = volume / 100;
    },
    get queue() {
      // TODO: ! をやめる
      return derivedQueue.map(
        (id) => tracks.find((t) => t.PersistentID === id)!
      );
    },
    get position() {
      return derivedPosition;
    },
    get playing() {
      return playing;
    },
  };
}
