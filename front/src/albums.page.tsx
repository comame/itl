import { Link } from "react-router-dom";
import { useTracks } from "./hook/useTracks";
import { albumArtworkURL, splitByAlbum } from "./library";

export default function Albums() {
  const tracks = useTracks();
  const tracksByAlbum = splitByAlbum(tracks);

  return (
    <div className="w-full">
      <ul className="grid w-full max-w-screen-screen5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[16px] ml-auto mr-auto pl-8 pr-8">
        {tracksByAlbum.map((album) => (
          <li key={album.id} className="block">
            <Link to={`/album/${album.id}`}>
              <div className="w-full aspect-square [border:1px_solid_#858585]">
                <img src={albumArtworkURL(tracksByAlbum, album.id)} />
              </div>
              <div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm">
                  {album.album}
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                  {album.albumArtist}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
