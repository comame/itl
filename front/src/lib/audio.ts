import { track } from "../type/track";
import { trackURL, trackArtworkURL } from "./library";

export const store = {
  element: document.getElementById("audio") as HTMLAudioElement,
  queue: [] as readonly string[],
  position: 0,

  _onQueueUpdateHandlers: [] as (() => void)[],
  _tracks: [] as track[],

  /** 今のキューの楽曲を再生する */
  play() {
    const track = store._tracks.find(
      (tr) => tr.PersistentID === store.queue[store.position]
    );
    if (!track) {
      console.warn("トラックがない");
      return;
    }
    const src = trackURL(track.PersistentID);
    if (store.element.src !== src) {
      store.element.src = src;
    }
    store.element.play();
  },
  /** 一時停止 */
  stop() {
    store.element.pause();
  },

  /** キューに曲を追加する。 */
  addToQueue(persistentID: string) {
    store.queue = [...store.queue, persistentID];
    for (const cb of store._onQueueUpdateHandlers) {
      cb();
    }
    saveQueue();
  },
  /** キューの再生位置を変更し、再生する */
  setPositionAndPlay(n: number) {
    n = n % store.queue.length;
    while (n < 0) {
      n += store.queue.length;
    }

    store.position = n;
    store.play();
    for (const cb of store._onQueueUpdateHandlers) {
      cb();
    }
    saveQueue();
  },
  /** キューから指定したインデックスの曲を取り除く */
  removeFromQueue(n: number) {
    const q = [...store.queue];
    q.splice(n, 1);
    store.queue = q;

    if (n === store.position) {
      store.setPositionAndPlay(n);
    } else if (n < store.position) {
      store.position -= 1;
    }
    for (const cb of store._onQueueUpdateHandlers) {
      cb();
    }
    saveQueue();
  },
  /** キューを削除し、再生停止する */
  clearQueue() {
    store.queue = [];
    store.position = 0;
    store.stop();
    for (const cb of store._onQueueUpdateHandlers) {
      cb();
    }
    saveQueue();
  },

  // React との接続に使う
  addOnQueueUpdate(cb: () => void) {
    store._onQueueUpdateHandlers.push(cb);
  },
  removeOnQueueUpdate(cb: () => void) {
    const i = store._onQueueUpdateHandlers.findIndex((v) => v === cb);
    if (i < 0) {
      return;
    }
    store._onQueueUpdateHandlers.splice(i, 1);
  },
  setTracks(tracks: track[]) {
    store._tracks = tracks;
  },
};

// <audio> と MediaSession をつなぐ
function connectMediaSession() {
  store.element.addEventListener("play", () => {
    const track = store._tracks.find(
      (tr) => tr.PersistentID === store.queue[store.position]
    );
    if (!track) {
      console.warn("MediaMetadata をセットしようとしたが、track がない");
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      album: track.Album,
      artist: track.Artist || track.AlbumArtist,
      artwork: [
        {
          src: trackArtworkURL(track.PersistentID),
        },
      ],
      title: track.Name,
    });
  });
  store.element.addEventListener("ended", () => {
    store.setPositionAndPlay(store.position + 1);
  });
  store.element.addEventListener("error", (e) => {
    console.warn("再生に失敗", e.error);
    store.setPositionAndPlay(store.position + 1);
  });

  navigator.mediaSession.setActionHandler("play", () => {
    store.play();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    store.stop();
  });
  navigator.mediaSession.setActionHandler("stop", () => {
    store.stop();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => {
    store.setPositionAndPlay(store.position - 1);
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => {
    store.setPositionAndPlay(store.position + 1);
  });
}

connectMediaSession();

function saveQueue() {
  const data = {
    q: store.queue,
    p: store.position,
  };
  localStorage.setItem("queue", JSON.stringify(data));
}

/** LocalStorage から前回のキューを読み込む */
export function loadQueue() {
  const s = localStorage.getItem("queue");
  if (!s) {
    return;
  }
  const d = JSON.parse(s);
  store.queue = d.q;
  store.position = d.p;
}
