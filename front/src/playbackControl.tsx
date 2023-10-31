import { useRef, ReactEventHandler, useEffect } from "react";
import { usePlayback } from "./hook/usePlayback";
import { getEndpointURL } from "./api";
import { trackArtworkURL } from "./library";

export function PlaybackControl() {
  const { queue, position, setPosition, playing, pause, resume } =
    usePlayback();

  const currentTrack = position >= 0 ? queue[position] : null;

  const audioRef = useRef<HTMLAudioElement>(null);

  // 音量の初期値
  useEffect(() => {
    function f() {
      const c = audioRef.current;
      if (!c) {
        setTimeout(f, 0);
        return;
      }
      c.volume = 0.1;
    }
    f();
  }, []);

  useEffect(() => {
    if (playing) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [audioRef.current, playing]);

  const onEnded = () => {
    setPosition(position + 1);
    const c = audioRef.current;
    if (c) {
      c.currentTime = 0;
    }
  };

  const onClickPlayPauseButton = () => {
    if (playing) {
      pause();
    } else {
      resume();
    }
  };

  const onCanPlay = () => {
    if (playing) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  };

  const src = currentTrack
    ? getEndpointURL("/api/track/" + currentTrack.PersistentID)
    : undefined;
  const bgSrc = currentTrack
    ? trackArtworkURL(currentTrack.PersistentID)
    : undefined;

  return (
    <>
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
      >
        <audio
          ref={audioRef}
          onEnded={onEnded}
          onCanPlay={onCanPlay}
          src={src}
        ></audio>
        <div className="flex justify-between pl-16 pr-16 max-w-screen-screen2 ml-auto mr-auto">
          <div className="flex flex-col justify-center max-w-[600px]">
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
          <button className="block pt-8 pb-8" onClick={onClickPlayPauseButton}>
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
