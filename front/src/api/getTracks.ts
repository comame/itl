import { track } from "../type/track";

import { client } from "./apiClient";

type getTracksResponse = track[];

export async function getTracks(client: client): Promise<getTracksResponse> {
  const res = await client("/api/tracks");
  return res.json();
}
