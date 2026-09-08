import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { ATTESTATION_REQUIRED, ATTESTER_SELFIE_REQUIRED } from '@/types/company';
import type {
  AttestationPayload,
  AttestationResponse,
  BusinessKycPayload,
} from '@/types/company';
import type {
  DojahInitResponse,
  DojahStatusResponse,
  KycSubmitResponse,
  ManualKycPayload,
} from '@/types/profile';

/**
 * KYC for individuals and companies.
 *
 * Two paths, both ending server-side:
 * - manual (`submitManual`) flips `kycStatus` to `pending` and notifies admins;
 * - Dojah (`dojahInit`) mints a client-safe widget config. The browser NEVER
 *   talks to Dojah with a secret: `init` returns only a widget id and a
 *   per-attempt `referenceId`. The verified flip happens on Dojah's webhook,
 *   so `dojahConfirm` is a best-effort nudge, not the source of truth, and
 *   `dojahCancel` just releases an untouched session so an opened-then-closed
 *   widget cannot strand the badge at "pending".
 */
export const kycService = {
  /** `POST /users/kyc` with `{ nin, selfieUrl }` (selfie already uploaded). */
  submitManual(payload: ManualKycPayload): Promise<KycSubmitResponse> {
    return api.post<KycSubmitResponse>('/users/kyc', payload).then((r) => r.data);
  },

  dojahInit(flow: 'individual' | 'business' = 'individual'): Promise<DojahInitResponse> {
    return api
      .post<DojahInitResponse>('/users/kyc/dojah/init', { flow })
      .then((r) => r.data);
  },

  dojahConfirm(): Promise<DojahStatusResponse> {
    return api.post<DojahStatusResponse>('/users/kyc/dojah/confirm').then((r) => r.data);
  },

  dojahCancel(): Promise<DojahStatusResponse> {
    return api.post<DojahStatusResponse>('/users/kyc/dojah/cancel').then((r) => r.data);
  },

  /* ---- business (company) KYC ------------------------------------------ */

  /**
   * `POST /users/kyc/attestation` - who is verifying on the company's behalf.
   *
   * The backend blocks BOTH business paths (Dojah `init` and the manual submit)
   * with `400 ATTESTATION_REQUIRED` until this is stored, so it is a gate, not
   * a formality. It is rewritten on every fresh attempt, which is why the flow
   * may re-ask for it after a rejection.
   */
  submitAttestation(payload: AttestationPayload): Promise<AttestationResponse> {
    return api
      .post<AttestationResponse>('/users/kyc/attestation', payload)
      .then((r) => r.data);
  },

  /**
   * `POST /users/kyc` for a company (team review). Same endpoint as the
   * individual path - the controller branches on `user.role` and merges the
   * body into `kycDocuments`, so the field names here ARE the contract with the
   * admin review screen. Every document must already be a hosted URL.
   */
  submitBusinessManual(payload: BusinessKycPayload): Promise<KycSubmitResponse> {
    return api.post<KycSubmitResponse>('/users/kyc', payload).then((r) => r.data);
  },
};

/** Axios does not narrow its errors, so read the backend `code` defensively. */
function errorCode(error: unknown): string | null {
  if (error instanceof ApiError) return error.code ?? null;
  if (typeof error !== 'object' || error === null) return null;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (typeof data !== 'object' || data === null) return null;
  const code = (data as Record<string, unknown>).code;
  return typeof code === 'string' ? code : null;
}

/**
 * "The company has not accepted the authorization declaration yet."
 *
 * The user document may not carry `kycAttestation` at all (older accounts, and
 * the field is absent from some projections), so the flow starts optimistically
 * and treats this code as the authoritative answer.
 */
export function isAttestationRequired(error: unknown): boolean {
  return errorCode(error) === ATTESTATION_REQUIRED;
}

/** The submitted business KYC carried no live selfie of the verifier. */
export function isAttesterSelfieRequired(error: unknown): boolean {
  return errorCode(error) === ATTESTER_SELFIE_REQUIRED;
}

/**
 * The reviewer's note on a rejected submission.
 *
 * `GET /users/:id` normalises it onto `kyc.adminComment`, while
 * `GET /auth/verify-token` hands back the raw document, where it lives under
 * `kycDocuments.adminComment`. Neither field is on the `User` contract type, so
 * read both defensively rather than widening `types/api.ts`.
 */
export function kycAdminComment(user: unknown): string | null {
  if (typeof user !== 'object' || user === null) return null;
  const record = user as Record<string, unknown>;

  for (const key of ['kyc', 'kycDocuments']) {
    const section = record[key];
    if (typeof section !== 'object' || section === null) continue;
    const comment = (section as Record<string, unknown>).adminComment;
    if (typeof comment === 'string' && comment.trim()) return comment.trim();
  }
  return null;
}

/**
 * Hosted Dojah widget URL. The widget reads the reference back to us in
 * `metadata[user_id]`, which is how the webhook finds the user.
 *
 * TODO(dojah-sandbox): confirm the hosted base and the `metadata[user_id]` /
 * `user_data[...]` param names against the live widget (the mobile app carries
 * the same note).
 */
export function dojahWidgetUrl(config: DojahInitResponse): string | null {
  if (!config.widgetId) return null;
  const params = new URLSearchParams();
  params.set('widget_id', config.widgetId);
  params.set('metadata[user_id]', config.referenceId);
  if (config.userData?.first_name) params.set('user_data[first_name]', config.userData.first_name);
  if (config.userData?.last_name) params.set('user_data[last_name]', config.userData.last_name);
  if (config.userData?.email) params.set('user_data[email]', config.userData.email);
  return `https://identity.dojah.io?${params.toString()}`;
}
