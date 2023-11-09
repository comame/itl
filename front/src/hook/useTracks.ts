import { createContext, useContext } from "react";

import { playlist } from "../type/playlist";
import { track } from "../type/track";

export const TracksContext = createContext<track[]>([]);

export function useTracks(): track[] {
  return useContext(TracksContext);
}

export const PlaylistsContext = createContext<playlist[]>([]);

export function usePlaylists(): playlist[] {
  return useContext(PlaylistsContext);
}
