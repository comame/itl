import { useCallback, useEffect, useSyncExternalStore } from "react";
import { track } from "../type/track";
import { useTracks } from "./useTracks";
import { isChromeIncompatible, trackArtworkURL } from "../library";
import { getEndpointURL } from "../api";

type ret = {
  addQueue: (...trackIDs: string[]) => void;
  removeFromQueue: (position: number) => void;
  rearrange: (a: number, b: number) => void;
  clearQueue: () => void;
  setPosition: (i: number) => void;
  queue: track[];
  position: number;
  playing: boolean;
  resume: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
};

// <audio> はReact で管理しない
const audioEl = document.getElementById("audio") as HTMLAudioElement;
if (!audioEl || audioEl.tagName !== "AUDIO") {
  throw "<audio> がない";
}

/**
 * キュー、音声の再生状態を管理する。
 * 実装方針として、再生状態は常に React の管理外にある `<audio>` を信頼し、React の持つ状態は `<audio>` から取得したものとする。
 * */
export function usePlayback(): ret {
  const tracks = useTracks();

  // キューにトラックを追加し、更新通知する
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

  // キュー内の再生しているトラックのインデックスを変更し、更新通知する
  const setPosition = (i: number) => {
    if (i >= queueStore.queue.length) {
      queueStore.position = 0;
    } else if (i < 0) {
      queueStore.position = queueStore.queue.length - 1;
    } else {
      queueStore.position = i;
    }
    queueStore.dispatch();
    saveQueue();
  };

  // 現在のキューを再生開始し、更新通知する
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

  // 再生を一時停止し、更新通知する
  const pause = useCallback(() => {
    pauseTrack();
    queueStore.dispatch();
  }, []);

  const nextTrack = useCallback(() => {
    setPosition(queueStore.position + 1);
    resume();
  }, [resume]);

  const prevTrack = useCallback(() => {
    setPosition(queueStore.position - 1);
    resume();
  }, [resume]);

  // 指定したインデックスのキューを削除し、更新通知する
  // 再生中のトラックだったとき、自動的に次のトラックを再生する。キューが空になったとき、再生停止する。
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

  // キューを空にし、再生停止する
  const clearQueue = () => {
    queueStore.queue = [];
    setPosition(0);
    pauseTrack();
    queueStore.dispatch();
    saveQueue();
  };

  // 音量を変更する
  const setVolume = (volume: number) => {
    audioEl.volume = volume / 100;
  };

  const rearrange = (target: number, to: number) => {
    const queue = [...queueStore.queue];
    const p = queueStore.position;

    if (target === p) {
      queueStore.position = to;
    } else if (target > p && p >= to) {
      queueStore.position += 1;
    } else if (target < p && p <= to) {
      queueStore.position -= 1;
    }

    const t = queue[target];
    queue.splice(target, 1);
    queueStore.queue = [...queue.slice(0, to), t, ...queue.slice(to)];

    queueStore.dispatch();
    saveQueue();
  };

  // localStorage に保存したキューを呼び出す
  useEffect(() => {
    loadQueue();
  }, []);

  useSyncExternalStore(queueStore.subscribe, queueStore.getSnapshot);

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
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      prevTrack();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      nextTrack();
    });

    return () => {
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [pause, resume, nextTrack, prevTrack]);

  // 再生する。src が異なる場合はその音源を再生する
  const playTrack = (track: track) => {
    console.log("playTrack");
    const src = getEndpointURL("/api/track/" + track.PersistentID);
    if (audioEl.src !== src) {
      console.log("start", track.Name, track.PersistentID);
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
    const ltu = () => {
      if (!Number.isFinite(audioEl.duration)) {
        return;
      }
      navigator.mediaSession.setPositionState({
        duration: audioEl.duration,
        position: audioEl.currentTime,
      });
    };

    audioEl.addEventListener("play", lp);
    audioEl.addEventListener("pause", le);
    audioEl.addEventListener("timeupdate", ltu);
    return () => {
      audioEl.removeEventListener("play", lp);
      audioEl.removeEventListener("pause", le);
      audioEl.removeEventListener("timeupdate", ltu);
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
  }, [resume]);

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
    rearrange,
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
