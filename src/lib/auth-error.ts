import { ApiError, getApiErrorMessage } from '@/lib/api/errors';

/** The backend limits login to 5 attempts per IP per 15 minutes. */
export const TOO_MANY_ATTEMPTS_MESSAGE =
  'Too many attempts. Please wait 15 minutes and try again.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** HTTP status behind an axios error or an `ApiError`, when there is one. */
export function errorStatus(err: unknown): number | undefined {
  if (err instanceof ApiError) return err.status;
  if (isRecord(err) && isRecord(err.response) && typeof err.response.status === 'number') {
    return err.response.status;
  }
  return undefined;
}

/**
 * Message for an auth form. Same as `getApiErrorMessage`, except the rate
 * limiter answers with an unhelpful body, so 429 gets its own copy.
 */
export function authErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (errorStatus(err) === 429) return TOO_MANY_ATTEMPTS_MESSAGE;
  return getApiErrorMessage(err, fallback);
}
