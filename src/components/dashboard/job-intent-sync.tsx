"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MY_INTERESTS_KEY } from "@/hooks/use-my-interests";
import { SAVED_JOBS_KEY } from "@/hooks/use-saved-jobs";
import { clearPendingJobs, readPendingJobs, toIntentPayload } from "@/lib/job-intent";
import { jobsService } from "@/services/jobs";

/**
 * Flushes jobs a visitor picked while signed out (email login, SSO callback or
 * a returning session all end up in the dashboard). Verified users get them
 * applied immediately; everyone else has them stored for the KYC approval.
 */
export function JobIntentSync() {
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const pending = readPendingJobs();
    if (pending.length === 0) return;

    jobsService
      .storeIntents(toIntentPayload(pending))
      .then((result) => {
        clearPendingJobs();
        if (!("applied" in result) || !result.applied) return;

        void queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
        void queryClient.invalidateQueries({ queryKey: MY_INTERESTS_KEY });

        const { saved, interested } = result.applied;
        const done = [...saved, ...interested];
        if (done.length === 0) return;
        if (done.length === 1 && done[0].title) {
          toast.success(
            saved.length
              ? `Saved ${done[0].title} to your jobs`
              : `Interest registered in ${done[0].title}`,
          );
        } else {
          toast.success(`${done.length} jobs saved for you`);
        }
      })
      .catch(() => {
        // Keep localStorage; the next mount retries.
      });
  }, [queryClient]);

  return null;
}
