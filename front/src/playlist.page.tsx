import { useParam } from "./hook/useParam";

export default function Playlist() {
  const p = useParam();
  return <div>Playlist: {p["id"]}</div>;
}
