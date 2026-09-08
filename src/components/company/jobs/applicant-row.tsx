"use client";

import Link from "next/link";
import { Check, Loader2, Star, X } from "lucide-react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { formatRating, hasRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import type { ApplicantStatus, JobApplicantProfile } from "@/types/company-jobs";

const STATUS_CLASSES: Record<string, string> = {
  accepted: "bg-success/10 text-success",
  rejected: "bg-muted text-muted-foreground",
};

function statusPill(status: string) {
  return STATUS_CLASSES[status] ?? "bg-accent-50 text-accent-600";
}

/**
 * One applicant. Pending rows carry the decline / accept controls; every other
 * row shows the status it settled on.
 *
 * The name links into the shared talent page with `?job=&from=applicants`, so
 * that screen can offer "Reject" for this application and route back here.
 */
export function ApplicantRow({
  jobId,
  applicant,
  status,
  busy = false,
  onAccept,
  onDecline,
}: {
  jobId: string;
  applicant: JobApplicantProfile;
  status: ApplicantStatus;
  busy?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name =
    [applicant.firstName, applicant.lastName].filter(Boolean).join(" ").trim() || "Candidate";
  const title = applicant.title?.trim() || "Job Seeker";
  const rating = applicant.overallRating;
  const pending = status === "pending";

  return (
    <li className="relative flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
      <UserAvatar
        user={{ firstName: applicant.firstName, lastName: applicant.lastName, avatar: applicant.avatar }}
        size="lg"
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/talent/${applicant._id}?job=${jobId}&from=applicants`}
          className="block truncate rounded font-semibold text-brand-900 transition-colors after:absolute after:inset-0 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {name}
        </Link>
        <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground">
          <span className="truncate">{title}</span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex shrink-0 items-center gap-0.5">
            <Star
              aria-hidden="true"
              className={cn(
                "size-3.5",
                hasRating(rating) ? "fill-star text-star" : "text-gray-400/60",
              )}
            />
            {formatRating(rating)}
          </span>
        </p>
      </div>

      {pending ? (
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={busy}
            aria-label={`Decline ${name}`}
            onClick={onDecline}
            className="border-destructive/40 text-destructive hover:bg-destructive/5"
          >
            <X aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            disabled={busy}
            aria-label={`Accept ${name}`}
            onClick={onAccept}
            className="bg-brand-700 text-white"
          >
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
          </Button>
        </div>
      ) : (
        <span
          className={cn(
            "relative z-10 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            statusPill(status),
          )}
        >
          {status}
        </span>
      )}
    </li>
  );
}
