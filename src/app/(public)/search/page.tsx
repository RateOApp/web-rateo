import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Building2, Search as SearchIcon } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { CompanyCard } from "@/components/companies/company-card";
import { JobCard } from "@/components/jobs/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { SearchForm } from "@/components/shared/search-form";
import { cn } from "@/lib/utils";
import { companiesServer } from "@/services/companies.server";
import { jobsServer } from "@/services/jobs.server";
import type { JobCategoriesResponse, JobsResponse, UsersResponse } from "@/types/api";

type SearchType = "jobs" | "companies";
type SearchPageParams = { q?: string; type?: string; page?: string };

const EMPTY_JOBS: JobsResponse = { jobs: [], page: 1, pages: 0, totalCount: 0 };
const EMPTY_COMPANIES: UsersResponse = { users: [], page: 1, pages: 0 };
const EMPTY_CATEGORIES: JobCategoriesResponse = { categories: [] };

function toPageNumber(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function toType(value: string | undefined): SearchType {
  return value === "companies" ? "companies" : "jobs";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const keyword = q?.trim();

  return {
    title: keyword ? `Search: ${keyword}` : "Search",
    description: "Search jobs and companies across Rate'O.",
    alternates: { canonical: "/search" },
    // Result pages are thin and infinite in combination; keep them out of the
    // index and let /jobs and /companies carry the crawl budget.
    robots: keyword ? { index: false, follow: true } : undefined,
  };
}

/** Link-based tab bar — no client state, so every tab is a shareable URL. */
function SearchTabs({ active, keyword }: { active: SearchType; keyword?: string }) {
  const tabs: { key: SearchType; label: string }[] = [
    { key: "jobs", label: "Jobs" },
    { key: "companies", label: "Companies" },
  ];

  return (
    <nav aria-label="Search results type" className="mt-5">
      <ul className="inline-flex items-center gap-1 rounded-lg bg-muted p-[3px]">
        {tabs.map((tab) => {
          const search = new URLSearchParams();
          if (keyword) search.set("q", keyword);
          search.set("type", tab.key);
          const isActive = tab.key === active;

          return (
            <li key={tab.key}>
              <Link
                href={`/search?${search.toString()}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-md px-4 text-sm font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isActive
                    ? "bg-white text-brand-900 shadow-sm"
                    : "text-muted-foreground hover:text-brand-900",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

async function PopularCategories() {
  const data = await jobsServer
    .categories({ auth: false, next: { revalidate: 300 } })
    .catch(() => EMPTY_CATEGORIES);

  const categories = data.categories ?? [];
  if (!categories.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Popular industries
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.industry}>
            <Link
              href={`/jobs?category=${encodeURIComponent(category.industry)}`}
              className="inline-flex items-center rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-100 hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {category.industry}
              <span className="ml-1.5 text-xs text-muted-foreground">{category.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>;
}) {
  const { q, type, page } = await searchParams;
  const keyword = q?.trim() || undefined;
  const activeTab = toType(type);
  const pageNumber = toPageNumber(page);

  const jobs = keyword && activeTab === "jobs"
    ? await jobsServer
        .list(
          { keyword, pageNumber, categories: "all" },
          { auth: false, next: { revalidate: 60 } },
        )
        .catch(() => EMPTY_JOBS)
    : null;

  const companies = keyword && activeTab === "companies"
    ? await companiesServer
        .list({ keyword, pageNumber }, { auth: false, next: { revalidate: 60 } })
        .catch(() => EMPTY_COMPANIES)
    : null;

  return (
    <PageContainer>
      <PageHeader
        title="Search"
        description="Find roles and employers across Rate’O."
      />

      <SearchForm
        action="/search"
        value={keyword}
        size="lg"
        label="Search jobs and companies"
        placeholder="Search jobs and companies"
        hidden={{ type: activeTab }}
        autoFocus={!keyword}
      />

      <SearchTabs active={activeTab} keyword={keyword} />

      {!keyword ? (
        <>
          <EmptyState
            className="mt-6"
            icon={SearchIcon}
            title="What are you looking for?"
            description="Search a job title like “cleaner” or “data analyst”, or a company name."
          />
          <PopularCategories />
        </>
      ) : activeTab === "jobs" ? (
        <>
          {jobs?.jobs?.length ? (
            <ul className="mt-6 flex flex-col gap-3">
              {jobs.jobs.map((job) => (
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
              description={`Nothing matches “${keyword}” right now. Try a different title, or search companies instead.`}
            />
          )}
          <Pager
            page={jobs?.page ?? pageNumber}
            pages={jobs?.pages ?? 0}
            basePath="/search"
            params={{ q: keyword, type: "jobs" }}
          />
        </>
      ) : (
        <>
          {companies?.users?.length ? (
            <ul className="mt-6 flex flex-col gap-3">
              {companies.users.map((company) => (
                <li key={company._id}>
                  <CompanyCard company={company} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-6"
              icon={Building2}
              title="No companies found"
              description={`Nothing matches “${keyword}”. Try a different name, or search jobs instead.`}
            />
          )}
          <Pager
            page={companies?.page ?? pageNumber}
            pages={companies?.pages ?? 0}
            basePath="/search"
            params={{ q: keyword, type: "companies" }}
          />
        </>
      )}
    </PageContainer>
  );
}
