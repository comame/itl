import { Link } from "react-router-dom";
import { useTracks } from "./hook/useTracks";
import { albumArtworkURL, splitByAlbum } from "./library";

export default function Albums() {
  const tracks = useTracks();
  const tracksByAlbum = splitByAlbum(tracks);

  return (
    <div>
      <ul>
        {tracksByAlbum.map((album) => {
          return (
            <li key={album.id}>
              <Link to={`/album/${album.id}`}>
                {album.genre + ": " + album.album + " / " + album.albumArtist}
                <img
                  src={albumArtworkURL(tracksByAlbum, album.id)}
                  width={32}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
