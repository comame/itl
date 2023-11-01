import { Link, Outlet } from "react-router-dom";
import { PlaybackControl } from "./playbackControl";

export default function Index() {
  return (
    <div className="mb-104 w-full bg-background1">
      <ul>
        <li>
          <Link to="/">albums</Link>
        </li>
        <li>
          <Link to="/playlists">playlists</Link>
        </li>
      </ul>

      <Outlet />

      <PlaybackControl />
    </div>
  );
}
