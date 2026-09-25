"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, Users } from "lucide-react";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { TalentRow } from "@/components/company/explore/talent-row";
import { TalentSearch } from "@/components/company/explore/talent-search";
import { TopRatedTalents } from "@/components/company/explore/top-rated-talents";
import { PageContainer } from "@/components/layout/page-container";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCandidateResults,
  useCandidates,
  useTopRatedCandidates,
} from "@/hooks/use-candidates";
import { useMe } from "@/hooks/use-me";
import { compareTopRated } from "@/lib/rating";
import type { User, UsersResponse } from "@/types/api";
import type { Candidate } from "@/types/candidates";

/**
 * Explore for companies: search over the individual directory, the top-rated
 * shelf and the rest of the talent list.
 *
 * The KYC gate here matches the mobile screen rather than the individual web
 * Explore: the content stays readable, the cards are dimmed and any click
 * opens `KycRequiredDialog`.
 */
export function CompanyExplore({
  user: initialUser,
  query,
  initialCandidates,
}: {
  user: User;
  query?: string;
  /** Pre-fetched first page (scratch pages only). */
  initialCandidates?: UsersResponse;
}) {
  const { data } = useMe();
  const user = data ?? initialUser;
  const verified = user.kycStatus === "verified";

  const router = useRouter();
  const kyc = useKycGate();

  const keyword = query?.trim() || undefined;
  const directory = useCandidates();
  const results = useCandidateResults(keyword);
  const topRated = useTopRatedCandidates(3);

  const list: Candidate[] = initialCandidates
    ? (initialCandidates.users ?? [])
    : directory.candidates;
  const top = topRated.data?.users ?? [];
  const topIds = new Set(top.map((candidate) => candidate._id));
  const rest = [...list.filter((candidate) => !topIds.has(candidate._id))].sort(compareTopRated);

  /** Returns `false` when the gate swallowed the click. */
  function guard(): boolean {
    return kyc.requireVerified();
  }

  function handleMessage(candidate: Candidate) {
    kyc.requireVerified(() =>
      router.push(`/dashboard/messages/${candidate._id}`),
    );
  }

  const loading = initialCandidates ? false : directory.isLoading;

  return (
    <PageContainer className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">Explore</h1>

      {!verified ? (
        <p className="rounded-2xl border border-brand-100 bg-brand-50 p-3 text-sm font-medium text-brand-900">
          Please complete KYC for full exploration.
        </p>
      ) : null}

      <TalentSearch query={keyword} onSuggestionPick={() => guard()} />

      {keyword ? (
        /* ---- search results ------------------------------------------- */
        <section>
          <h2 className="mb-3 text-lg font-bold text-brand-900">
            Search results for: {keyword}
          </h2>
          {results.isLoading ? (
            <CardListSkeleton rows={3} />
          ) : results.data?.users?.length ? (
            <ul className="flex flex-col gap-3">
              {results.data.users.map((candidate) => (
                <li key={candidate._id}>
                  <TalentRow
                    candidate={candidate}
                    dimmed={!verified}
                    onOpen={() => guard()}
                    onMessage={handleMessage}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Search}
              title="No candidates found"
              description={`No candidates found matching "${keyword}"`}
              action={
                <Button asChild variant="outline" size="lg" className="h-11">
                  <Link href="/dashboard/explore">Clear search</Link>
                </Button>
              }
            />
          )}
        </section>
      ) : loading ? (
        <CardListSkeleton rows={4} />
      ) : (
        <>
          {topRated.isLoading && !topRated.data ? (
            <TopRatedTalentsSkeleton />
          ) : top.length ? (
            <TopRatedTalents candidates={top} dimmed={!verified} onOpen={() => guard()} />
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-bold text-brand-900">All talents</h2>
            {rest.length ? (
              <ul className="flex flex-col gap-3">
                {rest.map((candidate) => (
                  <li key={candidate._id}>
                    <TalentRow
                      candidate={candidate}
                      dimmed={!verified}
                      onOpen={() => guard()}
                    />
                  </li>
                ))}
              </ul>
            ) : top.length ? null : (
              <EmptyState
                icon={Users}
                title="No talents found"
                description="There are currently no talents to display."
              />
            )}
          </section>

          {!initialCandidates && directory.hasNextPage ? (
            <Button
              variant="outline"
              size="lg"
              className="h-11 self-center"
              disabled={directory.isFetchingNextPage}
              onClick={() => void directory.fetchNextPage()}
            >
              {directory.isFetchingNextPage ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : null}
              Load more
            </Button>
          ) : null}
        </>
      )}

      {kyc.fallback}
    </PageContainer>
  );
}

/** Placeholder strip shown while the top-rated talents fetch is in flight. */
function TopRatedTalentsSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex h-48 w-56 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-white p-4"
        >
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
