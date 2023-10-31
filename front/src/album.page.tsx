import { useParam } from "./hook/useParam";
import { usePlayback } from "./hook/usePlayback";
import { useTracks } from "./hook/useTracks";
import { splitByAlbum } from "./library";

export default function Album() {
  const p = useParam();

  const tracks = useTracks();
  const tracksByAlbum = splitByAlbum(tracks);

  const { addQueue, setPosition, resume } = usePlayback();

  const album = tracksByAlbum.find((v) => v.id == p["id"]);
  if (!album) {
    return <div>Not Found</div>;
  }

  const onClickTrack = (id: string) => {
    addQueue(id);
    setPosition(0);
    resume();
  };

  return (
    <div>
      <ul>
        {album.tracks.map((tr) => (
          <li key={tr.PersistentID}>
            <a onClick={() => onClickTrack(tr.PersistentID)}>{tr.Name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
