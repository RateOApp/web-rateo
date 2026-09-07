'use client';

import { useQuery } from '@tanstack/react-query';

import { faqsService } from '@/services/faqs';

/** Public FAQ list. Key `['faqs']` — content changes rarely. */
export function useFaqs() {
  return useQuery({
    queryKey: ['faqs'] as const,
    queryFn: () => faqsService.list(),
    staleTime: 10 * 60 * 1000,
  });
}
