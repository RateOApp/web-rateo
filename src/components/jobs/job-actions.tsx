"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Check, Loader2, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useKycGate,
  useParticipationLock,
} from "@/components/dashboard/dashboard-providers";
import { JobMenu } from "@/components/jobs/job-menu";
import { ShareButton } from "@/components/shared/share-button";
import { Button } from "@/components/ui/button";
import { APPLIED_JOBS_KEY, useAppliedJobs } from "@/hooks/use-applied-jobs";
import { SAVED_JOBS_KEY, useSavedJobs } from "@/hooks/use-saved-jobs";
import { getApiErrorMessage } from "@/lib/api/client";
import { isDeadlinePast } from "@/lib/format";
import type { Role } from "@/lib/session";
import { jobsService } from "@/services/jobs";
import { isImportedJob, type AnyJob } from "@/types/api";

type Viewer = { authenticated: boolean; role: Role | null };

type JobActionsProps = {
  job: AnyJob;
  viewer: Viewer;
  /** Best-effort seeds; the cached queries and the API settle the real state. */
  initialApplied?: boolean;
  initialSaved?: boolean;
};

function statusOf(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { status?: number } }).response;
    if (typeof response?.status === "number") return response.status;
  }
  return undefined;
}

/**
 * The only interactive part of the job detail page. Everything around it stays
 * server-rendered.
 *
 * NOTE: this component also renders on the PUBLIC job page, where the
 * dashboard providers are not mounted. `useKycGate` / `useParticipationLock`
 * degrade to self-contained dialogs there (see `dashboard-providers.tsx`), so
 * both `kyc.fallback` and `lock.fallback` must be rendered.
 */
export function JobActions({
  job,
  viewer,
  initialApplied = false,
  initialSaved = false,
}: JobActionsProps) {
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const lock = useParticipationLock();

  const isIndividual = viewer.authenticated && viewer.role !== "company";
  const savedJobs = useSavedJobs(isIndividual);
  const appliedJobs = useAppliedJobs(isIndividual);

  const [appliedLocal, setAppliedLocal] = useState(false);
  const [savedLocal, setSavedLocal] = useState(false);
  const [interested, setInterested] = useState(false);
  const [pending, setPending] = useState<"apply" | "save" | "interest" | null>(null);

  const imported = isImportedJob(job);
  const expired = isDeadlinePast(job.deadline);
  const closed = !imported && job.status === "closed";
  const shut = closed || expired;
  const shutReason = closed ? "This role has been closed" : "The deadline has passed";

  const applied =
    initialApplied ||
    appliedLocal ||
    Boolean(appliedJobs.data?.some((entry) => entry.job?._id === job._id));
  const saved =
    initialSaved || savedLocal || Boolean(savedJobs.data?.some((entry) => entry._id === job._id));

  const jobPath = `/jobs/${job._id}`;
  const shareTitle = job.title?.trim() || "Job on Rate'O";

  async function run(
    kind: "apply" | "save" | "interest",
    action: () => Promise<unknown>,
    onSuccess: () => void,
  ) {
    if (pending) return;
    setPending(kind);
    try {
      await action();
      onSuccess();
    } catch (error) {
      const status = statusOf(error);
      const message = getApiErrorMessage(error, "Something went wrong");

      if (status === 403 && /kyc|verif/i.test(message)) {
        // The backend gates apply/save behind approved KYC.
        kyc.open();
      } else if (status === 400 && /already/i.test(message)) {
        // "You have already applied for this job" / "already saved".
        if (kind === "apply") setAppliedLocal(true);
        if (kind === "save") setSavedLocal(true);
        toast.info(message);
      } else if (status !== 403 || !/participation/i.test(message)) {
        // A PARTICIPATION_OVERDUE 403 already opened the lock dialog through
        // the axios interceptor - no toast on top of it.
        toast.error(message);
      }
    } finally {
      setPending(null);
    }
  }

  /* ---- signed out ------------------------------------------------------ */

  if (!viewer.authenticated) {
    return (
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="h-11 w-full bg-brand-700 text-white">
          <Link href={`/login?next=${encodeURIComponent(jobPath)}`}>Log in to apply</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 w-full">
          <Link href="/register">Create account</Link>
        </Button>
        <ShareButton path={jobPath} title={shareTitle} className="h-11 w-full" />
      </div>
    );
  }

  /* ---- company viewer -------------------------------------------------- */

  if (viewer.role === "company") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          You&rsquo;re signed in as a company, so you can&rsquo;t apply for roles.
        </p>
        <ShareButton path={jobPath} title={shareTitle} className="h-11 w-full" />
      </div>
    );
  }

  /* ---- individual ------------------------------------------------------ */

  function handleApply() {
    // Pre-empt the two server-side gates so the user gets the right dialog
    // instead of a bare 403.
    if (lock.isOverdue) {
      lock.open();
      return;
    }
    if (!kyc.requireVerified()) return;

    void run(
      "apply",
      () => jobsService.apply(job._id),
      () => {
        setAppliedLocal(true);
        void queryClient.invalidateQueries({ queryKey: APPLIED_JOBS_KEY });
        toast.success("Application submitted");
      },
    );
  }

  function handleSave() {
    if (!kyc.requireVerified()) return;

    void run(
      "save",
      () => jobsService.save(job._id),
      () => {
        setSavedLocal(true);
        void queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
        toast.success("Job saved");
      },
    );
  }

  function handleInterest() {
    if (lock.isOverdue) {
      lock.open();
      return;
    }

    void run(
      "interest",
      () => jobsService.expressInterest(job._id),
      () => {
        setInterested(true);
        toast.success("Interest registered — we'll notify you if the employer joins");
      },
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {imported ? (
          <Button
            size="lg"
            className="h-11 w-full bg-brand-700 text-white"
            disabled={interested || pending !== null}
            onClick={handleInterest}
          >
            {pending === "interest" ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : interested ? (
              <Check aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {interested ? "Interest registered ✓" : "Show interest"}
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                size="lg"
                className="h-11 flex-1 bg-brand-700 text-white"
                disabled={applied || shut || pending !== null}
                onClick={handleApply}
              >
                {pending === "apply" ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : applied ? (
                  <Check aria-hidden="true" />
                ) : null}
                {shut ? "Application Closed" : applied ? "Applied" : "Apply now"}
              </Button>
              <JobMenu jobId={job._id} />
            </div>

            {shut ? <p className="text-xs text-muted-foreground">{shutReason}.</p> : null}

            {saved ? null : (
              <Button
                variant="outline"
                size="lg"
                className="h-11 w-full"
                disabled={pending !== null}
                onClick={handleSave}
              >
                {pending === "save" ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <Bookmark aria-hidden="true" />
                )}
                Save for later
              </Button>
            )}

            {saved ? (
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-success">
                <BookmarkCheck aria-hidden="true" className="size-4" />
                Saved
              </p>
            ) : null}
          </>
        )}

        <ShareButton path={jobPath} title={shareTitle} className="h-11 w-full" />
      </div>

      {kyc.fallback}
      {lock.fallback}
    </>
  );
}
