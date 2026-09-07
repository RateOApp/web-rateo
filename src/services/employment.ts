import { api } from '@/lib/api/client';
import type { EndEmploymentPayload, EndEmploymentResponse } from '@/types/profile';

/**
 * Ending an employment from the employee's side.
 *
 * `notice` keeps the job current until the chosen last working day (7-90 days
 * ahead, validated again server-side in `utils/employmentEnd.js`) and can be
 * withdrawn; `immediate` ends it today and is permanent. Both are recorded on
 * the profile as public reputation data - only the reason and note stay
 * private to the two parties.
 */
export const employmentService = {
  end(payload: EndEmploymentPayload): Promise<EndEmploymentResponse> {
    return api
      .post<EndEmploymentResponse>('/users/employment/end', payload)
      .then((r) => r.data);
  },

  /** Only the party who gave the notice may withdraw it. 404 when none is pending. */
  withdrawNotice(): Promise<{ message?: string }> {
    return api
      .post<{ message?: string }>('/users/employment/notice/withdraw')
      .then((r) => r.data);
  },
};

/** Reasons an employee may pick. Mirrors `EMPLOYEE_END_REASONS` on the server. */
export const EMPLOYEE_END_REASONS = [
  'Relocation',
  'Got another offer',
  'Scholarship/further studies',
  'Personal/family reasons',
  'Health reasons',
  'Career change',
  'Others',
] as const;

export const MIN_NOTICE_DAYS = 7;
export const MAX_NOTICE_DAYS = 90;

/** Consequence copy shown behind the chooser's info toggles. */
export const NOTICE_INFO_TEXT =
  "The professional way to end a contract. Employment continues until the last working day, and the other party is notified today. This is recorded on your profile as 'Gave notice'.";

export const IMMEDIATE_INFO_TEXT =
  'Ends the contract today and cannot be undone. This is permanently recorded on your profile as an immediate ending and affects how others see the way you end contracts.';
