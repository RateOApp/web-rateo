import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

import { isImportedJob, type AnyJob } from '@/types/api';

/* -------------------------------------------------------------------------- */
/* Money                                                                      */
/* -------------------------------------------------------------------------- */

/** `60000 -> "₦60,000"`. Returns `null` for anything that is not a number. */
export function formatNaira(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

/**
 * Native jobs carry `minSalary` / `maxSalary`. Mirrors the mobile app, which
 * falls back to "Negotiable" rather than hiding the row.
 */
export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  const from = formatNaira(min);
  if (!from) return 'Negotiable';
  const to = formatNaira(max);
  return to && max !== min ? `${from} – ${to}` : from;
}

/** `"full_time" -> "Full time"` (imported jobs use snake_case employment types). */
export function humanizeEmploymentType(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase(),
    )
    .join(' ');
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

/** Parses an ISO string (or Date) defensively; `null` when unusable. */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

/** `"2026-09-03T01:12:14Z" -> "3 Sep 2026"`. Deterministic (no locale drift). */
export function formatDate(value: string | Date | null | undefined): string | null {
  const date = toDate(value);
  return date ? format(date, 'd MMM yyyy') : null;
}

/** `"2 days ago"`. Returns `null` when the timestamp is missing or invalid. */
export function timeAgo(value: string | Date | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  return `${formatDistanceToNowStrict(date)} ago`;
}

/**
 * Deadlines expire at the end of the day, matching the mobile app
 * (`new Date().setHours(0,0,0,0) > deadline`).
 */
export function isDeadlinePast(value: string | Date | null | undefined): boolean {
  const date = toDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() > date.getTime();
}

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

/** The company behind a job, whichever shape the job came in as. */
export function jobCompanyName(job: AnyJob): string {
  const name = isImportedJob(job) ? job.companyName : job.company?.companyName;
  return name?.trim() || 'Unknown company';
}

/**
 * Imported listings carry a free-text `salary` string scraped from the source
 * board; native jobs carry numeric bounds.
 */
export function jobSalaryLabel(job: AnyJob): string | null {
  if (isImportedJob(job)) return job.salary?.trim() || null;
  return formatSalaryRange(job.minSalary, job.maxSalary);
}

/** `"Lagos · Full time · ₦60,000 – ₦80,000"`. */
export function jobMetaLine(job: AnyJob): string {
  const type = isImportedJob(job)
    ? humanizeEmploymentType(job.employmentType)
    : job.type?.trim() || null;

  return [job.location?.trim() || null, type, jobSalaryLabel(job)]
    .filter(Boolean)
    .join(' · ');
}

/** First `max` characters of a description, tidied for meta descriptions. */
export function excerpt(value: string | null | undefined, max = 160): string {
  const text = value?.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Mongo ObjectId guard — keeps junk ids from reaching the backend. */
export function isObjectId(value: string | null | undefined): boolean {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

/** `"592360" -> "ID 592 360"` (mirrors the mobile `formatPublicId`). */
export function formatPublicId(value: string | null | undefined): string | null {
  const digits = value?.trim();
  if (!digits) return null;
  return `ID ${digits.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
}
