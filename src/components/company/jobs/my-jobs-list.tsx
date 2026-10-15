"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Pencil, Users } from "lucide-react";

import { useKycGate, useParticipationLock } from "@/components/dashboard/dashboard-providers";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useMyClaims } from "@/hooks/use-imported-jobs";
import { useMyJobs } from "@/hooks/use-my-jobs";
import { formatDate, humanizeEmploymentType } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/api";
import type { PendingClaim } from "@/types/imported-jobs";

/**
 * "Post a job", gated the way the endpoint is: unverified companies get the
 * KYC dialog, and an overdue monthly rating opens the unlock dialog before the
 * form is even reached.
 */
export function PostJobButton({
  label = "Post a job",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const kyc = useKycGate();
  const lock = useParticipationLock();

  return (
    <Button
      type="button"
      size="lg"
      className={cn("h-11 bg-brand-700 text-white", className)}
      onClick={() => {
        if (!kyc.requireVerified()) return;
        if (lock.isOverdue) {
          lock.open();
          return;
        }
        router.push("/dashboard/jobs/new");
      }}
    >
      {label}
    </Button>
  );
}

function statusLabel(job: Job): string {
  const status = job.status?.trim();
  if (!status) return "Open";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function JobRow({ job }: { job: Job }) {
  const applicants = job.applicants?.length ?? 0;
  const posted = formatDate(job.createdAt);
  const open = (job.status ?? "open") === "open";
  const meta = [job.type?.trim(), job.workArrangement?.trim()].filter(Boolean).join(" • ");

  return (
    <li className="relative rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-100 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-base font-semibold text-brand-900 sm:text-lg">
          {/* Stretched link: the whole card opens the applicants list, while
              the edit control above it keeps its own hit area. */}
          <Link
            href={`/dashboard/jobs/${job._id}/applicants`}
            className="rounded transition-colors after:absolute after:inset-0 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {job.title?.trim() || "Untitled role"}
          </Link>
        </h2>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            open ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-600",
          )}
        >
          {statusLabel(job)}
        </span>
      </div>

      {meta ? <p className="mt-1.5 text-sm text-muted-foreground">{meta}</p> : null}
      {job.location?.trim() ? (
        <p className="text-sm text-muted-foreground">{job.location.trim()}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Users aria-hidden="true" className="size-4" />
          {applicants} Applicant{applicants === 1 ? "" : "s"}
        </span>

        <div className="flex items-center gap-3">
          {posted ? (
            <span className="text-xs text-muted-foreground">Posted {posted}</span>
          ) : null}
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="relative z-10 text-brand-700"
          >
            <Link
              href={`/dashboard/jobs/${job._id}/edit`}
              aria-label={`Edit ${job.title?.trim() || "job"}`}
            >
              <Pencil aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </li>
  );
}

function ClaimRow({ claim }: { claim: PendingClaim }) {
  const count = claim.interestCount ?? 0;
  const meta = [humanizeEmploymentType(claim.employmentType), claim.location?.trim()]
    .filter(Boolean)
    .join(" • ");

  return (
    <li className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold text-brand-900 sm:text-lg">
          {claim.title?.trim() || claim.jobTitle?.trim() || "Untitled role"}
        </h3>
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Pending verification
        </span>
      </div>
      {meta ? <p className="mt-1.5 text-sm text-muted-foreground">{meta}</p> : null}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Users aria-hidden="true" className="size-4" />
          {count} interested
        </span>
        <Button asChild size="sm" className="bg-brand-700 text-white">
          <Link href="/dashboard/kyc">Complete verification</Link>
        </Button>
      </div>
    </li>
  );
}

function PendingClaims() {
  const { data } = useMyClaims();
  if (!data?.length) return null;

  return (
    <section aria-labelledby="pending-claims-heading" className="mb-6">
      <h2 id="pending-claims-heading" className="mb-3 text-sm font-semibold text-brand-900">
        Pending verification
      </h2>
      <ul className="flex flex-col gap-3">
        {data.map((claim) => (
          <ClaimRow key={claim._id} claim={claim} />
        ))}
      </ul>
    </section>
  );
}

/** `GET /jobs/company/myjobs`, newest first (the server already sorts). */
function NativeJobs() {
  const { data, isLoading, isError } = useMyJobs();
  const jobs = data ?? [];

  if (isLoading) return <CardListSkeleton rows={3} />;

  if (isError) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Something went wrong"
        description="We couldn't load your job postings. Check your connection and try again."
      />
    );
  }

  if (!jobs.length) {
    return (
      <EmptyState
        icon={Briefcase}
        title="You haven't posted any jobs yet."
        description="Post a role and start collecting applicants."
        action={<PostJobButton label="Post a Job" />}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => (
        <JobRow key={job._id} job={job} />
      ))}
    </ul>
  );
}

export function MyJobsList() {
  return (
    <>
      <PendingClaims />
      <NativeJobs />
    </>
  );
}
