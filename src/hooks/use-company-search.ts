'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { companiesService } from '@/services/companies';
import type { User } from '@/types/api';

/** Minimum characters before the directory is queried at all. */
const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Search-as-you-type over the company directory (`GET /users?role=company`).
 *
 * The keyword is debounced internally, and TanStack Query keys on the debounced
 * value - which also fixes the mobile app's out-of-order-response bug for free,
 * since a stale request can never write into a newer key's cache entry.
 *
 * `isFetching` deliberately covers the debounce window too, so the spinner
 * appears on the first keystroke rather than 250 ms later.
 */
export function useCompanySearch(keyword: string): {
  companies: User[];
  isFetching: boolean;
} {
  const trimmed = keyword.trim();
  const debounced = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = debounced.length >= MIN_CHARS;

  const query = useQuery({
    queryKey: ['companySearch', debounced] as const,
    queryFn: () => companiesService.list({ keyword: debounced, pageNumber: 1 }),
    enabled,
    staleTime: 60_000,
  });

  const settling = trimmed.length >= MIN_CHARS && trimmed !== debounced;

  return {
    companies: enabled ? (query.data?.users ?? []) : [],
    isFetching: settling || (enabled && query.isFetching),
  };
}
