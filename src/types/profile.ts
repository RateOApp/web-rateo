/**
 * Types for the individual profile area (Phase 4B): work history, resume,
 * KYC, email/phone change and job preferences.
 *
 * Source of truth: `server-rateo/src/controllers/userController.js`
 * (`getUserWorkHistory`, `submitKYC`, the email/phone change handlers),
 * `src/utils/employmentEnd.js` and `src/routes/dojahKycRoutes.js`.
 *
 * `src/types/api.ts` stays the mirror of `docs/API_CONTRACT.md`; anything the
 * profile pages need on top of it lives here.
 */

import type { JobPreferences } from '@/types/api';

/* -------------------------------------------------------------------------- */
/* Work history                                                               */
/* -------------------------------------------------------------------------- */

/** Who ended an employment. Public reputation data. */
export type EndedBy = 'employee' | 'company';

/** How an employment ended. `notice` keeps it current until the last day. */
export type EndMethod = 'notice' | 'immediate';

/**
 * One row of `GET /users/:userId/work-history`.
 *
 * The controller projects `_id` as `id`, resolves the populated `companyId`
 * down to its id plus a `companyLogo`, and only includes `noticeEffectiveDate`
 * / `noticeGivenAt` while a notice is pending (`current && endMethod ===
 * 'notice'`). `endReason` / `endReasonCategory` are owner-only.
 */
export type WorkHistoryItem = {
  id?: string;
  title?: string;
  company?: string;
  companyId?: string;
  companyLogo?: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  description?: string;
  isVerified?: boolean;
  endedBy?: EndedBy | null;
  endMethod?: EndMethod | null;
  noticeDays?: number | null;
  noticeEffectiveDate?: string;
  noticeGivenAt?: string;
  /** Owner-only (the server omits these for other viewers). */
  endReason?: string;
  endReasonCategory?: string;
};

/** `POST /users/employment/end` body. */
export type EndEmploymentPayload = {
  mode: EndMethod;
  reason: string;
  note?: string;
  /** ISO string. Required for `notice`, ignored for `immediate`. */
  effectiveDate?: string;
};

/** `POST /users/employment/end` 200 body (shape depends on the mode). */
export type EndEmploymentResponse = {
  message?: string;
  noticeEffectiveDate?: string;
  noticeDays?: number;
  endDate?: string;
};

/* -------------------------------------------------------------------------- */
/* KYC                                                                        */
/* -------------------------------------------------------------------------- */

/** `POST /users/kyc` body for an individual (manual / team review). */
export type ManualKycPayload = {
  nin: string;
  selfieUrl: string;
};

/** `POST /users/kyc` 200 body. */
export type KycSubmitResponse = {
  message?: string;
  kycStatus?: string;
  kyc?: {
    status?: string;
    adminComment?: string | null;
    nin?: string | null;
    ninSlip?: string | null;
  };
};

/**
 * `POST /users/kyc/dojah/init` 200 body. Client-safe by design: the secret key
 * never leaves the server, and `referenceId` is what the widget echoes back in
 * `metadata[user_id]`.
 */
export type DojahInitResponse = {
  appId: string | null;
  publicKey: string | null;
  widgetId: string | null;
  referenceId: string;
  userData: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  metadata: { user_id: string };
};

/** `POST /users/kyc/dojah/confirm` and `/cancel`. */
export type DojahStatusResponse = {
  status?: string;
  pending?: boolean;
  kyc?: { status?: string };
};

/* -------------------------------------------------------------------------- */
/* Email / phone change                                                       */
/* -------------------------------------------------------------------------- */

/** Every step of the self-service OTP wizard answers `{ message }`. */
export type EmailChangeResponse = {
  message?: string;
  /** Only the final `verify-new` step returns the switched address. */
  email?: string;
};

/** `PATCH /users/email` -> `{ email }`, `PATCH /users/phone` -> `{ phone }`. */
export type ContactUpdateResponse = {
  message?: string;
  email?: string;
  phone?: string;
};

/**
 * `PATCH /users/email/request` and `/users/phone/request`. The backend rejects
 * the request unless BOTH the 11-digit NIN and an already-hosted selfie URL
 * are present.
 */
export type EditRequestPayload = {
  nin: string;
  selfieUrl: string;
};

/** What the request endpoints answer with. */
export type EditRequestResponse = {
  message?: string;
  emailEditRequest?: boolean;
  isEmailEditable?: boolean;
  phoneEditRequest?: boolean;
  isPhoneEditable?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Resume / uploads                                                           */
/* -------------------------------------------------------------------------- */

/** `GET/POST /users/:userId/resume`. A 404 means "no resume", not an error. */
export type ResumeResponse = {
  message?: string;
  resume: string | null;
};

/** `POST /upload`, multipart field `file` -> Cloudinary URL. */
export type UploadResponse = {
  url: string;
  public_id?: string;
};

/* -------------------------------------------------------------------------- */
/* Job preferences                                                            */
/* -------------------------------------------------------------------------- */

/**
 * What the preferences wizard writes to `PUT /users/profile`. `category` is the
 * legacy single value the server still folds in, kept in sync with
 * `categories[0]` exactly as the mobile app does.
 */
export type JobPreferencesPayload = Required<
  Pick<JobPreferences, 'categories' | 'jobTitle' | 'location' | 'minSalary' | 'maxSalary' | 'minRating'>
> & {
  category: string;
};

/** `POST /users/request-company` 200 body. */
export type RequestCompanyResponse = {
  message?: string;
};
