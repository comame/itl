import { useRef, ReactEventHandler, useEffect } from "react";
import { usePlayback } from "./hook/usePlayback";
import { getEndpointURL } from "./api";

export function PlaybackControl() {
  const { queue, position, setPosition, playing } = usePlayback();

  const currentTrack = position >= 0 ? queue[position] : null;

  const audioRef = useRef<HTMLAudioElement>(null);

  // 音量の初期値
  useEffect(() => {
    const c = audioRef.current;
    if (!c) {
      return;
    }
    c.volume = 0.1;
  }, [audioRef.current, currentTrack]);

  useEffect(() => {
    const c = audioRef.current;
    if (!c) {
      return;
    }

    if (playing) {
      c.play();
    } else {
      c.pause();
    }
  }, [audioRef.current, playing]);

  const onEnded = () => {
    setPosition(position + 1);
  };

  if (!currentTrack) {
    return null;
  }

  const src = getEndpointURL("/api/track/" + currentTrack.PersistentID);

  return (
    <div>
      <audio ref={audioRef} onEnded={onEnded} src={src}></audio>
    </div>
  );
}
