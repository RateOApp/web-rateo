"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Star, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RemoveDialog } from "@/components/saved/remove-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { SAVED_JOBS_KEY, useSavedJobs } from "@/hooks/use-saved-jobs";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatSalaryRange, jobCompanyName } from "@/lib/format";
import { formatRating, hasRating } from "@/lib/rating";
import { jobsService } from "@/services/jobs";
import type { Job } from "@/types/api";

export function SavedJobsList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useSavedJobs();
  const [target, setTarget] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  const jobs = data ?? [];

  async function handleRemove() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await jobsService.unsave(target._id);
      queryClient.setQueryData<Job[]>(SAVED_JOBS_KEY, (old) =>
        Array.isArray(old) ? old.filter((entry) => entry._id !== target._id) : old,
      );
      setTarget(null);
      toast.success("Removed successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove"));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <CardListSkeleton rows={3} />;

  if (!jobs.length) {
    return (
      <EmptyState
        icon={Bookmark}
        title="You don't have any saved jobs yet."
        description="Start saving jobs to see them here."
        action={
          <Button asChild size="lg" className="h-11 bg-brand-700 text-white">
            <Link href="/dashboard/explore/jobs">Find great jobs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {jobs.map((job) => {
          const rating = job.company?.overallRating;
          const salary = formatSalaryRange(job.minSalary, job.maxSalary);

          return (
            <li
              key={job._id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4"
            >
              <UserAvatar
                user={{ companyName: jobCompanyName(job), avatar: job.company?.avatar }}
                size="lg"
                className="shrink-0"
              />

              <div className="min-w-0 flex-1">
                <Link
                  href={`/jobs/${job._id}`}
                  className="block truncate rounded font-semibold text-brand-900 transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {job.title?.trim() || "Untitled role"}
                </Link>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <span className="truncate">{jobCompanyName(job)}</span>
                  {hasRating(rating) ? (
                    <span className="flex shrink-0 items-center gap-0.5 font-medium text-brand-900">
                      {formatRating(rating)}
                      <Star aria-hidden="true" className="size-3.5 fill-star text-star" />
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-900">
                  {salary}
                  {salary === "Negotiable" ? null : (
                    <span className="font-medium text-muted-foreground">/month</span>
                  )}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${job.title?.trim() || "this role"} from saved`}
                className="shrink-0"
                onClick={() => setTarget(job)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      <RemoveDialog
        open={target !== null}
        busy={busy}
        onOpenChange={(next) => (next ? null : setTarget(null))}
        onConfirm={() => void handleRemove()}
      />
    </>
  );
}
