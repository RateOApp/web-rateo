import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { CompanyCard } from "@/components/companies/company-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { SearchForm } from "@/components/shared/search-form";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatRating } from "@/lib/rating";
import { companiesServer } from "@/services/companies.server";
import type { TopRatedResponse, User, UsersResponse } from "@/types/api";

export const metadata: Metadata = {
  title: "Companies",
  description:
    "Browse employers on Rate'O and see how the people who work there rate pay, management, growth and fairness.",
  alternates: { canonical: "/companies" },
};

type CompaniesSearchParams = { q?: string; page?: string };

const EMPTY: UsersResponse = { users: [], page: 1, pages: 0 };
const EMPTY_TOP_RATED: Pick<TopRatedResponse, "users"> = { users: [] };

function toPageNumber(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Small horizontal strip of the best-rated companies, as ranked by the
 * server (`GET /users/top-rated`). Rendered as-is - no client-side
 * filter/sort/slice.
 */
function TopRated({ companies }: { companies: User[] }) {
  const top = companies;
  if (!top.length) return null;

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Top rated
      </h2>
      <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {top.map((company) => (
          <li key={company._id} className="w-44 shrink-0">
            <Link
              href={`/companies/${company._id}`}
              className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-white p-4 text-center transition-colors hover:border-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <UserAvatar user={company} size="lg" className="size-12!" />
              <span className="line-clamp-2 text-sm font-semibold text-brand-900">
                {company.companyName?.trim() || "Unnamed company"}
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {company.industry?.trim() || "General"}
              </span>
              <StarRating
                value={company.overallRating ?? 0}
                size={14}
                label={formatRating(company.overallRating)}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<CompaniesSearchParams>;
}) {
  const { q, page } = await searchParams;
  const keyword = q?.trim() || undefined;
  const pageNumber = toPageNumber(page);
  const showTopRated = pageNumber === 1 && !keyword;

  const [data, topRated] = await Promise.all([
    companiesServer
      .list({ keyword, pageNumber }, { auth: false, next: { revalidate: 60 } })
      .catch(() => EMPTY),
    showTopRated
      ? companiesServer
          .topRated(5, { auth: false, next: { revalidate: 60 } })
          .catch(() => EMPTY_TOP_RATED)
      : Promise.resolve(EMPTY_TOP_RATED),
  ]);

  const companies = data.users ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Companies on Rate’O"
        description={
          keyword
            ? `Employers matching “${keyword}”`
            : "See how employers are rated by the people who work for them."
        }
      />

      <SearchForm
        action="/companies"
        value={keyword}
        label="Search companies by name"
        placeholder="Search companies by name"
      />

      {showTopRated ? <TopRated companies={topRated.users ?? []} /> : null}

      {companies.length ? (
        <ul className="mt-6 flex flex-col gap-3">
          {companies.map((company) => (
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
          description={
            keyword
              ? `Nothing matches “${keyword}”. Try a different name.`
              : "No companies are listed yet. Check back soon."
          }
        />
      )}

      <Pager
        page={data.page ?? pageNumber}
        pages={data.pages ?? 0}
        basePath="/companies"
        params={{ q: keyword }}
      />
    </PageContainer>
  );
}
