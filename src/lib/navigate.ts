/**
 * Full-document navigation, on purpose.
 *
 * After login / verification the session cookie has just changed, and only a
 * real page load re-runs the server components (and drops every cached RSC
 * payload) with the new cookie. `router.push()` would reuse the client cache
 * and render the signed-out tree.
 */
export function hardNavigate(path: string): void {
  window.location.assign(path);
}
