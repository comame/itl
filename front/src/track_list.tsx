import React from "react";
import { usePlayback } from "./hook/usePlayback";
import { albumArtist, isChromeIncompatible, totalTimeInLocal } from "./library";
import { track } from "./type/track";
import { useOffline } from "./hook/useOffline";

type props = {
  tracks: track[];
  showAlbum?: boolean;
  controlQueue?: boolean;
};

export function TrackList({ tracks, showAlbum, controlQueue }: props) {
  const { addQueue, resume, position, queue, setPosition, removeFromQueue } =
    usePlayback();

  const onClickTrack = (id: string, listIndex: number) => {
    if (controlQueue) {
      setPosition(listIndex);
      resume();
      return;
    }
    addQueue(id);
    resume();
  };

  const onContextTrack = (e: React.MouseEvent, listIndex: number) => {
    e.preventDefault();
    if (!controlQueue) {
      return;
    }

    removeFromQueue(listIndex);
  };

  const currentTrack = tracks.find(
    (t) => t.PersistentID === queue[position]?.PersistentID
  );

  return (
    <table className="border-collapse w-full table-fixed">
      <thead>
        <tr className="[line-height:2]">
          <th className="w-[2em]"></th>
          <th className="w-[2em]"></th>
          <th className="text-left">名前</th>
          <th className="hidden screen2:table-cell text-left pl-16 pr-16">
            {showAlbum ? "アルバム" : "アーティスト"}
          </th>
          <th className="hidden screen2:table-cell w-[4em] text-left">時間</th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((tr, i) => (
          <tr
            key={!controlQueue ? tr.PersistentID : `${i}:${tr.PersistentID}`}
            onClick={() => onClickTrack(tr.PersistentID, i)}
            onContextMenu={(e) => onContextTrack(e, i)}
            className="[line-height:2] odd:bg-background2 cursor-pointer hover:bg-background2-hover active:bg-background2-press"
          >
            <td>{tr.TrackNumber}</td>
            <td>
              <Indicator
                track={tr}
                currentTrack={currentTrack}
                isQueue={controlQueue ?? false}
                queuePosition={position}
                listIndex={i}
              />
            </td>
            <td className="whitespace-nowrap overflow-x-hidden text-ellipsis">
              {tr.Name}
            </td>
            <td className="hidden screen2:table-cell whitespace-nowrap overflow-x-hidden text-ellipsis pl-16 pr-16">
              {showAlbum ? tr.Album + ", " + albumArtist(tr) : albumArtist(tr)}
            </td>
            <td className="hidden screen2:table-cell whitespace-nowrap overflow-x-hidden text-ellipsis">
              {totalTimeInLocal(tr.TotalTime)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Indicator({
  track,
  currentTrack,
  isQueue,
  queuePosition,
  listIndex,
}: {
  track: track;
  currentTrack: track | undefined;
  isQueue: boolean;
  queuePosition: number;
  listIndex: number;
}) {
  const { cachedTrackIDs } = useOffline();

  if (isChromeIncompatible(track)) {
    return "!!";
  }
  if (!isQueue) {
    if (track.PersistentID === currentTrack?.PersistentID) {
      return "▶";
    }

    if (cachedTrackIDs.includes(track.PersistentID)) {
      return "✓";
    }

    return "";
  }

  if (queuePosition === listIndex) {
    return "▶";
  }

  return "";
}
