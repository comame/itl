import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Index from "./index.page";
import Albums from "./albums.page";
import Playlists from "./playlists.page";
import Playlist from "./playlist.page";
import Album from "./album.page";

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
      ],
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
  ]);

  return (
    <React.StrictMode>
      <React.Suspense>
        <RouterProvider router={router} />
      </React.Suspense>
    </React.StrictMode>
  );
}

function mapParamToLoader({ params }: any): Record<string, string> {
  return params;
}

createRoot(document.getElementById("app")!).render(<Page />);
