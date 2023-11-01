import { Link } from "react-router-dom";
import { usePlaylists, useTracks } from "./hook/useTracks";
import { trackArtworkURL } from "./library";
import { playlist } from "./type/playlist";

export default function Playlists() {
  const playlists = usePlaylists();
  const tracks = useTracks();

  const playlistTrack = (pl: playlist) =>
    tracks.find((v) => v.ID === pl.ItemTrackIDs?.[0]);

  return (
    <div className="w-full">
      <div className="mb-16 ml-8">
        <Link to="/" className="inline-block text-2xl text-text2">
          アルバム
        </Link>
        <Link to="/playlists" className="pl-16 inline-block text-2xl font-bold">
          プレイリスト
        </Link>
      </div>
      <ul className="grid w-full max-w-screen-screen5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[16px] ml-auto mr-auto pl-8 pr-8">
        {playlists
          .filter((pl) => pl.ItemTrackIDs !== null)
          .map((pl) => (
            <li key={pl.PersistentID} className="block">
              <Link to={`/playlist/${pl.PersistentID}`}>
                <div className="w-full aspect-square [border:1px_solid_#858585]">
                  <img
                    src={trackArtworkURL(playlistTrack(pl)?.PersistentID ?? "")}
                    className="aspect-square object-cover w-full"
                  />
                </div>
                <div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm">
                    {pl.Name}
                  </div>
                </div>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
