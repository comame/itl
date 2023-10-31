export type client = (endpoint: string) => Promise<Response>;

export function getClient(): client {
  const cl = (endpoint: string) => {
    const url = getEndpointURL(endpoint);
    return fetch(url, {
      credentials: "include",
    });
  };

  return cl;
}

function getEndpointURL(endpoint: string): string {
  // @ts-expect-error import.meta で怒られるが気にしない
  const isDev = import.meta.env.DEV;

  let host = new URL(location.href).origin;
  if (isDev) {
    host = "http://localhost:8080";
  }

  return host + endpoint;
}
