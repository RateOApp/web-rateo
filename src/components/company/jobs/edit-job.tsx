"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteJobDialog } from "@/components/company/jobs/delete-job-dialog";
import { JobForm } from "@/components/company/jobs/job-form";
import {
  jobFormDefaults,
  toJobPayload,
  type JobFormValues,
} from "@/components/company/jobs/job-form-schema";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useJob } from "@/hooks/use-jobs";
import { useMe } from "@/hooks/use-me";
import { MY_JOBS_KEY } from "@/hooks/use-my-jobs";
import { getApiErrorMessage } from "@/lib/api/errors";
import { toDateInputValue, todayInputValue } from "@/lib/constants/jobs";
import { jobsService } from "@/services/jobs";
import { isImportedJob, type Job } from "@/types/api";

/** `GET /jobs/:id` prefill, `PUT /jobs/:id` save, `DELETE /jobs/:id` remove. */
export function EditJob({ jobId }: { jobId: string }) {
  const { data, isLoading, isError } = useJob(jobId);

  if (isLoading) return <CardListSkeleton rows={3} />;

  if (isError || !data || isImportedJob(data)) {
    return (
      <EmptyState
        title="Job not found"
        description="This posting no longer exists, or it is not one of yours."
      />
    );
  }

  return <EditJobForm job={data} />;
}

function EditJobForm({ job }: { job: Job }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useMe();

  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // A job whose deadline has already passed keeps that date until the company
  // changes it - the picker only forbids moving a deadline further into the
  // past, never re-saving the one that is already stored.
  const stored = toDateInputValue(job.deadline);
  const today = todayInputValue();
  const earliestDeadline = stored && stored < today ? stored : today;

  async function handleSubmit(values: JobFormValues) {
    setServerError(null);
    try {
      await jobsService.update(job._id, toJobPayload(values, { includeStatus: true }));
      await queryClient.invalidateQueries({ queryKey: MY_JOBS_KEY });
      await queryClient.invalidateQueries({ queryKey: ["job", job._id] });
      toast.success("Job updated successfully");
      router.push("/dashboard/jobs");
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not update this job");
      setServerError(message);
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await jobsService.remove(job._id);
      await queryClient.invalidateQueries({ queryKey: MY_JOBS_KEY });
      setConfirmOpen(false);
      toast.success("Job deleted successfully");
      router.push("/dashboard/jobs");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete this job"));
      setDeleting(false);
    }
  }

  return (
    <>
      <JobForm
        mode="edit"
        defaultValues={jobFormDefaults(job, user?.industry)}
        earliestDeadline={earliestDeadline}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        serverError={serverError}
        onSubmit={handleSubmit}
        footer={
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={deleting}
            onClick={() => setConfirmOpen(true)}
            className="h-11 w-full border-destructive/40 text-destructive hover:bg-destructive/5"
          >
            {deleting ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            Delete Job
          </Button>
        }
      />

      <DeleteJobDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        busy={deleting}
      />
    </>
  );
}
