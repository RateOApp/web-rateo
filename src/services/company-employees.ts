import { api } from '@/lib/api/client';
import type {
  CompanyEmployeesResponse,
  CompanyEndPayload,
  CompanyEndResponse,
  TerminatedEmployeesResponse,
  VerifyEmployeeAction,
} from '@/types/company';

/**
 * The company's roster.
 *
 * Two very different ways to remove someone, both live here on purpose:
 * - `remove` (`DELETE /users/company/employees/:id`) is the real termination -
 *   it ends the employment today, records `endedBy: 'company'` /
 *   `endMethod: 'immediate'`, and opens a 3-day recovery window.
 * - `verify(id, 'reject')` only declines a *pending join request*; it never
 *   touches a confirmed employment. The mobile ratings screen used it as a
 *   terminate shortcut, which silently no-ops on a real employee - do not.
 */
export const companyEmployeesService = {
  /** Confirmed employees plus unverified join requests, in one call. */
  list(): Promise<CompanyEmployeesResponse> {
    return api
      .get<CompanyEmployeesResponse>('/users/company/employees')
      .then((r) => ({
        employees: r.data?.employees ?? [],
        requests: r.data?.requests ?? [],
      }));
  },

  /** Every ending this company ever had, newest first (server caps at 100). */
  terminated(): Promise<TerminatedEmployeesResponse> {
    return api
      .get<TerminatedEmployeesResponse>('/users/company/employees/terminated')
      .then((r) => ({ terminated: r.data?.terminated ?? [] }));
  },

  /** Approve or reject a pending "I work here" claim. */
  verify(employeeId: string, action: VerifyEmployeeAction): Promise<{ message?: string }> {
    return api
      .post<{ message?: string }>(
        `/users/company/employees/${encodeURIComponent(employeeId)}/verify`,
        { action },
      )
      .then((r) => r.data);
  },

  /** Terminate today, with a 3-day recovery window. */
  remove(employeeId: string): Promise<{ message?: string }> {
    return api
      .delete<{ message?: string }>(
        `/users/company/employees/${encodeURIComponent(employeeId)}`,
      )
      .then((r) => r.data);
  },

  /**
   * Reinstate someone terminated inside the window. The server answers 410
   * when it has closed and 403 when the employee resigned (a resignation is
   * theirs to reverse, not the company's) - surface those verbatim.
   */
  recover(employeeId: string): Promise<{ message?: string }> {
    return api
      .post<{ message?: string }>(
        `/users/company/employees/${encodeURIComponent(employeeId)}/recover`,
      )
      .then((r) => r.data);
  },

  /** Give notice, or end today. Both are public reputation data. */
  end(employeeId: string, payload: CompanyEndPayload): Promise<CompanyEndResponse> {
    return api
      .post<CompanyEndResponse>(
        `/users/company/employees/${encodeURIComponent(employeeId)}/end`,
        payload,
      )
      .then((r) => r.data);
  },

  /** Only the party that gave the notice may withdraw it (404 when none). */
  withdrawNotice(employeeId: string): Promise<{ message?: string }> {
    return api
      .post<{ message?: string }>(
        `/users/company/employees/${encodeURIComponent(employeeId)}/notice/withdraw`,
      )
      .then((r) => r.data);
  },
};

/** Reasons a company may pick. Mirrors `COMPANY_END_REASONS` on the server. */
export const COMPANY_END_REASONS = [
  'Performance',
  'Misconduct',
  'Redundancy/restructuring',
  'End of project',
  'Business closure',
  'Others',
] as const;

/** Consequence copy behind the chooser's info toggles, company wording. */
export const COMPANY_NOTICE_INFO_TEXT =
  "The professional way to end a contract. Employment continues until the last working day, and the other party is notified today. This is recorded on your company profile as 'Gave notice'.";

export const COMPANY_IMMEDIATE_INFO_TEXT =
  'Ends the contract today and cannot be undone. This is permanently recorded on your company profile as an immediate ending and affects how others see the way you end contracts.';

/** Days a terminated employee stays recoverable (`RECOVERY_DAYS` server-side). */
export const RECOVERY_DAYS = 3;
