type MetaParams = Record<string, string | number>;

declare global {
  interface Window {
    fbq?: (
      command: "init" | "track" | "trackCustom",
      eventOrId: string,
      params?: MetaParams,
    ) => void;
  }
}

/** Fires a Meta standard event. SSR-safe, no-op without the pixel, never throws. */
export function trackMeta(event: string, params?: MetaParams): void {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    if (params) window.fbq("track", event, params);
    else window.fbq("track", event);
  } catch {
    // Analytics must never break the app.
  }
}

/** Fires a Meta custom event. SSR-safe, no-op without the pixel, never throws. */
export function trackMetaCustom(event: string, params?: MetaParams): void {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    if (params) window.fbq("trackCustom", event, params);
    else window.fbq("trackCustom", event);
  } catch {
    // Analytics must never break the app.
  }
}
