import { createContext, useContext } from "react";
import { track } from "../type/track";

export const TracksContext = createContext<track[]>([]);

export function useTracks(): track[] {
  return useContext(TracksContext);
}
