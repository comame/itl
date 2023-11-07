import { useState } from "react";
import { useOffline } from "./hook/useOffline";
import { useParam } from "./hook/useParam";
import { usePlayback } from "./hook/usePlayback";
import { usePlaylists, useTracks } from "./hook/useTracks";
import { trackArtworkURL } from "./library";
import { TrackList } from "./component/track_list";
import { track } from "./type/track";

export default function Playlist() {
  const playlists = usePlaylists();
  const allTracks = useTracks();

  const p = useParam();
  const { addQueue, resume } = usePlayback();
  const { save } = useOffline();
  const [isDownloading, setIsDownloading] = useState(false);

  const playlist = playlists.find((pl) => pl.PersistentID === p["id"]);
  if (!playlist) {
    return <div>Loading...</div>;
  }

  const tracks =
    (playlist.ItemTrackIDs?.map((id) =>
      allTracks.find((t) => t.ID === id)
    ).filter((v) => typeof v !== "undefined") as track[]) ?? [];

  const onClickArtwork = () => {
    const ids = tracks.map((v) => v.PersistentID);
    addQueue(...ids);
    resume();
  };

  const onDownloadClick = async () => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    await save(tracks.map((v) => v.PersistentID));
    setIsDownloading(false);
  };

  return (
    <div className="min-w-[350px] max-w-screen-screen3 ml-auto mr-auto pl-16 pr-16">
      <div className="grid grid-cols-[30%,1fr] gap-[24px]">
        <div className="relative cursor-pointer group" onClick={onClickArtwork}>
          <img
            crossOrigin="use-credentials"
            src={trackArtworkURL(tracks[0]?.PersistentID ?? "")}
            className="aspect-square object-cover w-full"
          />
          <div className="absolute top-0 left-0 w-full h-full z-10 bg-transparent-press hidden group-hover:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <pixiv-icon name="24/Play" scale="3" />
            </div>
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold">{playlist.Name}</p>
          <button onClick={onDownloadClick} className="mt-16 text-text1">
            {isDownloading && <pixiv-icon name="24/Roll" scale="2" />}
            {!isDownloading && <pixiv-icon name="24/DownloadAlt" scale="2" />}
          </button>
        </div>
      </div>
      <div className="mt-16 pr-8 pl-8 w-full">
        <TrackList tracks={tracks} />
      </div>
    </div>
  );
}
