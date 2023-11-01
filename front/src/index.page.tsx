import { Link, Outlet } from "react-router-dom";
import { PlaybackControl } from "./playbackControl";

export default function Index() {
  return (
    <div className="mb-104 w-full bg-background1 mt-24">
      <Outlet />

      <PlaybackControl />
    </div>
  );
}
