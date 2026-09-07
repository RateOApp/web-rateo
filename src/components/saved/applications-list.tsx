"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RemoveDialog } from "@/components/saved/remove-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLIED_JOBS_KEY, useAppliedJobs } from "@/hooks/use-applied-jobs";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatSalaryRange, jobCompanyName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { jobsService } from "@/services/jobs";
import {
  applicationLabel,
  applicationTone,
  isApplicationRemovable,
} from "@/types/dashboard";
import type { JobApplication } from "@/types/api";

const TONE_CLASSES = {
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
  warning: "bg-accent-50 text-accent-600",
} as const;

export function ApplicationsList() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAppliedJobs();
  const [target, setTarget] = useState<JobApplication | null>(null);
  const [busy, setBusy] = useState(false);

  const applications = data ?? [];

  async function handleRemove() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await jobsService.withdraw(target.job._id);
      queryClient.setQueryData<JobApplication[]>(APPLIED_JOBS_KEY, (old) =>
        Array.isArray(old) ? old.filter((entry) => entry._id !== target._id) : old,
      );
      setTarget(null);
      toast.success("Application removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove"));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <CardListSkeleton rows={3} />;

  if (!applications.length) {
    return (
      <EmptyState
        icon={FileText}
        title="You don't have any applications yet."
        description="Start applying to jobs to see them here."
        action={
          <Button asChild size="lg" className="h-11 bg-brand-700 text-white">
            <Link href="/dashboard/explore/jobs">Find jobs to apply</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {applications.map((application) => {
          const job = application.job;
          const tone = applicationTone(application.status);
          const removable = isApplicationRemovable(application.status);
          const salary = formatSalaryRange(job.minSalary, job.maxSalary);

          return (
            <li
              key={application._id}
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
                <p className="truncate text-sm text-muted-foreground">{jobCompanyName(job)}</p>
                <p className="mt-1 text-sm font-semibold text-brand-900">
                  {salary}
                  {salary === "Negotiable" ? null : (
                    <span className="font-medium text-muted-foreground">/month</span>
                  )}
                </p>
                {job.type?.trim() ? (
                  <Badge variant="secondary" className="mt-2">
                    {job.type.trim()}
                  </Badge>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    TONE_CLASSES[tone],
                  )}
                >
                  {applicationLabel(application.status)}
                </span>
                {removable ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove application for ${job.title?.trim() || "this role"}`}
                    onClick={() => setTarget(application)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                ) : null}
              </div>
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
