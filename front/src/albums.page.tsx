import { Link } from "react-router-dom";
import { useTracks } from "./hook/useTracks";
import {
  albumArtist,
  albumArtworkURL,
  getGenres,
  splitByAlbum,
  trackByAlbum,
} from "./library";
import React, { useState } from "react";

export default function Albums() {
  const tracks = useTracks();
  const tracksByAlbum = splitByAlbum(tracks);

  const [selectedGenre, selectGenre] = useState("");
  const genres = getGenres(tracks);

  return (
    <div className="w-full">
      <div className="mb-16 ml-8">
        <Link to="/" className="inline-block font-bold text-2xl">
          アルバム
        </Link>
        <Link
          to="/playlists"
          className="pl-16 inline-block text-2xl text-text2"
        >
          プレイリスト
        </Link>
      </div>
      <select
        value={selectedGenre}
        onChange={(e) => {
          selectGenre(e.currentTarget.value);
        }}
        className="mb-16 ml-4"
      >
        <option value="">ジャンルを選択...</option>
        {genres.map((g) => (
          <React.Fragment key={g}>
            <option value={g}>{g}</option>
          </React.Fragment>
        ))}
      </select>
      <ul className="grid w-full max-w-screen-screen5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[16px] ml-auto mr-auto pl-8 pr-8">
        {tracksByAlbum
          .filter((al) => {
            if (!selectedGenre) {
              return true;
            }
            return al.genre === selectedGenre;
          })
          .map((album) => (
            <li key={album.id} className="block">
              <Link to={`/album/${album.id}`}>
                <div className="w-full aspect-square [border:1px_solid_#858585]">
                  <img
                    src={albumArtworkURL(tracksByAlbum, album.id)}
                    className="aspect-square object-cover w-full"
                  />
                </div>
                <div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm">
                    {album.album}
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                    {albumArtist(album.tracks[0])}
                  </div>
                </div>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
