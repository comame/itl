import { useParam } from "./hook/useParam";

export default function Album() {
  const p = useParam();
  return <div>Album: {p["id"]}</div>;
}
