/**
 * Error shape shared by the server fetcher and the axios client.
 *
 * The backend envelope is flat: `{ message }`, occasionally with
 * `errors: string[]` (password-policy violations) or a `code`
 * (e.g. `PARTICIPATION_OVERDUE`).
 */
export class ApiError extends Error {
  status: number;
  body: unknown;
  code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Pulls `{ message, errors[] }` out of a backend error body. */
export function messageFromBody(body: unknown): string | null {
  if (typeof body === 'string') return body.trim() || null;
  if (!isRecord(body)) return null;

  const parts: string[] = [];
  if (typeof body.message === 'string' && body.message.trim()) {
    parts.push(body.message.trim());
  } else if (typeof body.error === 'string' && body.error.trim()) {
    parts.push(body.error.trim());
  }
  if (Array.isArray(body.errors)) {
    for (const entry of body.errors) {
      if (typeof entry === 'string' && entry.trim()) parts.push(entry.trim());
      else if (isRecord(entry) && typeof entry.message === 'string' && entry.message.trim()) {
        parts.push(entry.message.trim());
      }
    }
  }
  return parts.length ? parts.join(' ') : null;
}

/**
 * Best-effort human-readable message for anything thrown by the data layer:
 * `ApiError`, an axios error, or a plain `Error`.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) {
    return messageFromBody(err.body) ?? err.message ?? fallback;
  }

  if (isRecord(err)) {
    // Axios: err.response.data holds the backend body.
    const response = err.response;
    if (isRecord(response)) {
      const fromBody = messageFromBody(response.data);
      if (fromBody) return fromBody;
    }
    // Axios network/timeout errors carry no response.
    if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (err.code === 'ERR_NETWORK') return 'Network error. Check your connection and try again.';
  }

  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === 'string' && err.trim()) return err.trim();
  return fallback;
}
