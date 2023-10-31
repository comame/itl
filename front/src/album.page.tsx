import { useParam } from "./hook/useParam";
import { usePlayback } from "./hook/usePlayback";
import { useTracks } from "./hook/useTracks";
import {
  albumArtist,
  albumArtworkURL,
  isChromeIncompatible,
  splitByAlbum,
  totalTimeInLocal,
} from "./library";

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
    resume();
  };

  const onClickArtwork = () => {
    const ids = album.tracks.map((v) => v.PersistentID);
    addQueue(...ids);
    resume();
  };

  return (
    <div className="min-w-[350px] max-w-screen-screen3 ml-auto mr-auto pl-16 pr-16">
      <div className="grid grid-cols-[30%,1fr] gap-[24px]">
        <div className="relative cursor-pointer group" onClick={onClickArtwork}>
          <img
            src={albumArtworkURL(tracksByAlbum, album.id)}
            className="aspect-square object-cover w-full"
          />
          <div className="absolute top-0 left-0 w-full h-full z-10 bg-transparent-press hidden group-hover:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <pixiv-icon name="24/Play" scale="3" />
            </div>
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold">{album.album}</p>
          <p>{albumArtist(album.tracks[0])}</p>
        </div>
      </div>
      <table className="mt-16 border-collapse w-full pr-8 pl-8 table-fixed">
        <thead>
          <tr className="[line-height:2]">
            <th className="w-[2em]"></th>
            <th className="w-[2em]"></th>
            <th className="text-left">名前</th>
            <th className="hidden screen2:table-cell text-left pl-16 pr-16">
              アーティスト
            </th>
            <th className="hidden screen2:table-cell w-[4em] text-left">
              時間
            </th>
          </tr>
        </thead>
        <tbody>
          {album.tracks.map((tr) => (
            <tr
              key={tr.PersistentID}
              onClick={() => onClickTrack(tr.PersistentID)}
              className="[line-height:2] odd:bg-background2 cursor-pointer hover:bg-background2-hover active:bg-background2-press"
            >
              <td>{tr.TrackNumber}</td>
              <td>{isChromeIncompatible(tr) && "!!"}</td>
              <td className="whitespace-nowrap overflow-x-hidden text-ellipsis">
                {tr.Name}
              </td>
              <td className="hidden screen2:table-cell whitespace-nowrap overflow-x-hidden text-ellipsis pl-16 pr-16">
                {tr.Artist}
              </td>
              <td className="hidden screen2:table-cell whitespace-nowrap overflow-x-hidden text-ellipsis">
                {totalTimeInLocal(tr.TotalTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
