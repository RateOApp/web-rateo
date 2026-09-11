/**
 * Types for the signed-in dashboard that are not part of the public REST
 * contract mirrored in `@/types/api`. Kept in a separate file so the three
 * Phase-4 workstreams never have to touch `api.ts` at the same time.
 */

import type { Job, JobApplicantStatus, JobApplication } from '@/types/api';

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

/** `GET /jobs/user/applied` */
export type AppliedJobsResponse = { applications: JobApplication[] };

/** `GET /jobs/user/saved` - saved jobs are always native jobs. */
export type SavedJobsResponse = { savedJobs: Job[] };

/** Tone of the pill next to an application row. */
export type ApplicationTone = 'success' | 'muted' | 'warning';

const SUCCESS_STATUSES = ['accepted', 'approved', 'hired', 'received'];
/** Only settled applications may be cleared off the Applications tab. */
const REMOVABLE_STATUSES = ['accepted', 'approved', 'hired', 'rejected'];

export function applicationTone(status: JobApplicantStatus | undefined): ApplicationTone {
  const value = String(status ?? '').toLowerCase();
  if (SUCCESS_STATUSES.includes(value)) return 'success';
  if (value === 'rejected') return 'muted';
  return 'warning';
}

export function isApplicationRemovable(status: JobApplicantStatus | undefined): boolean {
  return REMOVABLE_STATUSES.includes(String(status ?? '').toLowerCase());
}

/** "pending" -> "Pending"; missing status -> "Received" (mirrors mobile). */
export function applicationLabel(status: JobApplicantStatus | undefined): string {
  const value = String(status ?? '').trim() || 'Received';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `GET /notifications`. The server model stores the body in `content`; older
 * rows (and the push payload) use `message`, so both are optional here.
 */
export type AppNotification = {
  _id: string;
  type?: string;
  content?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
  relatedId?: string | Record<string, unknown> | null;
  onModel?: string;
};

/** The list endpoint answers with a bare array on prod and `{ notifications }` elsewhere. */
export type NotificationsPayload = AppNotification[] | { notifications: AppNotification[] };

/** Where a notification takes the user when tapped (individual routes). */
export const NOTIFICATION_ROUTES: Record<string, string> = {
  kyc: '/dashboard/profile',
  message: '/dashboard/messages',
  rating: '/dashboard/ratings',
  account: '/dashboard/profile',
  application: '/dashboard/saved',
  job_match: '/dashboard',
  employment: '/dashboard/work-history',
  // Fallback only - `notifications-list` routes straight to the imported job
  // when the notification carries a `relatedId`.
  job_interest: '/dashboard/saved?tab=interested',
};

export const NOTIFICATION_FALLBACK_ROUTE = '/dashboard/profile';

export function notificationBody(notification: AppNotification): string {
  return notification.content?.trim() || notification.message?.trim() || 'Notification';
}
