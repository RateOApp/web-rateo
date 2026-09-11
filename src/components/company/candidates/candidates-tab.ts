/**
 * Plain module (no 'use client') so the server page can parse `?tab=` and the
 * client hub component can share the same type.
 */
export type CandidatesTab = "applications" | "saved";

export function parseCandidatesTab(value: string | undefined): CandidatesTab {
  return value === "saved" ? "saved" : "applications";
}
