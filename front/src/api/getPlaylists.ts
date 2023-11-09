import { playlist } from "../type/playlist";

import { client } from "./apiClient";

type getPlaylistsResponse = playlist[];

export async function getPlaylists(
  client: client
): Promise<getPlaylistsResponse> {
  const res = await client("/api/playlists");
  return res.json();
}
