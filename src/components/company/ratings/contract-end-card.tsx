'use client';

import { useQuery } from '@tanstack/react-query';

import { contractEndSplit } from '@/lib/company-feedback';
import { usersService } from '@/services/users';

/**
 * "How you end contracts" — the company's own view of the split candidates see
 * on its public profile.
 *
 * Showing it to the company is the point: the ratio is published either way, so
 * a company that keeps ending contracts on the spot should find that out here
 * rather than from a candidate who quietly passed on them. Hidden below one
 * ending, where a single exit would read as an absolute.
 *
 * The counts come from `GET /users/:id`; `/auth/verify-token` does not carry
 * `contractEndSummary`, so `useMe()` cannot answer this.
 */
export function ContractEndCard({ companyId }: { companyId: string }) {
  const { data } = useQuery({
    queryKey: ['contractEndSummary', companyId] as const,
    queryFn: () => usersService.byId(companyId),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const split = contractEndSplit(data?.contractEndSummary);
  if (!split.show) return null;

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-base font-semibold text-brand-900">How you end contracts</h2>

      <div
        role="img"
        aria-label={split.label}
        className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <span className="bg-success" style={{ width: `${split.noticePct}%` }} />
        <span className="bg-danger" style={{ width: `${split.immediatePct}%` }} />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{split.label}</p>
    </section>
  );
}
