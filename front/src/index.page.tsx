import { Link, Outlet } from "react-router-dom";
import { useJSONAPI } from "./hook/useAPI";
import { getTracks } from "./api";

export default function Index() {
  const tracks = useJSONAPI(getTracks);
  console.log(tracks);

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
      <Outlet />
    </div>
  );
}
