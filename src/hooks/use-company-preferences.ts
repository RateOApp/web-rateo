'use client';

import { useQuery } from '@tanstack/react-query';

import { candidatesService } from '@/services/candidates';

/** Cache key for `GET /users/company/preferences`. */
export const COMPANY_PREFERENCES_KEY = ['companyPreferences'] as const;

/** The company's candidate preferences (location, minimum rating, roles). */
export function useCompanyPreferences(enabled = true) {
  return useQuery({
    queryKey: COMPANY_PREFERENCES_KEY,
    queryFn: () => candidatesService.preferences(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
