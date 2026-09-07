'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { companiesService } from '@/services/companies';
import type { CompanyListParams } from '@/services/params';

/** Paginated company directory (`GET /users?role=company`). */
export function useCompanies(params: CompanyListParams = {}) {
  return useInfiniteQuery({
    queryKey: ['companies', params] as const,
    queryFn: ({ pageParam }) => companiesService.list({ ...params, pageNumber: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['company', id] as const,
    queryFn: () => companiesService.byId(id as string),
    enabled: Boolean(id),
  });
}

export function useCompanyReviews(id: string | undefined) {
  return useQuery({
    queryKey: ['companyRatings', id] as const,
    queryFn: () => companiesService.reviews(id as string),
    enabled: Boolean(id),
  });
}
