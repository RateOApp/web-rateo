"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Users } from "lucide-react";
import { toast } from "sonner";

import { AcceptDialog } from "@/components/company/jobs/accept-dialog";
import { ApplicantRow } from "@/components/company/jobs/applicant-row";
import { useKycGate, useParticipationLock } from "@/components/dashboard/dashboard-providers";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobApplicantsKey, useJobApplicants } from "@/hooks/use-job-applicants";
import { useJob } from "@/hooks/use-jobs";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate, formatSalaryRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { jobsService } from "@/services/jobs";
import { isImportedJob, type Job } from "@/types/api";
import type { ApplicantStatus, JobApplicantRow } from "@/types/company-jobs";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function JobSummary({ job, applicants }: { job: Job; applicants: number }) {
  const salary = formatSalaryRange(job.minSalary, job.maxSalary);
  const deadline = formatDate(job.deadline);

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-brand-900">
            {job.title?.trim() || "Untitled role"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-brand-900">
            {salary}
            {salary === "Negotiable" ? null : (
              <span className="font-medium text-muted-foreground">/month</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Deadline: {deadline ?? "No deadline"}
          </p>
        </div>

        <Button asChild variant="ghost" size="icon-sm" className="shrink-0 text-brand-700">
          <Link href={`/dashboard/jobs/${job._id}/edit`} aria-label="Edit this job">
            <Pencil aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-900">
        <Users aria-hidden="true" className="size-4" />
        {applicants} Applicant{applicants === 1 ? "" : "s"}
      </span>
    </div>
  );
}

/**
 * The applicants list for one job.
 *
 * Status changes are optimistic against `['jobApplicants', id]` and roll back
 * on failure. Accepting hires the candidate, so it asks first, pre-empts an
 * overdue participation lock, and refreshes `['companyEmployees']` - the list
 * the new employee shows up in.
 */
export function ApplicantsList({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const lock = useParticipationLock();

  const jobQuery = useJob(jobId);
  const { data, isLoading, isError } = useJobApplicants(jobId);

  const [filter, setFilter] = useState<Filter>("all");
  const [pendingAccept, setPendingAccept] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(
    () => (data ?? []).filter((row): row is JobApplicantRow & { applicant: NonNullable<JobApplicantRow["applicant"]> } => Boolean(row.applicant)),
    [data],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rows.length };
    for (const row of rows) {
      const status = row.status ?? "pending";
      map[status] = (map[status] ?? 0) + 1;
    }
    return map;
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((row) => (row.status ?? "pending") === filter)),
    [rows, filter],
  );

  const mutation = useMutation({
    mutationFn: ({ applicantId, status }: { applicantId: string; status: ApplicantStatus }) =>
      jobsService.updateApplicantStatus(jobId, applicantId, status),

    onMutate: async ({ applicantId, status }) => {
      setBusyId(applicantId);
      const key = jobApplicantsKey(jobId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JobApplicantRow[]>(key);
      queryClient.setQueryData<JobApplicantRow[]>(key, (old) =>
        (old ?? []).map((row) =>
          row.applicant?._id === applicantId ? { ...row, status } : row,
        ),
      );
      return { previous };
    },

    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(jobApplicantsKey(jobId), context.previous);
      }
      // A 403 `PARTICIPATION_OVERDUE` already opened the lock dialog through
      // the axios interceptor; the message still needs saying.
      toast.error(getApiErrorMessage(error, "Failed to update status"));
    },

    onSettled: () => {
      setBusyId(null);
      void queryClient.invalidateQueries({ queryKey: jobApplicantsKey(jobId) });
      void queryClient.invalidateQueries({ queryKey: ["companyEmployees"] });
    },
  });

  function handleAcceptRequest(applicantId: string) {
    if (!kyc.requireVerified()) return;
    if (lock.isOverdue) {
      lock.open();
      return;
    }
    setPendingAccept(applicantId);
  }

  function confirmAccept() {
    const applicantId = pendingAccept;
    setPendingAccept(null);
    if (!applicantId) return;
    mutation.mutate({ applicantId, status: "accepted" });
  }

  const job = jobQuery.data && !isImportedJob(jobQuery.data) ? jobQuery.data : null;

  return (
    <div className="flex flex-col gap-4">
      {job ? (
        <JobSummary job={job} applicants={rows.length} />
      ) : (
        <Skeleton className="h-36 rounded-2xl" />
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter applicants">
        {FILTERS.map((entry) => {
          const active = filter === entry.value;
          const count = counts[entry.value] ?? 0;
          return (
            <button
              key={entry.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(entry.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-border bg-white text-brand-900 hover:bg-muted",
              )}
            >
              {entry.label}
              {count > 0 ? <span className="ml-1.5 tabular-nums">{count}</span> : null}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <CardListSkeleton rows={3} />
      ) : isError ? (
        <EmptyState
          icon={Users}
          title="Something went wrong"
          description="We couldn't load the applicants for this job. Check your connection and try again."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={rows.length === 0 ? "No applicants yet" : `No ${filter} applicants`}
          description={
            rows.length === 0
              ? "Applicants will show up here as soon as they apply."
              : "Nothing in this filter right now."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((row) => (
            <ApplicantRow
              key={row.applicant._id}
              jobId={jobId}
              applicant={row.applicant}
              status={row.status ?? "pending"}
              busy={busyId === row.applicant._id}
              onAccept={() => handleAcceptRequest(row.applicant._id)}
              onDecline={() =>
                // The mobile app sends 'declined', which no reader understands;
                // 'rejected' is the value the server and every list filter use.
                mutation.mutate({ applicantId: row.applicant._id, status: "rejected" })
              }
            />
          ))}
        </ul>
      )}

      <AcceptDialog
        open={Boolean(pendingAccept)}
        onOpenChange={(next) => (next ? null : setPendingAccept(null))}
        onConfirm={confirmAccept}
        busy={mutation.isPending}
      />
    </div>
  );
}
