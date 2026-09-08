'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { candidatesService } from '@/services/candidates';
import type { User } from '@/types/api';

/** Shared key for the paged candidate directory. */
export const CANDIDATES_KEY = ['candidates'] as const;

/**
 * `GET /users?role=individual` page by page. The list is public, so this works
 * for an unverified company too - the KYC gate only blocks the actions.
 */
export function useCandidates() {
  const query = useInfiniteQuery({
    queryKey: CANDIDATES_KEY,
    queryFn: ({ pageParam }) => candidatesService.feed(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    staleTime: 60_000,
  });

  const candidates: User[] = query.data?.pages.flatMap((page) => page.users ?? []) ?? [];

  return { ...query, candidates };
}

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
 * Search-as-you-type over the candidate directory. The keyword is debounced
 * internally and TanStack Query keys on the debounced value, so a stale
 * response can never overwrite a newer one.
 */
export function useCandidateSearch(keyword: string): {
  candidates: User[];
  isFetching: boolean;
} {
  const trimmed = keyword.trim();
  const debounced = useDebouncedValue(trimmed, DEBOUNCE_MS);
  const enabled = debounced.length >= MIN_CHARS;

  const query = useQuery({
    queryKey: ['candidateSearch', debounced] as const,
    queryFn: () => candidatesService.search(debounced),
    enabled,
    staleTime: 60_000,
  });

  const settling = trimmed.length >= MIN_CHARS && trimmed !== debounced;

  return {
    candidates: enabled ? (query.data?.users ?? []) : [],
    isFetching: settling || (enabled && query.isFetching),
  };
}

/** The submitted search (`?q=`), rendered as a results list on Explore. */
export function useCandidateResults(keyword: string | undefined) {
  const trimmed = keyword?.trim() ?? '';
  return useQuery({
    queryKey: ['candidateSearch', trimmed] as const,
    queryFn: () => candidatesService.search(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 60_000,
  });
}
