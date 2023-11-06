import { useCallback, useEffect, useSyncExternalStore } from "react";
import { track } from "../type/track";
import { useTracks } from "./useTracks";
import { isChromeIncompatible, trackArtworkURL } from "../library";
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
  setVolume: (volume: number) => void;
};

const audioEl = document.getElementById("audio") as HTMLAudioElement;

export function usePlayback(): ret {
  if (!audioEl) {
    throw "<audio> がない";
  }

  const tracks = useTracks();

  const addQueue = (...trackIDs: string[]) => {
    console.log(tracks.length);
    trackIDs = trackIDs.filter(
      (v) =>
        !isChromeIncompatible(
          tracks.find((tf) => tf.PersistentID === v) ?? null
        )
    );
    queueStore.queue = [...queueStore.queue, ...trackIDs];
    queueStore.dispatch();
    saveQueue();
  };

  const setPosition = (i: number) => {
    if (i >= queueStore.queue.length) {
      queueStore.position = 0;
    } else {
      queueStore.position = i;
    }
    queueStore.dispatch();
    saveQueue();
  };

  const resume = useCallback(() => {
    const id = queueStore.queue[queueStore.position];
    const track = tracks.find((t) => t.PersistentID === id);
    if (!track) {
      console.log("no track");
      return;
    }
    playTrack(track);
    setSessionMetadata(track);
    queueStore.dispatch();
  }, [tracks]);

  const pause = useCallback(() => {
    pauseTrack();
    queueStore.dispatch();
  }, []);

  const removeFromQueue = (p: number) => {
    const curp = queueStore.position;

    queueStore.queue.splice(p, 1);

    if (curp > p) {
      queueStore.position -= 1;
    }

    if (curp === p) {
      resume();
    }

    if (queueStore.queue.length === 0) {
      pauseTrack();
      setPosition(0);
    }

    queueStore.dispatch();
    saveQueue();
  };

  const clearQueue = () => {
    queueStore.queue = [];
    setPosition(0);
    pauseTrack();
    queueStore.dispatch();
    saveQueue();
  };

  const setVolume = (volume: number) => {
    audioEl.volume = volume / 100;
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const currentStore = useSyncExternalStore(
    queueStore.subscribe,
    queueStore.getSnapshot
  );
  // FIXME: さすがにアレなので直したい
  const currentPosition = Number.parseInt(currentStore.split(":")[0], 10);

  // MediaSession の再生状態の変更を反映する
  useEffect(() => {
    navigator.mediaSession.setActionHandler("pause", () => {
      console.log("mediaSession pause");
      pause();
    });
    navigator.mediaSession.setActionHandler("stop", () => {
      console.log("mediaSession stop");
      pause();
    });
    navigator.mediaSession.setActionHandler("play", () => {
      console.log("mediaSession play");
      resume();
    });

    return () => {
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("play", null);
    };
  }, [pause, resume]);

  // 再生する。src が異なる場合はその音源を再生する
  const playTrack = (track: track) => {
    console.log("playTrack");
    const src = getEndpointURL("/api/track/" + track.PersistentID);
    if (audioEl.src !== src) {
      audioEl.src = src;
    }
    audioEl.play();
  };

  const pauseTrack = () => {
    console.log("pauseTrack");
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
      console.log("play event");
      queueStore.playing = true;
      navigator.mediaSession.playbackState = "playing";
      queueStore.dispatch();
    };
    const le = () => {
      console.log("pause event");
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

  // トラック終了時の処理
  useEffect(() => {
    const l = (e: Event | ErrorEvent) => {
      console.log("ended or error");
      if ("error" in e) {
        console.log(e.error);
      }
      setPosition(queueStore.position + 1);
      resume();
      queueStore.dispatch();
    };
    audioEl.addEventListener("ended", l);
    audioEl.addEventListener("error", l);
    return () => {
      audioEl.removeEventListener("ended", l);
      audioEl.removeEventListener("error", l);
    };
  }, [currentPosition, resume]);

  return {
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
    get playing() {
      return queueStore.playing;
    },
    addQueue,
    setPosition,
    resume,
    pause,
    removeFromQueue,
    clearQueue,
    setVolume,
  };
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
    return `${queueStore.position}:${queueStore.playing}:${queueStore.queue}`;
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
