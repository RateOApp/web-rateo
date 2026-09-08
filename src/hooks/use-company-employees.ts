'use client';

import { useQuery } from '@tanstack/react-query';

import { candidatesService } from '@/services/candidates';
import type { CompanyEmployee, EmployeeClaimRequest } from '@/types/candidates';

/**
 * Cache key for `GET /users/company/employees`. Anything that can change an
 * employment (accepting an applicant, verifying a claim, ending a contract,
 * submitting a rating) must invalidate it.
 */
export const COMPANY_EMPLOYEES_KEY = ['companyEmployees'] as const;

/**
 * Confirmed employees plus the pending "I work here" claims, in one request.
 * Always returns arrays so callers never have to guard the shape.
 */
export function useCompanyEmployees(enabled = true): {
  employees: CompanyEmployee[];
  requests: EmployeeClaimRequest[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const query = useQuery({
    queryKey: COMPANY_EMPLOYEES_KEY,
    queryFn: () => candidatesService.employees(),
    enabled,
    staleTime: 60_000,
  });

  return {
    employees: query.data?.employees ?? [],
    requests: query.data?.requests ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
