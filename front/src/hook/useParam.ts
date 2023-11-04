import { useLoaderData } from "react-router-dom";

export function useParam(): Record<string, string> {
  const l = useLoaderData() ?? {};
  return l as Record<string, string>;
}
