/**
 * Plain module (no 'use client') so the server page can parse `?tab=` and the
 * client tabs component can share the same type. Calling a function exported
 * from a 'use client' file on the server is a runtime error in Next 16.
 */
export type SavedTab = "applications" | "saved" | "interested";

export function parseSavedTab(value: string | undefined): SavedTab {
  if (value === "saved") return "saved";
  if (value === "interested") return "interested";
  return "applications";
}
