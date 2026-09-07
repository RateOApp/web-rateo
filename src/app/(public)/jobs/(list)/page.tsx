import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryChips } from "@/components/jobs/category-chips";
import { JobCard } from "@/components/jobs/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { SearchForm } from "@/components/shared/search-form";
import { jobsServer } from "@/services/jobs.server";
import type { JobCategoriesResponse, JobsResponse } from "@/types/api";

export const metadata: Metadata = {
  title: "Jobs",
  description:
    "Browse open roles from companies on Rate'O, filter by industry and see how their people rate them before you apply.",
  alternates: { canonical: "/jobs" },
};

type JobsSearchParams = { q?: string; page?: string; category?: string };

const EMPTY_JOBS: JobsResponse = { jobs: [], page: 1, pages: 0, totalCount: 0 };
const EMPTY_CATEGORIES: JobCategoriesResponse = { categories: [] };

function toPageNumber(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<JobsSearchParams>;
}) {
  const { q, page, category } = await searchParams;
  const keyword = q?.trim() || undefined;
  const industry = category?.trim() || undefined;
  const pageNumber = toPageNumber(page);

  // `categories: 'all'` is mandatory on public pages: with the param absent the
  // backend personalises the feed from the signed-in individual's preferences.
  const [data, categoryData] = await Promise.all([
    jobsServer
      .list(
        { keyword, pageNumber, categories: industry ?? "all" },
        { auth: false, next: { revalidate: 60 } },
      )
      .catch(() => EMPTY_JOBS),
    jobsServer
      .categories({ auth: false, next: { revalidate: 300 } })
      .catch(() => EMPTY_CATEGORIES),
  ]);

  const jobs = data.jobs ?? [];
  const total = data.totalCount ?? jobs.length;
  const carried = { q: keyword, category: industry };

  const description = keyword
    ? `${total} ${total === 1 ? "role" : "roles"} matching “${keyword}”`
    : `${total} open ${total === 1 ? "role" : "roles"} on Rate’O right now`;

  return (
    <PageContainer>
      <PageHeader title="Find your next job" description={description} />

      <SearchForm
        action="/jobs"
        value={keyword}
        label="Search jobs by title"
        placeholder="Search jobs by title"
        hidden={{ category: industry }}
      />

      <CategoryChips
        categories={categoryData.categories ?? []}
        active={industry}
        basePath="/jobs"
        params={{ q: keyword }}
        className="mt-4"
      />

      {jobs.length ? (
        <ul className="mt-6 flex flex-col gap-3">
          {jobs.map((job) => (
            <li key={job._id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-6"
          icon={Briefcase}
          title="No jobs found"
          description={
            keyword
              ? `Nothing matches “${keyword}” right now. Try a different title.`
              : industry
                ? `No open roles in ${industry} at the moment. Try another industry.`
                : "There are no open roles right now. Check back soon."
          }
        />
      )}

      <Pager page={data.page ?? pageNumber} pages={data.pages ?? 0} basePath="/jobs" params={carried} />
    </PageContainer>
  );
}
