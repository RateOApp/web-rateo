"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RemoveDialog } from "@/components/saved/remove-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_FEED_KEY } from "@/hooks/use-jobs";
import { MY_INTERESTS_KEY, useMyInterests } from "@/hooks/use-my-interests";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { jobsService } from "@/services/jobs";
import type { JobInterest, JobInterestStatus } from "@/types/api";

const TONE_CLASSES = {
  success: "bg-success/10 text-success",
  warning: "bg-accent-50 text-accent-600",
} as const;

/** 'interested' is still waiting on the employer; the other two mean they came. */
function statusPill(status: JobInterestStatus | undefined) {
  return status === "notified" || status === "moved"
    ? { tone: "success" as const, label: "Employer joined" }
    : { tone: "warning" as const, label: "Interested" };
}

/**
 * The "Interested" tab: imported jobs this individual asked to be told about.
 * Rows link to the native job once the employer joined (`nativeJobId`), and the
 * trash button withdraws the interest.
 */
export function InterestsList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useMyInterests();
  const [target, setTarget] = useState<JobInterest | null>(null);
  const [busy, setBusy] = useState(false);

  const interests = data ?? [];

  async function handleRemove() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await jobsService.withdrawInterest(target.job._id);
      queryClient.setQueryData<JobInterest[]>(MY_INTERESTS_KEY, (old) =>
        Array.isArray(old) ? old.filter((entry) => entry._id !== target._id) : old,
      );
      void queryClient.invalidateQueries({ queryKey: JOB_FEED_KEY });
      setTarget(null);
      toast.success("Interest withdrawn");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not withdraw"));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <CardListSkeleton rows={3} />;

  if (!interests.length) {
    return (
      <EmptyState
        icon={Sparkles}
        title="You haven't shown interest in any imported jobs yet."
        description="Show interest on a job whose employer isn't on Rate'O yet to see it here."
        action={
          <Button asChild size="lg" className="h-11 bg-brand-700 text-white">
            <Link href="/dashboard/explore/jobs">Find jobs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {interests.map((interest) => {
          const job = interest.job;
          const pill = statusPill(interest.status);
          const salary = job.salary?.trim() || "Negotiable";
          const companyName = job.companyName?.trim() || "Employer not on Rate'O";
          const interestCount = job.interestCount ?? 0;

          return (
            <li
              key={interest._id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4"
            >
              <UserAvatar user={{ companyName: job.companyName }} size="lg" className="shrink-0" />

              <div className="min-w-0 flex-1">
                <Link
                  href={`/jobs/${job.nativeJobId ?? job._id}`}
                  className="block truncate rounded font-semibold text-brand-900 transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {job.title?.trim() || "Untitled role"}
                </Link>
                <p className="truncate text-sm text-muted-foreground">{companyName}</p>
                <p className="mt-1 text-sm font-semibold text-brand-900">{salary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {interestCount > 0 ? `${interestCount} interested` : "Be the first"}
                </p>
                <Badge variant="secondary" className="mt-2">
                  Imported
                </Badge>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    TONE_CLASSES[pill.tone],
                  )}
                >
                  {pill.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Withdraw interest in ${job.title?.trim() || "this role"}`}
                  onClick={() => setTarget(interest)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <RemoveDialog
        open={target !== null}
        busy={busy}
        title="Withdraw your interest?"
        description="You'll no longer be notified if this employer joins Rate'O."
        confirmLabel="Withdraw"
        onOpenChange={(next) => (next ? null : setTarget(null))}
        onConfirm={() => void handleRemove()}
      />
    </>
  );
}
