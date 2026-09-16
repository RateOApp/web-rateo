"use client";

import { useSyncExternalStore } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ANDROID_PACKAGE, PLAY_STORE_URL } from "@/lib/constants/stores";

/**
 * The app's Universal/App Link host. Hard-coded rather than read from the
 * current origin: `assetlinks.json` only verifies `app.rateo.ng`, so a link
 * built on localhost or a preview deployment would never resolve to the app.
 */
const APP_LINK_HOST = "app.rateo.ng";

/* --- the user agent as an external store ----------------------------------
   The button must not exist in the server HTML (there is no user agent to read
   there, and a wrong guess would flash). `useSyncExternalStore` renders `false`
   on the server and the real answer on the client without a setState inside an
   effect, which this project's lint rules reject - same pattern as
   `notification-settings.tsx`. The value never changes after load, so
   `subscribe` has nothing to listen to. -------------------------------------- */

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  return /android/i.test(navigator.userAgent);
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Android-only "Open in app" escape hatch.
 *
 * Verified App Links already hand `app.rateo.ng/jobs/*` straight to the app
 * when a link is TAPPED, but a page reached any other way (typed, pasted, a
 * webview, a browser where the visitor chose "always open in Chrome") stays on
 * the web. An `intent://` url re-offers the app explicitly, and falls back to
 * the Play Store listing when it isn't installed.
 *
 * iOS needs nothing here - it gets the Smart App Banner from `metadata.itunes`.
 */
export function OpenInAppButton({ path, className }: { path: string; className?: string }) {
  const isAndroid = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isAndroid) return null;

  function handleClick() {
    const fallback = encodeURIComponent(PLAY_STORE_URL);
    window.location.href = `intent://${APP_LINK_HOST}${path}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
  }

  return (
    <Button type="button" variant="outline" size="lg" className={className} onClick={handleClick}>
      <Smartphone aria-hidden="true" />
      Open in app
    </Button>
  );
}
