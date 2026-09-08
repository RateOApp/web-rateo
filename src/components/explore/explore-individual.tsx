"use client";

import Link from "next/link";
import { Briefcase, ChevronRight, Loader2, Search } from "lucide-react";
import { VerificationGate } from "@/components/dashboard/verification-card";
import { CompanySearch } from "@/components/explore/company-search";
import { TopRatedCompanies } from "@/components/explore/top-rated-companies";
import { ExploreCompanyCard } from "@/components/explore/explore-company-card";
import { PageContainer } from "@/components/layout/page-container";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/hooks/use-companies";
import { useMe } from "@/hooks/use-me";
import type { User } from "@/types/api";

/**
 * Explore for individuals: search, the jobs shortcut, the top-rated shelf and
 * the full company directory. Everything is dimmed behind a VerificationCard
 * until KYC is approved, mirroring the mobile gate.
 */
export function ExploreIndividual({
  user: initialUser,
  query,
}: {
  user: User;
  query?: string;
}) {
  const { data } = useMe();
  const user = data ?? initialUser;
  const verified = user.kycStatus === "verified";

  const keyword = query?.trim() || undefined;
  const companies = useCompanies(keyword ? { keyword } : {});
  const pages = companies.data?.pages ?? [];
  const list = pages.flatMap((page) => page.users ?? []);
  const firstPage = pages[0]?.users ?? [];

  return (
    <VerificationGate
      verified={verified}
      status={user.kycStatus}
      message="Verify your identity to explore and view companies."
    >
      <PageContainer className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">Explore</h1>

        <CompanySearch query={keyword} />

        <Link
          href="/dashboard/explore/jobs"
          className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-sm font-medium text-brand-900 transition-colors hover:border-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600"
          >
            <Briefcase className="size-4" />
          </span>
          <span className="min-w-0 flex-1">Looking for a job? Browse all jobs</span>
          <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </Link>

        {companies.isLoading ? (
          <CardListSkeleton rows={4} />
        ) : keyword ? (
          /* ---- search results ---------------------------------------- */
          list.length ? (
            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-900">
                {list.length} {list.length === 1 ? "result" : "results"} for &ldquo;{keyword}&rdquo;
              </h2>
              <ul className="flex flex-col gap-3">
                {list.map((company) => (
                  <li key={company._id}>
                    <ExploreCompanyCard company={company} verified={verified} />
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <EmptyState
              icon={Search}
              title="No companies found"
              description={`Nothing matches “${keyword}” right now. Try a different name.`}
              action={
                <Button asChild variant="outline" size="lg" className="h-11">
                  <Link href="/dashboard/explore">Clear search</Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            <TopRatedCompanies companies={firstPage} />

            <section>
              <h2 className="mb-3 text-lg font-bold text-brand-900">All companies</h2>
              {list.length ? (
                <ul className="flex flex-col gap-3">
                  {list.map((company) => (
                    <li key={company._id}>
                      <ExploreCompanyCard company={company} verified={verified} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Search}
                  title="No companies yet"
                  description="Companies you can rate and browse will show up here."
                />
              )}
            </section>
          </>
        )}

        {companies.hasNextPage ? (
          <Button
            variant="outline"
            size="lg"
            className="h-11 self-center"
            disabled={companies.isFetchingNextPage}
            onClick={() => void companies.fetchNextPage()}
          >
            {companies.isFetchingNextPage ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            Load more
          </Button>
        ) : null}
      </PageContainer>
    </VerificationGate>
  );
}
