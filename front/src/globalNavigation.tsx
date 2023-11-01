import { Link, useHref, useLocation } from "react-router-dom";

export function GlobalNavigation() {
  const location = useLocation();
  console.log(location);

  return (
    <div className="">
      <Link
        to="/"
        data-now={location.pathname == "/" ? "t" : "f"}
        className="inline-block text-2xl text-text2 pl-16 data-[now=t]:font-bold data-[now=t]:text-text1"
      >
        アルバム
      </Link>
      <Link
        to="/playlists"
        data-now={location.pathname == "/playlists" ? "t" : "f"}
        className="inline-block text-2xl text-text2 pl-16 data-[now=t]:font-bold data-[now=t]:text-text1"
      >
        プレイリスト
      </Link>
    </div>
  );
}
