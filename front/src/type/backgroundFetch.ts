declare global {
  interface ServiceWorkerRegistration {
    backgroundFetch: BackgroundFetchManager;
  }

  interface BackgroundFetchManager {
    fetch(
      id: string,
      requests: RequestInfo | RequestInfo[]
    ): Promise<BackGroundFetchRegistration>;
    fetch(
      id: string,
      requests: RequestInfo | RequestInfo[],
      options: {
        title?: string;
        icons?: {
          src: string;
          sizes: string[];
          type: string;
          label: string;
        }[];
        downloadTotal?: number;
      }
    ): Promise<BackGroundFetchRegistration>;
  }

  interface BackGroundFetchRegistration {
    readonly id: string;
    abort(): Promise<true>;
    match(
      request: Request | string
    ): Promise<BackgroundFetchRecord | undefined>;
  }

  interface BackgroundFetchRecord {
    readonly request: Request;
    readonly responseReady: Promise<Response>;
  }
}
