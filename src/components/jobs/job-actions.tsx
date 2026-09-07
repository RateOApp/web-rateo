"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Check, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ShareButton } from "@/components/shared/share-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/client";
import { isDeadlinePast } from "@/lib/format";
import type { Role } from "@/lib/session";
import { jobsService } from "@/services/jobs";
import { isImportedJob, type AnyJob } from "@/types/api";

type Viewer = { authenticated: boolean; role: Role | null };

type JobActionsProps = {
  job: AnyJob;
  viewer: Viewer;
  /** Best-effort seeds; the API response is what actually settles the state. */
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
 */
export function JobActions({
  job,
  viewer,
  initialApplied = false,
  initialSaved = false,
}: JobActionsProps) {
  const [applied, setApplied] = useState(initialApplied);
  const [saved, setSaved] = useState(initialSaved);
  const [interested, setInterested] = useState(false);
  const [pending, setPending] = useState<"apply" | "save" | "interest" | null>(null);
  const [kycOpen, setKycOpen] = useState(false);

  const imported = isImportedJob(job);
  const expired = isDeadlinePast(job.deadline);
  const closed = !imported && job.status === "closed";
  const shut = closed || expired;
  const shutReason = closed ? "This role has been closed" : "The deadline has passed";

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
        setKycOpen(true);
      } else if (status === 400 && /already/i.test(message)) {
        // "You have already applied for this job" / "already saved".
        if (kind === "apply") setApplied(true);
        if (kind === "save") setSaved(true);
        toast.info(message);
      } else {
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

  return (
    <>
      <div className="flex flex-col gap-2">
        {imported ? (
          <Button
            size="lg"
            className="h-11 w-full bg-brand-700 text-white"
            disabled={interested || pending !== null}
            onClick={() =>
              void run(
                "interest",
                () => jobsService.expressInterest(job._id),
                () => {
                  setInterested(true);
                  toast.success("Interest registered. We will let you know if the employer joins.");
                },
              )
            }
          >
            {pending === "interest" ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : interested ? (
              <Check aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {interested ? "Interest registered" : "Show interest"}
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-11 w-full bg-brand-700 text-white"
            disabled={applied || shut || pending !== null}
            onClick={() =>
              void run(
                "apply",
                () => jobsService.apply(job._id),
                () => {
                  setApplied(true);
                  toast.success("Application submitted");
                },
              )
            }
          >
            {pending === "apply" ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : applied ? (
              <Check aria-hidden="true" />
            ) : null}
            {shut ? "Applications closed" : applied ? "Applied" : "Apply now"}
          </Button>
        )}

        {shut && !imported ? <p className="text-xs text-muted-foreground">{shutReason}.</p> : null}

        {imported ? null : (
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            aria-pressed={saved}
            disabled={pending !== null}
            onClick={() =>
              void run(
                "save",
                () => (saved ? jobsService.unsave(job._id) : jobsService.save(job._id)),
                () => {
                  setSaved((previous) => !previous);
                  toast.success(saved ? "Removed from saved" : "Saved");
                },
              )
            }
          >
            {pending === "save" ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : saved ? (
              <BookmarkCheck aria-hidden="true" />
            ) : (
              <Bookmark aria-hidden="true" />
            )}
            {saved ? "Saved" : "Save"}
          </Button>
        )}

        <ShareButton path={jobPath} title={shareTitle} className="h-11 w-full" />
      </div>

      <Dialog open={kycOpen} onOpenChange={setKycOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-5 text-brand-700" />
              Verify your identity to apply
            </DialogTitle>
            <DialogDescription>
              Rate&rsquo;O verifies everyone who applies for a role, so employers know who they are
              hiring. It only takes a couple of minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="lg" onClick={() => setKycOpen(false)}>
              Not now
            </Button>
            <Button asChild size="lg" className="bg-brand-700 text-white">
              <Link href="/dashboard/kyc">Start verification</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
