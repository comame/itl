import { useEffect, useState } from "react";

import { usePlayback } from "../hook/usePlayback";
import { trackArtworkURL } from "../lib/library";

import { TrackList } from "./track_list";

export function PlaybackControl() {
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolumeState] = useState(20);

  const { queue, position, playing, pause, resume, clearQueue, setVolume } =
    usePlayback();

  const currentTrack = position >= 0 ? queue[position] : null;

  const onClickPlayPauseButton = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation(); // setShowControls を発火させないために呼ぶ
    if (playing) {
      pause();
    } else {
      resume();
    }
  };

  useEffect(() => {
    const l = (e: KeyboardEvent) => {
      if (e.code !== "Space") {
        return;
      }
      e.preventDefault();
      if (playing) {
        pause();
      } else {
        resume();
      }
    };
    window.addEventListener("keypress", l);
    return () => window.removeEventListener("keypress", l);
  }, [playing, pause, resume]);

  const toggleShowControl = () => {
    setShowControls((v) => !v);
  };

  const closeShowControl = () => {
    setShowControls(false);
  };

  const onClearQueue = () => {
    clearQueue();
  };

  const changeVolume = (volume: number) => {
    setVolumeState(volume);
  };

  // 音量の初期値を渡す
  useEffect(() => {
    setVolume(volume);
  }, [volume, setVolume]);

  const bgSrc = currentTrack
    ? trackArtworkURL(currentTrack.PersistentID)
    : undefined;

  return (
    <>
      {
        <>
          <div
            data-show={showControls ? "t" : "f"}
            className="-z-10 opacity-0 data-[show=t]:block data-[show=t]:opacity-100 data-[show=t]:z-10 fixed top-0 left-0 bg-[rgba(0,0,0,0.6)] w-full h-[calc(30vh-128px)] transition-all [transition-property:opacity]"
            onClick={closeShowControl}
          ></div>
          <div
            data-show={showControls ? "t" : "f"}
            className="fixed bottom-[calc(-100vh+64px)] data-[show=t]:bottom-64 left-0 w-full h-[calc(70vh+64px)] bg-background2 overflow-hidden transition-all"
          >
            <div className="text-right max-w-screen-screen3 h-40 ml-auto mr-auto pl-16 pr-16 pt-8 ">
              <button className="font-bold " onClick={onClearQueue}>
                キューを削除
              </button>
            </div>
            <div className="min-w-[350px] max-w-screen-screen3 h-[calc(100%-80px)] ml-auto mr-auto pl-16 pr-16 pt-8 overflow-y-auto">
              <TrackList tracks={queue} showAlbum controlQueue />
            </div>
            <div className="max-w-screen-screen3 h-40 ml-auto mr-auto pl-16 pr-16 pt-8">
              <label className="inline-block w-col-span-1">Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={volume}
                onChange={(e) => {
                  changeVolume(Number.parseInt(e.currentTarget.value, 10));
                }}
                className="w-[calc(100%-80px)] align-middle"
              />
            </div>
          </div>
        </>
      }
      <div
        className="w-full h-64 bg-background2 fixed bottom-0 left-0"
        style={
          !currentTrack
            ? {}
            : {
                backgroundImage: `linear-gradient(to right, rgba(245,245,245,0.3), #f5f5f5), url('${bgSrc}')`,
                backgroundSize: "80vw",
                backgroundRepeat: "no-repeat",
                backgroundPositionY: "50%",
              }
        }
        onClick={toggleShowControl}
      >
        <div className="flex justify-between pl-16 pr-16 max-w-screen-screen2 ml-auto mr-auto">
          <div className="flex flex-col justify-center max-w-[600px] w-[calc(100%-48px)] cursor-pointer">
            {currentTrack && (
              <>
                <span className="font-semibold text-lg whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {currentTrack.Name}
                </span>
                <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {currentTrack.Album + ", " + currentTrack.AlbumArtist}
                </span>
              </>
            )}
            {!currentTrack && "曲を選択してください"}
          </div>
          <button
            className="block pt-8 pb-8"
            onClickCapture={onClickPlayPauseButton}
          >
            {currentTrack &&
              (playing ? (
                <pixiv-icon name="24/Pause" scale="2" />
              ) : (
                <pixiv-icon name="24/Play" scale="2" />
              ))}
            {!currentTrack && <pixiv-icon name="24/Play" scale="2" />}
          </button>
        </div>
      </div>
    </>
  );
}
