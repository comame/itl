import { client } from "./apiClient";

import { playlist } from "../type/playlist";

type getPlaylistsResponse = playlist[];

export async function getPlaylists(
  client: client
): Promise<getPlaylistsResponse> {
  const res = await client("/api/playlists");
  return res.json();
}
