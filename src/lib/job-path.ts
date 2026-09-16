/**
 * The canonical URL of a job detail page: its human-readable slug when the
 * backend has one, otherwise its id (which the page permanently redirects).
 */
export function jobPath(job: { _id: string; slug?: string | null }): string {
  return `/jobs/${job.slug || job._id}`;
}

/** Shape of a slug segment: lowercase alphanumerics joined by single hyphens. */
export const JOB_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True when `value` could be a job slug (route guards use it beside `isObjectId`). */
export function isJobSlug(value: string | null | undefined): boolean {
  return typeof value === 'string' && JOB_SLUG_RE.test(value);
}
