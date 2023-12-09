import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

let scrollPosition = 0;

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

  const [showNav, setShowNav] = useState(true);
  const [showShadow, setShowShadow] = useState(false);
  useEffect(() => {
    const f = () => {
      if (window.scrollY <= 32) {
        setShowNav(true);
        setShowShadow(false);
      } else if (scrollPosition > window.scrollY) {
        setShowNav(true);
        setShowShadow(true);
      } else {
        setShowNav(false);
        setShowShadow(true);
      }
      scrollPosition = window.scrollY;
    };
    window.addEventListener("scroll", f);
    return () => {
      window.removeEventListener("scroll", f);
    };
  }, []);

  return (
    <div
      data-show={showNav ? "t" : "f"}
      data-shadow={showShadow ? "t" : "f"}
      className="fixed top-0 left-0 h-64 [line-height:64px] w-full bg-background1 data-[show=f]:-top-64 transition-all [box-shadow:0_2px_5px_rgba(3,3,3,.2)] data-[shadow=f]:[box-shadow:none] data-[show=f]:[box-shadow:none]"
    >
      {offline && (
        <p className="fixed top-8 right-8 bg-background2 p-8 font-bold text-text2 rounded-8">
          オフライン
        </p>
      )}
      <Link
        to="/"
        data-now={isAlbumPage() ? "t" : "f"}
        className="inline-block text-2xl text-text2 ml-16 data-[now=t]:font-bold data-[now=t]:text-text1"
      >
        アルバム
      </Link>
      <Link
        to="/playlists"
        data-now={location.pathname == "/playlists" ? "t" : "f"}
        className="inline-block text-2xl text-text2 ml-16 data-[now=t]:font-bold data-[now=t]:text-text1"
      >
        プレイリスト
      </Link>
      <Link
        to="/settings"
        data-now={location.pathname == "/settings" ? "t" : "f"}
        className="inline-block text-2xl text-text2 ml-16 data-[now=t]:font-bold data-[now=t]:text-text1"
      >
        設定
      </Link>
    </div>
  );
}
