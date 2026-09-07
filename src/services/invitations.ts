import { api } from '@/lib/api/client';
import type { CompanyInvitationResponse } from '@/types/api';

/**
 * Company invitations. Used by the individual setup wizard when the typed
 * employer is not yet on Rate'O: the invite is what lets that company later
 * confirm the employment, so the rating relationship is not a dead name.
 *
 * `POST /invitations/company` is individual-only (403 otherwise) and answers
 * 200 + `companyExists` when the address already belongs to a registered
 * company - the caller should then link to `companyId` instead of inviting.
 */
export const invitationsService = {
  inviteCompany(email: string, companyName: string): Promise<CompanyInvitationResponse> {
    return api
      .post<CompanyInvitationResponse>('/invitations/company', {
        email: email.trim(),
        companyName: companyName.trim(),
      })
      .then((r) => r.data);
  },
};
