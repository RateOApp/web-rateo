"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { RemoveDialog } from "@/components/saved/remove-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MY_JOBS_KEY, useMyJobs } from "@/hooks/use-my-jobs";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatDate, formatNaira } from "@/lib/format";
import { candidatesService } from "@/services/candidates";
import type { Job } from "@/types/api";

/**
 * "Manage applications": the company's own job posts, each linking to its
 * applicants list. Deleting a post is confirmed with the shared remove dialog.
 */
export function ManageApplications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const kyc = useKycGate();

  const [target, setTarget] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  // Same `['myJobs']` cache entry the /dashboard/jobs page uses.
  const query = useMyJobs();

  const jobs = query.data ?? [];

  async function handleDelete() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await candidatesService.deleteJob(target._id);
      queryClient.setQueryData<Job[]>(MY_JOBS_KEY, (old) =>
        Array.isArray(old) ? old.filter((job) => job._id !== target._id) : old,
      );
      setTarget(null);
      toast.success("Removed successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete job"));
    } finally {
      setBusy(false);
    }
  }

  if (query.isLoading) return <CardListSkeleton rows={3} />;

  if (!jobs.length) {
    return (
      <>
        <EmptyState
          icon={Briefcase}
          title="You don't have any job posting."
          action={
            <Button
              size="lg"
              className="h-11 bg-accent-600 text-white"
              onClick={() => kyc.requireVerified(() => router.push("/dashboard/jobs/new"))}
            >
              <Plus aria-hidden="true" />
              Post a job opening
            </Button>
          }
        />
        {kyc.fallback}
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button asChild size="lg" className="h-11 bg-brand-700 text-white">
          <Link href="/dashboard/jobs/new">
            <Plus aria-hidden="true" />
            Post a job
          </Link>
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {jobs.map((job) => {
          const salary = formatNaira(job.minSalary);
          const deadline = formatDate(job.deadline);
          const applicants = job.applicants?.length ?? 0;

          return (
            <li
              key={job._id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 sm:p-5"
            >
              <Link
                href={`/dashboard/jobs/${job._id}/applicants`}
                className="min-w-0 flex-1 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="block truncate font-semibold text-brand-900">
                  {job.title?.trim() || "Untitled role"}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {salary ? (
                    <>
                      {salary}
                      <span className="text-muted-foreground">/month</span>
                    </>
                  ) : (
                    "Negotiable"
                  )}
                </span>
                <Badge variant="secondary" className="mt-2">
                  {applicants} {applicants === 1 ? "Applicant" : "Applicants"}
                </Badge>
              </Link>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  type="button"
                  aria-label={`Delete ${job.title?.trim() || "job"}`}
                  onClick={() => setTarget(job)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
                <p className="text-xs text-muted-foreground">
                  {deadline ? `Deadline: ${deadline}` : "No deadline"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <RemoveDialog
        open={Boolean(target)}
        onOpenChange={(open) => (open ? null : setTarget(null))}
        busy={busy}
        onConfirm={() => void handleDelete()}
      />
      {kyc.fallback}
    </>
  );
}
