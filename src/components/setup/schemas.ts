import { z } from 'zod';

import { isIndustry } from '@/lib/constants/industries';
import { LOGO_MAX_BYTES, LOGO_MIME_TYPES } from '@/lib/constants/company';

/**
 * Per-step validation for both setup wizards. Messages are the spec's
 * (`docs/AUTH_FLOWS.md` -> "Setup wizards") and match the mobile alerts
 * word for word, so QA can diff the two platforms.
 */

export const ABOUT_MAX = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ----------------------------- individual ------------------------------- */

/** Step 1, only when the account arrived without a usable name. */
export const nameSchema = z.object({
  firstName: z.string().trim().min(1, 'Please enter your first and last name.'),
  lastName: z.string().trim().min(1, 'Please enter your first and last name.'),
});

/** Step 1. Free text - the suggestion list is a convenience, not a whitelist. */
export const jobTitleSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your job title to continue.');

/** Step 2. */
export const workLocationSchema = z
  .string()
  .trim()
  .min(1, 'Please choose where you would like to work.');

/** Step 3, when "I'm currently not employed" is unticked. */
export const employerSchema = z
  .string()
  .trim()
  .min(1, "Please select or enter your company, or tick \u201cI'm currently not employed\u201d.");

/** The invite dialog. Same regex the server applies. */
export const inviteEmailSchema = z
  .string()
  .trim()
  .min(1, 'Please enter a valid company email')
  .regex(EMAIL_RE, 'Please enter a valid company email');

/* ------------------------------- company -------------------------------- */

/** Step 0, only when the account arrived without a company name. */
export const companyNameSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your company name to continue.');

/**
 * Industry must be an exact entry: job-industry filtering keys off these
 * values, and the backend rejects anything else with a 400.
 */
export const industrySchema = z
  .string()
  .trim()
  .min(1, 'Please select your industry to continue.')
  .refine(isIndustry, 'Please pick your industry from the list.');

export const addressSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your company address to continue.');

export const aboutSchema = z
  .string()
  .trim()
  .min(1, 'Please write a brief about your business.')
  .max(ABOUT_MAX, `Please keep this under ${ABOUT_MAX} characters.`);

/** The logo file itself; `undefined` (no file) is handled by the wizard. */
export const logoFileSchema = z
  .file()
  .mime([...LOGO_MIME_TYPES], 'Please choose a PNG, JPG or WebP image.')
  .max(LOGO_MAX_BYTES, 'That image is too large. Please choose one under 5MB.');

/* -------------------------------- helper -------------------------------- */

/** First message out of a `safeParse` result, or `null` when it passed. */
export function firstIssue(result: z.ZodSafeParseResult<unknown>): string | null {
  return result.success ? null : (result.error.issues[0]?.message ?? 'Please check this field.');
}
