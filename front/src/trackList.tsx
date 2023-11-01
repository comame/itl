import React from "react";
import { usePlayback } from "./hook/usePlayback";
import { useTracks } from "./hook/useTracks";
import { isChromeIncompatible, totalTimeInLocal } from "./library";
import { track } from "./type/track";

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
            // キューの時、キーとして適切なものが存在しない
            key={!controlQueue ? tr.PersistentID : undefined}
            onClick={() => onClickTrack(tr.PersistentID, i)}
            onContextMenu={(e) => onContextTrack(e, i)}
            className="[line-height:2] odd:bg-background2 cursor-pointer hover:bg-background2-hover active:bg-background2-press"
          >
            <td>{tr.TrackNumber}</td>
            <td>
              {indicator(tr, currentTrack, controlQueue ?? false, position, i)}
            </td>
            <td className="whitespace-nowrap overflow-x-hidden text-ellipsis">
              {tr.Name}
            </td>
            <td className="hidden screen2:table-cell whitespace-nowrap overflow-x-hidden text-ellipsis pl-16 pr-16">
              {showAlbum ? tr.Album + ", " + tr.AlbumArtist : tr.Artist}
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

function indicator(
  track: track,
  currentTrack: track | undefined,
  isQueue: boolean,
  queuePosition: number,
  listIndex: number
): string {
  if (isChromeIncompatible(track)) {
    return "!!";
  }
  if (!isQueue) {
    if (track.PersistentID === currentTrack?.PersistentID) {
      return "▶";
    }
    return "";
  }

  if (queuePosition === listIndex) {
    return "▶";
  }

  return "";
}
