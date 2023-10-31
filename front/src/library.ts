import { getEndpointURL } from "./api";
import { track } from "./type/track";

type trackByAlbum = {
  id: string;
  album: string;
  albumArtist: string;
  genre: string;
  tracks: track[];
};

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

export function trackArtworkURL(id: string): string {
  return getEndpointURL("/api/artwork/" + id);
}

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
