"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Heart, Loader2, Users, X } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { humanizeEmploymentType, jobCompanyName, jobSalaryLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isImportedJob, type AnyJob } from "@/types/api";

type FeedCardProps = {
  job: AnyJob;
  /** 0-100 from `computeJobMatch`; ignored for imported listings. */
  match: number;
  onPass: () => void;
  onLike: () => void;
  pending?: boolean;
  className?: string;
};

/**
 * One card in the home job feed: the browser stand-in for the mobile swipe
 * deck. "Pass" dismisses locally, "Like" saves (native) or registers interest
 * (imported) - the parent owns both actions.
 */
export function FeedCard({
  job,
  match,
  onPass,
  onLike,
  pending = false,
  className,
}: FeedCardProps) {
  const imported = isImportedJob(job);
  const companyName = jobCompanyName(job);
  const salary = jobSalaryLabel(job);
  const isOg = !imported && job.company?.isOg;

  const chips = (
    imported
      ? [humanizeEmploymentType(job.employmentType), job.workArrangement, job.category]
      : [job.type, job.workArrangement, job.category]
  ).filter((chip): chip is string => Boolean(chip?.trim()));

  const interestCount = imported ? (job.interestCount ?? 0) : 0;
  // Only set when the feed was fetched as an authenticated individual.
  const alreadyInterested = imported && Boolean(job.hasRegisteredInterest);

  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-border bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div>
        <div className="flex gap-3">
          <UserAvatar
            user={{ companyName, avatar: imported ? undefined : job.company?.avatar }}
            size="lg"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/jobs/${job._id}`}
              className="flex items-center gap-1 rounded font-semibold text-brand-900 transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="truncate">{job.title?.trim() || "Untitled role"}</span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-brand-700" />
            </Link>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-medium text-muted-foreground">
                {companyName}
              </span>
              {isOg ? (
                <Badge className="bg-accent-600 text-white" title="Original Gangster - early Rate'O company">
                  OG
                </Badge>
              ) : null}
              {imported ? (
                <Badge className="bg-accent-50 text-accent-600">Imported</Badge>
              ) : null}
            </div>

            {imported ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Employer not yet on Rate&rsquo;O
              </p>
            ) : null}
          </div>
        </div>

        {salary ? (
          <p className="mt-3 text-lg font-bold text-brand-900">
            {salary}
            {imported ? null : (
              <span className="text-sm font-medium text-muted-foreground">/month</span>
            )}
          </p>
        ) : null}

        {chips.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip}>
                <Badge variant="secondary" className="max-w-full truncate">
                  {chip}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Pass on ${job.title?.trim() || "this role"}`}
          onClick={onPass}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        {imported ? (
          <span className="flex min-w-0 items-center gap-2 rounded-full border border-success px-3 py-1.5">
            {alreadyInterested ? (
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success" />
            ) : (
              <Users aria-hidden="true" className="size-4 shrink-0 text-success" />
            )}
            <span className="truncate text-xs font-medium text-brand-900">
              {alreadyInterested
                ? interestCount > 0
                  ? `${interestCount} interested · You're in`
                  : "Interested ✓"
                : interestCount > 0
                  ? `${interestCount} interested`
                  : "Be the first to show interest"}
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-2 rounded-full border border-success py-1 pr-3 pl-1">
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-success text-[10px] font-bold text-success tabular-nums">
              {match}%
            </span>
            <span className="text-sm font-medium text-brand-900">Match</span>
          </span>
        )}

        <button
          type="button"
          aria-label={
            imported
              ? `Show interest in ${job.title?.trim() || "this role"}`
              : `Save ${job.title?.trim() || "this role"}`
          }
          onClick={onLike}
          disabled={pending}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          {pending ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Heart aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
    </article>
  );
}
