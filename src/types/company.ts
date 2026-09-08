/**
 * Types for the company dashboard (Phase 5): employee management, the company
 * side of ending a contract, and business KYC.
 *
 * Source of truth: `server-rateo/src/controllers/userController.js`
 * (`getCompanyEmployees`, `getTerminatedEmployees`, `endEmploymentByCompany`,
 * `submitKYC`, `submitKycAttestation`) and `src/utils/employmentEnd.js`.
 *
 * `src/types/api.ts` stays the mirror of `docs/API_CONTRACT.md`; anything only
 * the company pages need lives here. `ContractEndSummary` already exists there
 * and is re-exported so a company screen has one import.
 */

import type { EndedBy, EndMethod } from '@/types/profile';

export type { ContractEndSummary } from '@/types/api';
export type { EndedBy, EndMethod } from '@/types/profile';

/* -------------------------------------------------------------------------- */
/* Employees                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `GET /users/company/employees` rows.
 *
 * The roster shape is declared once, in `@/types/candidates`, because the same
 * payload feeds the candidates/talent screens through `useCompanyEmployees()`.
 * Re-exported here (with the spec's name for a claim) so an employees or
 * ratings screen imports one module, and so a second, subtly different copy of
 * the projection can never drift from the hook that produces it.
 *
 * NOTE the projection: the id field is `id`, not `_id`, and `role` is the job
 * TITLE at this company rather than the account role.
 */
export type {
  CompanyEmployee,
  CompanyEmployeesResponse,
  EmployeeNotice,
  VerifyEmployeeAction,
} from '@/types/candidates';
export type { EmployeeClaimRequest as EmployeeRequest } from '@/types/candidates';

/**
 * One row of `GET /users/company/employees/terminated`. Every ending this
 * company ever had is listed; `recoverable` is the server's own verdict
 * (company-ended AND inside the 3-day window) and must not be recomputed from
 * `recoveryDeadline` alone - a resignation is never recoverable.
 */
export type TerminatedEmployee = {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  terminatedAt?: string;
  recoveryDeadline?: string;
  endedBy?: EndedBy;
  endReason?: string | null;
  endMethod?: EndMethod | null;
  noticeDays?: number | null;
  recoverable?: boolean;
};

export type TerminatedEmployeesResponse = { terminated: TerminatedEmployee[] };

/** `POST /users/company/employees/:id/end` body. */
export type CompanyEndPayload = {
  mode: EndMethod;
  reason: string;
  note?: string;
  /** ISO string. Required for `notice`, ignored for `immediate`. */
  effectiveDate?: string;
};

/** `POST /users/company/employees/:id/end` 200 body (shape follows the mode). */
export type CompanyEndResponse = {
  message?: string;
  noticeEffectiveDate?: string;
  noticeDays?: number;
  endDate?: string;
};

/* -------------------------------------------------------------------------- */
/* Business KYC                                                               */
/* -------------------------------------------------------------------------- */

/** The four declarations the backend's `VERIFIER_TYPES` accepts. */
export type VerifierType = 'owner' | 'hr' | 'representative' | 'other';

/**
 * `POST /users/kyc/attestation` - who is verifying on the company's behalf.
 * The backend refuses both business verification paths (Dojah init and the
 * manual submit) with `400 { code: 'ATTESTATION_REQUIRED' }` until this is
 * stored, so it is the first step of the flow rather than fine print.
 */
export type AttestationPayload = {
  verifierType: VerifierType;
  /** Required only when `verifierType === 'other'`. */
  verifierTypeOther?: string;
  role: string;
  accepted: true;
};

export type AttestationResponse = {
  ok?: boolean;
  kycAttestation?: {
    verifierType?: VerifierType;
    verifierTypeOther?: string;
    role?: string;
    accepted?: boolean;
    acceptedAt?: string;
    termsVersion?: string;
  };
};

/**
 * `POST /users/kyc` body for a company (team review).
 *
 * `city` carries the LGA - the wire field kept its old name when the mobile
 * screen switched from a free-text city to the LGA picker. The controller
 * merges the whole body into `kycDocuments`, so these keys are the contract
 * with the admin review UI, not with a schema.
 */
export type BusinessKycPayload = {
  address: string;
  state: string;
  city: string;
  proofOfAddress: string;
  cacNumber: string;
  cacCertificate: string;
  /** Live selfie of the person submitting; the server rejects without it. */
  attesterSelfieUrl: string;
};

/** Error codes the business KYC endpoints answer with. */
export const ATTESTATION_REQUIRED = 'ATTESTATION_REQUIRED';
export const ATTESTER_SELFIE_REQUIRED = 'ATTESTER_SELFIE_REQUIRED';

/**
 * `GET /auth/verify-token` returns the raw user document, which MAY carry the
 * stored attestation. It is not on the `User` contract type (older accounts and
 * `/users/:id` omit it), so read it defensively rather than widening `api.ts`.
 */
export function hasAcceptedAttestation(user: unknown): boolean {
  if (typeof user !== 'object' || user === null) return false;
  const attestation = (user as Record<string, unknown>).kycAttestation;
  if (typeof attestation !== 'object' || attestation === null) return false;
  return (attestation as Record<string, unknown>).accepted === true;
}

/**
 * `true` only when the user document actually carries a `kycAttestation` and it
 * has NOT been accepted.
 *
 * The distinction matters: an ABSENT field means "this projection does not
 * report it", not "the company never signed". So the flow proceeds
 * optimistically on absence and lets the server's `ATTESTATION_REQUIRED` be the
 * authority, and only pre-empts when the document says so itself.
 */
export function attestationKnownMissing(user: unknown): boolean {
  if (typeof user !== 'object' || user === null) return false;
  const attestation = (user as Record<string, unknown>).kycAttestation;
  if (typeof attestation !== 'object' || attestation === null) return false;
  return (attestation as Record<string, unknown>).accepted !== true;
}
