import { createContext, useContext } from "react";
import { track } from "../type/track";
import { playlist } from "../type/playlist";

export const TracksContext = createContext<track[]>([]);

export function useTracks(): track[] {
  return useContext(TracksContext);
}

export const PlaylistsContext = createContext<playlist[]>([]);

export function usePlaylists(): playlist[] {
  return useContext(PlaylistsContext);
}
