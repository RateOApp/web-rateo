"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { JobForm } from "@/components/company/jobs/job-form";
import {
  jobFormDefaults,
  toJobPayload,
  type JobFormValues,
} from "@/components/company/jobs/job-form-schema";
import { PostSuccess } from "@/components/company/jobs/post-success";
import { useKycGate, useParticipationLock } from "@/components/dashboard/dashboard-providers";
import { useMe } from "@/hooks/use-me";
import { MY_JOBS_KEY } from "@/hooks/use-my-jobs";
import { getApiErrorMessage } from "@/lib/api/errors";
import { jobsService } from "@/services/jobs";

/**
 * `POST /jobs`.
 *
 * Both gates are pre-empted here rather than letting the request fail: an
 * unverified company never reaches the endpoint, and an overdue rating opens
 * the unlock dialog straight away (the backend would 403 with
 * `PARTICIPATION_OVERDUE` anyway).
 */
export function PostJob() {
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const lock = useParticipationLock();
  const { data: user } = useMe();

  const [posted, setPosted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // The company's own industry seeds the picker, as on mobile.
  const defaultValues = useMemo(() => jobFormDefaults(null, user?.industry), [user?.industry]);

  async function handleSubmit(values: JobFormValues) {
    setServerError(null);
    if (!kyc.requireVerified()) return;
    if (lock.isOverdue) {
      lock.open();
      return;
    }

    try {
      await jobsService.create(toJobPayload(values));
      await queryClient.invalidateQueries({ queryKey: MY_JOBS_KEY });
      setPosted(true);
    } catch (error) {
      // A 403 `PARTICIPATION_OVERDUE` already opened the lock dialog through
      // the axios interceptor; the message still needs saying.
      const message = getApiErrorMessage(error, "Could not post this job");
      setServerError(message);
      toast.error(message);
    }
  }

  if (posted) return <PostSuccess />;

  return (
    <JobForm
      mode="create"
      defaultValues={defaultValues}
      submitLabel="Post job opening"
      pendingLabel="Posting…"
      serverError={serverError}
      onSubmit={handleSubmit}
    />
  );
}
