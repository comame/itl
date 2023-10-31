import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { useJSONAPI } from "./hook/useAPI";
import { getPlaylists, getTracks } from "./api";

import Index from "./index.page";
import Albums from "./albums.page";
import Playlists from "./playlists.page";
import Playlist from "./playlist.page";
import Album from "./album.page";
import { TracksContext } from "./hook/useTracks";

import "./index.css";

function Page() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Index />,
      children: [
        {
          path: "/",
          element: <Albums />,
        },
        {
          path: "playlists",
          element: <Playlists />,
        },
        {
          path: "/playlist/:id",
          element: <Playlist />,
          loader: mapParamToLoader,
        },
        {
          path: "/album/:id",
          element: <Album />,
          loader: mapParamToLoader,
        },
      ],
    },
  ]);

  const [tracks, errTracks] = useJSONAPI(getTracks);
  const [playlists, errPlaylists] = useJSONAPI(getPlaylists);

  if (errTracks || errPlaylists) {
    return <div>Failed to load library</div>;
  }

  return (
    <React.StrictMode>
      <React.Suspense>
        <TracksContext.Provider value={tracks}>
          <RouterProvider router={router} />
        </TracksContext.Provider>
      </React.Suspense>
    </React.StrictMode>
  );
}

function mapParamToLoader({ params }: any): Record<string, string> {
  return params;
}

createRoot(document.getElementById("app")!).render(<Page />);
