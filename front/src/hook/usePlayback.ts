import { useEffect, useState, useSyncExternalStore } from "react";
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
  setVolume: (volume: number) => void;
};

const audioEl = document.getElementById("audio") as HTMLAudioElement;

export function usePlayback(): ret {
  if (!audioEl) {
    throw "<audio> がない";
  }

  useEffect(() => {
    loadQueue();
  }, []);

  useSyncExternalStore(queueStore.subscribe, queueStore.getSnapshot);

  const tracks = useTracks();

  // MediaSession の再生状態の変更を反映する
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

    return () => {
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("play", null);
    };
  });

  // 再生する。src が異なる場合はその音源を再生する
  const playTrack = (track: track) => {
    const src = getEndpointURL("/api/track/" + track.PersistentID);
    if (audioEl.src !== src) {
      audioEl.src = src;
    }
    audioEl.play();
  };

  const pauseTrack = () => {
    audioEl.pause();
  };

  // track 情報を MediaSession に表示する
  const setSessionMetadata = (track: track) => {
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

  // audioEl の再生状態を queueStore と mediaSession に同期する
  useEffect(() => {
    const lp = () => {
      console.log("play");
      queueStore.playing = true;
      navigator.mediaSession.playbackState = "playing";
      queueStore.dispatch();
    };
    const le = () => {
      console.log("pause");
      queueStore.playing = false;
      navigator.mediaSession.playbackState = "paused";
      queueStore.dispatch();
    };
    audioEl.addEventListener("play", lp);
    audioEl.addEventListener("pause", le);
    return () => {
      audioEl.removeEventListener("play", lp);
      audioEl.removeEventListener("pause", le);
    };
  }, []);

  const [position, setPosition] = useState(0);

  useEffect(() => {
    const l = () => {
      // TODO: なんかものすごい勢いで飛ぶ
      console.log("ended or error");
      retObj.setPosition(queueStore.position + 1);
      retObj.resume();
    };
    audioEl.addEventListener("ended", l);
    audioEl.addEventListener("error", l);
    return () => {
      audioEl.removeEventListener("ended", l);
      audioEl.removeEventListener("error", l);
    };
  }, []);

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
      saveQueue();
    },
    get playing() {
      return queueStore.playing;
    },
    resume() {
      const id = queueStore.queue[queueStore.position];
      const track = tracks.find((t) => t.PersistentID === id);
      if (!track) {
        return;
      }
      playTrack(track);
      setSessionMetadata(track);
      queueStore.dispatch();
    },
    pause() {
      pauseTrack();
      queueStore.dispatch();
    },
    removeFromQueue(p: number) {
      const curp = queueStore.position;

      queueStore.queue.splice(p, 1);

      if (curp > p) {
        queueStore.position -= 1;
      }

      if (curp === p) {
        retObj.resume();
      }

      if (queueStore.queue.length === 0) {
        pauseTrack();
        retObj.setPosition(0);
      }

      queueStore.dispatch();
      saveQueue();
    },
    clearQueue() {
      queueStore.queue = [];
      retObj.setPosition(0);
      pauseTrack();
      queueStore.dispatch();
      saveQueue();
    },
    setVolume(volume: number) {
      audioEl.volume = volume / 100;
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
