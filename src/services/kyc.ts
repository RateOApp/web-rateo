import { api } from '@/lib/api/client';
import type {
  DojahInitResponse,
  DojahStatusResponse,
  KycSubmitResponse,
  ManualKycPayload,
} from '@/types/profile';

/**
 * KYC for individuals.
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
};

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
