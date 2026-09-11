"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, CloudOff } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { FeedCard } from "@/components/feed/feed-card";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { JOB_FEED_KEY } from "@/hooks/use-jobs";
import { MY_INTERESTS_KEY, useMyInterests } from "@/hooks/use-my-interests";
import { SAVED_JOBS_KEY } from "@/hooks/use-saved-jobs";
import { getApiErrorMessage } from "@/lib/api/client";
import { sortByMatch } from "@/lib/job-match";
import { jobsService } from "@/services/jobs";
import { isImportedJob, type AnyJob, type Job, type JobsResponse, type User } from "@/types/api";

type JobFeedProps = {
  user: User;
  /** Pre-fetched feed. When given, no request is made (used by scratch pages). */
  initialData?: JobsResponse;
};

export function JobFeed({ user, initialData }: JobFeedProps) {
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // The feed only ever renders for a signed-in individual (see individual-home),
  // so this is always enabled - companies never reach it.
  const myInterests = useMyInterests();

  const query = useQuery({
    queryKey: JOB_FEED_KEY,
    queryFn: () => jobsService.feed(),
    enabled: !initialData,
    staleTime: 60_000,
  });

  const data = initialData ?? query.data;

  // Non-empty `categories` in the response means the server applied the user's
  // saved industries, which changes the empty-state copy.
  const hasPreferences = (data?.categories ?? []).length > 0;

  const ranked = useMemo(() => {
    const jobs = data?.jobs ?? [];
    return sortByMatch(jobs, user).filter((entry) => !dismissed.includes(entry.job._id));
  }, [data, user, dismissed]);

  function dismiss(id: string) {
    setDismissed((previous) => (previous.includes(id) ? previous : [...previous, id]));
  }

  async function handleLike(job: AnyJob) {
    if (pendingId) return;

    if (isImportedJob(job)) {
      // Already interested? The flag on the card (or the cached list) answers
      // without a round trip, like the app does for saved jobs.
      const already =
        job.hasRegisteredInterest ||
        myInterests.data?.some((entry) => entry.job?._id === job._id);
      if (already) {
        toast.info("Already registered", {
          description: "You showed interest in this job before",
        });
        dismiss(job._id);
        return;
      }

      setPendingId(job._id);
      try {
        const result = await jobsService.expressInterest(job._id);
        if (result.alreadyRegistered) {
          toast.info("Already registered", {
            description: "You showed interest in this job before",
          });
        } else {
          toast.success("Interest registered", {
            description: "We'll notify you if the employer joins Rate'O",
          });
        }
        void queryClient.invalidateQueries({ queryKey: MY_INTERESTS_KEY });
        dismiss(job._id);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not register interest"));
      } finally {
        setPendingId(null);
      }
      return;
    }

    // Already saved? The cache answers without a round trip, like the app.
    const saved = queryClient.getQueryData<Job[]>(SAVED_JOBS_KEY);
    if (saved?.some((entry) => entry._id === job._id)) {
      toast.info("Job already saved");
      dismiss(job._id);
      return;
    }

    setPendingId(job._id);
    try {
      await jobsService.save(job._id);
      toast.success("Job saved");
      void queryClient.invalidateQueries({ queryKey: SAVED_JOBS_KEY });
      dismiss(job._id);
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not save job");
      if (/kyc|verif/i.test(message)) kyc.open();
      else if (/already/i.test(message)) {
        toast.info("Job already saved");
        dismiss(job._id);
      } else toast.error(message);
    } finally {
      setPendingId(null);
    }
  }

  if (!initialData && query.isLoading) {
    return <CardListSkeleton rows={2} />;
  }

  if (!initialData && query.isError) {
    return (
      <EmptyState
        icon={CloudOff}
        title="Something went wrong"
        description="We couldn't load jobs. Check your connection and try again."
        action={
          <Button
            size="lg"
            className="h-11 bg-accent-600 text-white"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        }
      />
    );
  }

  if (!ranked.length) {
    return hasPreferences ? (
      <EmptyState
        icon={Briefcase}
        title="No jobs in your industries right now"
        description="Check back soon, or browse everything that's open right now."
        action={
          <Button asChild size="lg" className="h-11 bg-accent-600 text-white">
            <Link href="/dashboard/explore/jobs">Browse all jobs</Link>
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Briefcase}
        title="You're all caught up"
        description="There are no more job opportunities to swipe on right now. Check back soon or explore top-rated companies."
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {ranked.map(({ job, match }) => (
          <li key={job._id} className="flex">
            <FeedCard
              job={job}
              match={match}
              pending={pendingId === job._id}
              onPass={() => dismiss(job._id)}
              onLike={() => void handleLike(job)}
              className="w-full"
            />
          </li>
        ))}
      </ul>
      {kyc.fallback}
    </>
  );
}
