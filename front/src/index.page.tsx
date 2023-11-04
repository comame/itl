import { Link, Outlet } from "react-router-dom";
import { PlaybackControl } from "./playback_control";
import { GlobalNavigation } from "./global_navigation";

export default function Index() {
  return (
    <div className="mb-104 w-full bg-background1 mt-24">
      <div className="mb-16 ml-8">
        <GlobalNavigation />
      </div>

      <Outlet />

      <PlaybackControl />
    </div>
  );
}
