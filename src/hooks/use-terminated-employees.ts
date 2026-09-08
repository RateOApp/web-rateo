'use client';

import { useQuery } from '@tanstack/react-query';

import { companyEmployeesService } from '@/services/company-employees';
import type { TerminatedEmployee } from '@/types/company';

/**
 * Cache key for `GET /users/company/employees/terminated`. Ending a contract,
 * recovering someone and verifying a claim all move rows between this list and
 * `['companyEmployees']`, so the two are always invalidated together.
 */
export const TERMINATED_EMPLOYEES_KEY = ['terminatedEmployees'] as const;

/**
 * Everyone this company ever stopped employing, newest first.
 *
 * `staleTime` is short because rows expire on their own: `recoverable` flips to
 * `false` three days after the ending, and a stale cache would keep offering a
 * Recover button the server has already stopped honouring.
 */
export function useTerminatedEmployees(enabled = true): {
  terminated: TerminatedEmployee[];
  isLoading: boolean;
  isError: boolean;
} {
  const query = useQuery({
    queryKey: TERMINATED_EMPLOYEES_KEY,
    queryFn: () => companyEmployeesService.terminated(),
    enabled,
    staleTime: 30_000,
  });

  return {
    terminated: query.data?.terminated ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
