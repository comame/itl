import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";

import "@charcoal-ui/icons";
import "./index.css";

import Album from "./album.page";
import Albums from "./albums.page";
import { getClient, getPlaylists, getTracks } from "./api";
import { ErrorBoundary, RouterErrorBoundary } from "./component/error_boundary";
import { GlobalNavigation } from "./component/global_navigation";
import { PlaybackControl } from "./component/playback_control";
import { useOffline } from "./hook/useOffline";
import { PlaylistsContext, TracksContext } from "./hook/useTracks";
import Playlist from "./playlist.page";
import Playlists from "./playlists.page";
import Settings from "./settings.page";
import { playlist } from "./type/playlist";
import { track } from "./type/track";

declare global {
  /* eslint @typescript-eslint/no-namespace: 0 */
  export namespace JSX {
    interface IntrinsicElements {
      "pixiv-icon": {
        name: string;
        scale: 1 | 2 | 3 | "1" | "2" | "3";
        "unsafe-non-guideline-scale"?: number | string;
      };
    }
  }
}

function RouteRoot() {
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

function Page() {
  const router = createHashRouter([
    {
      path: "",
      element: <RouteRoot />,
      errorElement: <RouterErrorBoundary />,
      children: [
        {
          path: "",
          element: <Albums />,
        },
        {
          path: "genre/:genre",
          element: <Albums />,
          loader: mapParamToLoader,
        },
        {
          path: "playlists",
          element: <Playlists />,
        },
        {
          path: "playlist/:id",
          element: <Playlist />,
          loader: mapParamToLoader,
        },
        {
          path: "album/:id",
          element: <Album />,
          loader: mapParamToLoader,
        },
        {
          path: "settings",
          element: <Settings />,
        },
      ],
    },
  ]);

  const [tracks, setTracks] = useState<track[]>([]);
  const [playlists, setPlaylists] = useState<playlist[]>([]);

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchTracks = async () => {
    const res = await getTracks(getClient());
    setTracks(res);
  };

  const fetchPlaylists = async () => {
    const res = await getPlaylists(getClient());
    setPlaylists(res);
  };

  const { cachedTrackIDs } = useOffline();

  // オフライン時、キャッシュ済みのトラックのみを表示させる
  useEffect(() => {
    const l = () => {
      if (navigator.onLine) {
        fetchTracks();
        fetchPlaylists();
        return;
      }
      setTracks(tracks.filter((t) => cachedTrackIDs.includes(t.PersistentID)));

      const ids = cachedTrackIDs
        .map((p) => tracks.find((t) => t.PersistentID === p))
        .filter((t) => typeof t !== "undefined")
        .map((t) => t!.ID);

      setPlaylists(
        playlists.filter(
          (p) => p.ItemTrackIDs?.some((tid) => ids.includes(tid)) ?? false
        )
      );
    };
    window.addEventListener("online", l);
    window.addEventListener("offline", l);
    return () => {
      window.removeEventListener("online", l);
      window.removeEventListener("offline", l);
    };
  }, [cachedTrackIDs, playlists, tracks]);

  return (
    <React.StrictMode>
      <React.Suspense fallback={<p>Loading...</p>}>
        <TracksContext.Provider value={tracks}>
          <PlaylistsContext.Provider value={playlists}>
            <RouterProvider router={router} />
          </PlaylistsContext.Provider>
        </TracksContext.Provider>
      </React.Suspense>
    </React.StrictMode>
  );
}

function mapParamToLoader({ params }: any): Record<string, string> {
  return params;
}

createRoot(document.getElementById("app")!).render(
  <ErrorBoundary>
    <Page />
  </ErrorBoundary>
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });
}
