"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Search } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { PageContainer } from "@/components/layout/page-container";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobCategories, useJobs } from "@/hooks/use-jobs";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/utils";
import type { User } from "@/types/api";

/** The user's industries, folding the legacy single `category` in. */
function preferredCategories(user: User): string[] {
  const saved = user.jobPreferences?.categories;
  if (Array.isArray(saved) && saved.length) return saved;
  const legacy = (user.jobPreferences as { category?: string } | undefined)?.category;
  return legacy ? [legacy] : [];
}

/**
 * `/dashboard/explore/jobs` - the signed-in twin of the public `/jobs` list.
 * Same data, but the user's own industries are hoisted to the front of the
 * chip row so their fields are one tap away.
 */
export function ExploreJobs({ user: initialUser }: { user: User }) {
  const { data } = useMe();
  const user = data ?? initialUser;

  const [term, setTerm] = useState("");
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(term.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  const jobs = useJobs({
    keyword: keyword || undefined,
    categories: industry ? [industry] : [],
  });
  const categories = useJobCategories();

  const industries = useMemo(() => {
    const list = categories.data?.categories ?? [];
    const preferred = new Set(preferredCategories(user));
    const mine = list.filter((entry) => entry.industry && preferred.has(entry.industry));
    const rest = list.filter((entry) => entry.industry && !preferred.has(entry.industry));
    return [...mine, ...rest];
  }, [categories.data, user]);

  const list = (jobs.data?.pages ?? []).flatMap((page) => page.jobs ?? []);

  return (
    <PageContainer className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">Jobs</h1>

      <div className="relative">
        <label htmlFor="explore-jobs-search" className="sr-only">
          Search jobs by title
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="explore-jobs-search"
          type="search"
          value={term}
          placeholder="Search jobs by title"
          className="h-11 rounded-xl bg-white pl-10"
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>

      {industries.length ? (
        <nav aria-label="Filter by industry" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <ul className="flex w-max items-center gap-2 pb-1">
            <li>
              <Chip active={!industry} onClick={() => setIndustry(null)}>
                All
              </Chip>
            </li>
            {industries.map((entry) => (
              <li key={entry.industry}>
                <Chip
                  active={industry === entry.industry}
                  onClick={() =>
                    setIndustry((current) =>
                      current === entry.industry ? null : entry.industry,
                    )
                  }
                >
                  {entry.count ? `${entry.industry} (${entry.count})` : entry.industry}
                </Chip>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {jobs.isLoading ? (
        <CardListSkeleton rows={4} />
      ) : list.length ? (
        <ul className="flex flex-col gap-3">
          {list.map((job) => (
            <li key={job._id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            keyword
              ? `Nothing matches “${keyword}” right now. Try a different title.`
              : "There are no open roles here yet."
          }
          action={
            industry ? (
              <Button
                variant="outline"
                size="lg"
                className="h-11"
                onClick={() => setIndustry(null)}
              >
                Show all industries
              </Button>
            ) : null
          }
        />
      )}

      {jobs.hasNextPage ? (
        <Button
          variant="outline"
          size="lg"
          className="h-11 self-center"
          disabled={jobs.isFetchingNextPage}
          onClick={() => void jobs.fetchNextPage()}
        >
          {jobs.isFetchingNextPage ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : null}
          Load more
        </Button>
      ) : null}
    </PageContainer>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "border-brand-700 bg-brand-700 text-white"
          : "border-border bg-white text-muted-foreground hover:border-brand-100 hover:text-brand-900",
      )}
    >
      {children}
    </button>
  );
}
