import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Star } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RatingSummary } from "@/components/companies/rating-summary";
import { ReviewList } from "@/components/companies/review-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ShareButton } from "@/components/shared/share-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { excerpt, formatPublicId, isObjectId } from "@/lib/format";
import { kycBadgeStatus, participationLabel } from "@/lib/rating";
import { getServerSession } from "@/lib/session";
import { companiesServer } from "@/services/companies.server";
import type { Review, User } from "@/types/api";

const PUBLIC_FETCH = { auth: false, next: { revalidate: 120 } } as const;

/**
 * `GET /users/:id` serves individuals too, so a non-company id is a 404 here.
 * The endpoint also leaks email, phone, pushToken, kycDocuments and the
 * verification code/expiry fields - none of them are rendered.
 */
async function loadCompany(id: string): Promise<User> {
  let user: User;
  try {
    user = await companiesServer.byId(id, PUBLIC_FETCH);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (user?.role !== "company") notFound();
  return user;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isObjectId(id)) return { title: "Company not found" };

  let company: User;
  try {
    company = await companiesServer.byId(id, PUBLIC_FETCH);
  } catch {
    return { title: "Company", alternates: { canonical: `/companies/${id}` } };
  }
  if (company?.role !== "company") return { title: "Company not found" };

  const name = company.companyName?.trim() || "Company";
  const title = `${name} — Ratings & jobs on Rate'O`;
  const description =
    excerpt(company.description) || `See how employees rate ${name} on Rate'O.`;
  const url = `/companies/${id}`;

  return {
    // Absolute: the title already ends in "on Rate'O", so skip the root template.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const [company, reviews, session] = await Promise.all([
    loadCompany(id),
    companiesServer.reviews(id, PUBLIC_FETCH).catch((): Review[] => []),
    getServerSession(),
  ]);

  const name = company.companyName?.trim() || "Unnamed company";
  const publicId = formatPublicId(company.publicId);
  const participation = participationLabel(company.participationStatus);
  const website = company.website?.trim();
  const companyPath = `/companies/${id}`;

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        {/* ---- profile header ------------------------------------------ */}
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <UserAvatar user={company} size="lg" className="size-20! shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-brand-900">{name}</h1>
                {company.isOg ? (
                  <Badge className="bg-accent-600 text-white">OG</Badge>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {company.industry?.trim() || "General"}
              </p>

              {company.location?.trim() ? (
                <p className="mt-1 flex items-center gap-1 text-sm break-words text-muted-foreground">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  {company.location.trim()}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <VerifiedBadge status={kycBadgeStatus(company)} />
                {participation ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    {participation}
                  </Badge>
                ) : null}
                {publicId ? (
                  <span className="text-xs text-muted-foreground">{publicId}</span>
                ) : null}
              </div>

              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium break-all text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                  {website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {session === null ? (
              <Button asChild size="lg" className="h-10 bg-brand-700 text-white">
                <Link href={`/login?next=${encodeURIComponent(companyPath)}`}>
                  Log in to rate this company
                </Link>
              </Button>
            ) : session.role === "individual" ? (
              <Button asChild size="lg" className="h-10 bg-brand-700 text-white">
                <Link href="/dashboard/ratings">
                  <Star aria-hidden="true" />
                  Rate this company
                </Link>
              </Button>
            ) : null}
            <ShareButton path={companyPath} title={name} className="h-10" />
          </div>
        </section>

        {/* ---- about ---------------------------------------------------- */}
        {company.description?.trim() ? (
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-brand-900">About</h2>
            <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">
              {company.description.trim()}
            </p>
          </section>
        ) : null}

        {/* ---- ratings -------------------------------------------------- */}
        {reviews.length ? (
          <>
            <RatingSummary
              reviews={reviews}
              contractEndSummary={company.contractEndSummary}
            />
            <section>
              <h2 className="mb-3 text-lg font-semibold text-brand-900">
                Reviews ({reviews.length})
              </h2>
              <ReviewList reviews={reviews} />
            </section>
          </>
        ) : (
          <EmptyState
            icon={Star}
            title="No ratings yet"
            description={`Nobody has rated ${name} on Rate'O yet. Ratings appear here once employees start scoring their workplace.`}
          />
        )}
      </div>
    </PageContainer>
  );
}
