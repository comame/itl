import { Link, Outlet } from "react-router-dom";
import { useQueue } from "./hook/useQueue";
import { PlaybackControl } from "./playbackControl";

export default function Index() {
  const { queue } = useQueue();
  console.log(queue.map((v) => v.Name).join(", "));

  return (
    <div>
      <ul>
        <li>
          <Link to="/">albums</Link>
        </li>
        <li>
          <Link to="/playlists">playlists</Link>
        </li>
      </ul>

      <PlaybackControl />

      <Outlet />
    </div>
  );
}
