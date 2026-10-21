/**
 * Remembers which jobs a signed-out visitor tried to act on, so the intent
 * survives registration, email verification and KYC. Stored in
 * `localStorage` (not session) because the verify step can happen in another
 * tab after the user opens the emailed link on the same device.
 */

export type JobIntentType = 'job' | 'imported';

export type PendingJob = {
  jobId: string;
  jobType: JobIntentType;
  /** Where to send the user back to (the readable job URL). */
  href: string;
  title?: string;
  savedAt: number;
};

export const PENDING_JOBS_KEY = 'rateo.pendingJobs';
export const MAX_PENDING_JOBS = 10;

export function readPendingJobs(): PendingJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(PENDING_JOBS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is PendingJob =>
        Boolean(entry) &&
        typeof entry.jobId === 'string' &&
        (entry.jobType === 'job' || entry.jobType === 'imported'),
    );
  } catch {
    return [];
  }
}

/** Best effort, newest last. Re-adding a job moves it to the end; the oldest drop past the cap. */
export function addPendingJob(entry: Omit<PendingJob, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const rest = readPendingJobs().filter((job) => job.jobId !== entry.jobId);
    const next = [...rest, { ...entry, savedAt: Date.now() }].slice(-MAX_PENDING_JOBS);
    window.localStorage.setItem(PENDING_JOBS_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do - the visitor just loses the remembered job.
  }
}

export function clearPendingJobs(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_JOBS_KEY);
  } catch {
    // Ignored, same as above.
  }
}

/** The slice of each entry the backend accepts. */
export function toIntentPayload(
  entries: PendingJob[],
): { jobId: string; jobType: JobIntentType }[] {
  return entries.map(({ jobId, jobType }) => ({ jobId, jobType }));
}
