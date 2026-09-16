/**
 * Where the mobile app lives. Verbatim from the Expo app's `SettingsScreen`
 * share sheet, so every surface points at the same two listings.
 */
/**
 * Numeric App Store id. Also the `app-id` of the iOS Smart App Banner every
 * shareable page renders through `metadata.itunes`.
 */
export const APP_STORE_ID = '6745558274';
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
/**
 * Android application id. Also the `package=` of the `intent://` url the
 * "Open in app" button uses (see `open-in-app-button.tsx`).
 */
export const ANDROID_PACKAGE = 'com.rateo.mobile';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
