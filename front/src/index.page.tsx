import { Link, Outlet } from "react-router-dom";
import { PlaybackControl } from "./playbackControl";
import { GlobalNavigation } from "./globalNavigation";

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
