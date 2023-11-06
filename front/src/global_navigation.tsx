import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function GlobalNavigation() {
  const location = useLocation();

  const isAlbumPage = () =>
    location.pathname === "/" || location.pathname.startsWith("/genre/");

  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const l = () => {
      setOffline(!navigator.onLine);
    };
    window.addEventListener("online", l);
    window.addEventListener("offline", l);
    return () => {
      window.addEventListener("online", l);
      window.addEventListener("offline", l);
    };
  }, []);

  return (
    <div>
      {offline && (
        <p className="fixed top-8 right-8 bg-background2 p-8 font-bold text-text2 rounded-8">
          オフライン
        </p>
      )}
      <Link
        to="/"
        data-now={isAlbumPage() ? "t" : "f"}
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
      <Link
        to="/settings"
        data-now={location.pathname == "/settings" ? "t" : "f"}
        className="inline-block text-2xl text-text2 pl-16 data-[now=t]:font-bold data-[now=t]:text-text1"
      >
        設定
      </Link>
    </div>
  );
}
