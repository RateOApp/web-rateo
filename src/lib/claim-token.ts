/**
 * Claim-link token helpers, shared by `/claim/[token]` and its metadata.
 *
 * Tokens are opaque backend-minted strings (see `importedJobsController`),
 * not something we validate the shape of beyond "plausible" - anything else
 * is resolved locally as not-found rather than sent to the backend.
 */

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

/** Trims and checks the shape. Returns `''` for anything implausible. */
export function sanitiseClaimToken(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return TOKEN_PATTERN.test(trimmed) ? trimmed : '';
}
