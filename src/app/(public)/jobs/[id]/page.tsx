import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ExternalLink, MapPin, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { JobActions } from "@/components/jobs/job-actions";
import { BulletList } from "@/components/shared/bullet-list";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/errors";
import {
  excerpt,
  formatDate,
  humanizeEmploymentType,
  isDeadlinePast,
  isObjectId,
  jobCompanyName,
  jobSalaryLabel,
  timeAgo,
} from "@/lib/format";
import { formatRating, kycBadgeStatus } from "@/lib/rating";
import { getServerSession } from "@/lib/session";
import { companiesServer } from "@/services/companies.server";
import { jobsServer } from "@/services/jobs.server";
import { isImportedJob, type AnyJob, type User } from "@/types/api";

const JOB_FETCH = { auth: false, next: { revalidate: 300 } } as const;

/** `notFound()` for a missing job; anything else bubbles to the error boundary. */
async function loadJob(id: string): Promise<AnyJob> {
  try {
    return await jobsServer.byId(id, JOB_FETCH);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isObjectId(id)) return { title: "Job not found" };

  let job: AnyJob;
  try {
    job = await jobsServer.byId(id, JOB_FETCH);
  } catch {
    return { title: "Job", alternates: { canonical: `/jobs/${id}` } };
  }

  const title = `${job.title?.trim() || "Job"} at ${jobCompanyName(job)}`;
  const description =
    excerpt(job.description) || `See this role on Rate'O and how its people rate the employer.`;
  const url = `/jobs/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-brand-900">{value}</dd>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const [job, session] = await Promise.all([loadJob(id), getServerSession()]);

  const imported = isImportedJob(job);
  const companyId = imported ? undefined : job.company?._id;

  // The job's populated company projection has no kycStatus / isOg / rating, so
  // fetch the public profile alongside it. Best effort - the page renders fine
  // without it.
  const companyProfile: User | null = companyId
    ? await companiesServer
        .byId(companyId, { auth: false, next: { revalidate: 300 } })
        .catch(() => null)
    : null;

  const companyName = jobCompanyName(job);
  const jobCompanyAvatar = imported ? undefined : job.company?.avatar;
  const jobCompanyLocation = imported ? undefined : job.company?.location;
  const salary = jobSalaryLabel(job);
  const posted = timeAgo(job.createdAt);
  const deadline = formatDate(job.deadline);
  const expired = isDeadlinePast(job.deadline);
  const closed = !imported && job.status === "closed";
  const employmentType = imported
    ? humanizeEmploymentType(job.employmentType)
    : job.type?.trim() || null;

  const badges = [job.workArrangement, employmentType, job.category].filter(Boolean) as string[];
  const tasks = imported ? [] : (job.tasks ?? []).filter((task) => task?.trim());
  const perks = imported ? [] : (job.perks ?? []).filter((perk) => perk?.trim());
  const skills = imported ? [] : (job.skills ?? []).filter((skill) => skill?.trim());

  return (
    <PageContainer>
      {/*
        Explicit grid placement instead of two stacked columns: on mobile the
        DOM order is header -> actions -> sections -> company, so the primary
        action is reachable without scrolling past the whole description.
      */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          {/* ---- header card ------------------------------------------- */}
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex gap-4">
              <UserAvatar
                user={{ companyName, avatar: jobCompanyAvatar }}
                size="lg"
                className="size-14! shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
                  {job.title?.trim() || "Untitled role"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {companyId ? (
                    <Link
                      href={`/companies/${companyId}`}
                      className="rounded font-medium text-brand-700 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {companyName}
                    </Link>
                  ) : (
                    <span className="font-medium text-brand-900">{companyName}</span>
                  )}
                </p>
                {job.location?.trim() ? (
                  <p className="mt-1 flex items-center gap-1 text-sm break-words text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                    {job.location.trim()}
                  </p>
                ) : null}
              </div>
            </div>

            {badges.length || imported || closed ? (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="max-w-full truncate">
                    {badge}
                  </Badge>
                ))}
                {imported ? (
                  <Badge className="bg-accent-50 text-accent-600">Imported</Badge>
                ) : null}
                {closed ? <Badge variant="destructive">Closed</Badge> : null}
              </div>
            ) : null}

            {salary ? (
              <p className="mt-4 text-xl font-bold text-brand-900 sm:text-2xl">
                {salary}
                {imported ? null : (
                  <span className="text-base font-medium whitespace-nowrap text-muted-foreground">
                    {" "}
                    / month
                  </span>
                )}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {imported ? (
                <span className="flex items-center gap-1.5">
                  <Users aria-hidden="true" className="size-4" />
                  {job.interestCount ?? 0}{" "}
                  {job.interestCount === 1 ? "professional" : "professionals"} interested
                </span>
              ) : (
                <span
                  className={
                    expired ? "flex items-center gap-1.5 text-danger" : "flex items-center gap-1.5"
                  }
                >
                  <CalendarClock aria-hidden="true" className="size-4" />
                  {deadline ? `Deadline: ${deadline}` : "No deadline"}
                  {expired ? " (Expired)" : ""}
                </span>
              )}
              {posted ? <span>Posted {posted}</span> : null}
            </div>

            {imported ? (
              <div className="mt-4 rounded-xl bg-accent-50 p-4">
                <p className="text-sm text-brand-900">
                  {job.expectationCopy?.trim() ||
                    "This job was imported by Rate'O. Register your interest and we'll invite the employer to join."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Employer not yet on Rate&rsquo;O.
                </p>
              </div>
            ) : null}
          </div>

        </div>

        {/* ---- action panel ------------------------------------------- */}
        <div className="rounded-2xl border border-border bg-white p-5 lg:col-start-2 lg:row-start-1">
          <JobActions
            job={job}
            viewer={{ authenticated: session !== null, role: session?.role ?? null }}
          />
        </div>

        {/* ---- body sections ------------------------------------------ */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-2">
          <Section title="About the role">
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {job.description?.trim() || "No description provided."}
            </p>
          </Section>

          {tasks.length ? (
            <Section title="Responsibilities">
              <BulletList items={tasks} />
            </Section>
          ) : null}

          {perks.length ? (
            <Section title="Perks">
              <BulletList items={perks} />
            </Section>
          ) : null}

          {skills.length ? (
            <Section title="Skills">
              <ul className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <li key={skill}>
                    <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Details">
            <dl>
              {employmentType ? <DetailRow label="Employment type" value={employmentType} /> : null}
              {job.workArrangement ? (
                <DetailRow label="Work arrangement" value={job.workArrangement} />
              ) : null}
              {job.category ? <DetailRow label="Industry" value={job.category} /> : null}
              {!imported && job.genderPreference && job.genderPreference !== "any" ? (
                <DetailRow
                  label="Preferred applicant"
                  value={job.genderPreference.replace(/^./, (c) => c.toUpperCase())}
                />
              ) : null}
              {!imported && typeof job.minRating === "number" && job.minRating > 0 ? (
                <DetailRow label="Minimum rating" value={`${job.minRating.toFixed(1)} stars`} />
              ) : null}
              {imported ? (
                <DetailRow label="Source" value="Imported listing" />
              ) : (
                <DetailRow label="Status" value={closed ? "Closed" : "Open"} />
              )}
            </dl>
          </Section>
        </div>

        {/* ---- company card -------------------------------------------- */}
        <aside className="lg:col-start-2 lg:row-start-2 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              About the company
            </h2>
            <div className="mt-3 flex gap-3">
              <UserAvatar
                user={{
                  companyName,
                  avatar: companyProfile?.avatar ?? jobCompanyAvatar,
                }}
                size="lg"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-brand-900">{companyName}</p>
                {companyProfile?.industry?.trim() ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {companyProfile.industry.trim()}
                  </p>
                ) : null}
                {(companyProfile?.location ?? jobCompanyLocation)?.trim() ? (
                  <p className="mt-0.5 text-sm break-words text-muted-foreground">
                    {(companyProfile?.location ?? jobCompanyLocation)?.trim()}
                  </p>
                ) : null}
              </div>
            </div>

            {companyProfile ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <VerifiedBadge status={kycBadgeStatus(companyProfile)} />
                {typeof companyProfile.overallRating === "number" &&
                companyProfile.overallRating > 0 ? (
                  <StarRating
                    value={companyProfile.overallRating}
                    label={formatRating(companyProfile.overallRating)}
                  />
                ) : null}
              </div>
            ) : null}

            {companyProfile?.website?.trim() ? (
              <a
                href={companyProfile.website.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium break-all text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                {companyProfile.website.trim().replace(/^https?:\/\//, "")}
              </a>
            ) : null}

            {companyId ? (
              <Link
                href={`/companies/${companyId}`}
                className="mt-4 inline-flex rounded text-sm font-medium text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                View company
              </Link>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                This employer is not on Rate&rsquo;O yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
