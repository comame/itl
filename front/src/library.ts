import { getEndpointURL } from "./api";
import { track } from "./type/track";

export type trackByAlbum = {
  id: string;
  album: string;
  albumArtist: string;
  genre: string;
  tracks: track[];
};

/**
 * track をアルバムごとに分類する。アルバム名とアルバムアーティストが一致したとき、同じアルバムとみなす。
 */
export function splitByAlbum(tracks: track[]): trackByAlbum[] {
  const ta: trackByAlbum[] = [];

  let previousID = 1;

  for (const tr of tracks) {
    const alb = ta.find(
      (v) => v.album === tr.Album && v.albumArtist === tr.AlbumArtist
    );
    if (alb) {
      alb.tracks.push(tr);
    } else {
      ta.push({
        id: previousID.toString(10),
        album: tr.Album,
        albumArtist: tr.AlbumArtist,
        genre: tr.Genre,
        tracks: [tr],
      });
      previousID += 1;
    }
  }

  return ta;
}

/** トラックのアートワーク URL を返す。 */
export function trackArtworkURL(id: string): string {
  return getEndpointURL("/api/artwork/" + id);
}

/**
 * アルバムのアートワーク URL を返す。アルバムに含まれる最初のトラックのアートワークを返す。
 */
export function albumArtworkURL(lib: trackByAlbum[], albumID: string): string {
  const album = lib.find((v) => v.id === albumID);
  if (!album) {
    return "";
  }
  if (album.tracks.length === 0) {
    return "";
  }
  const trid = album.tracks[0].PersistentID;
  return getEndpointURL("/api/artwork/" + trid);
}

/** 秒数を 1:01 形式で返す。 */
export function totalTimeInLocal(time: number): string {
  const st = Math.trunc(time / 1000);
  const m = Math.trunc(st / 60);
  const s = st - 60 * m;

  const ss = s < 10 ? `0${s}` : `${s}`;

  return `${m}:${ss}`;
}

/** トラックのアルバムアーティストまたはアーティストを返す。 */
export function albumArtist(track: track): string {
  if (track.AlbumArtist != "") {
    return track.AlbumArtist;
  }
  return track.Artist;
}

/** Chrome で再生可能かどうかを返す。 */
export function isChromeIncompatible(track: track | null): boolean {
  if (track === null) {
    return false;
  }
  if (track.Kind === "Apple Losslessオーディオファイル") {
    return true;
  }
  return false;
}

/** ライブラリの中から特定のジャンルの曲を絞る。 */
export function getGenres(tracks: track[]): string[] {
  const g = new Set<string>();

  for (const t of tracks) {
    g.add(t.Genre);
  }

  return Array.from(g);
}
