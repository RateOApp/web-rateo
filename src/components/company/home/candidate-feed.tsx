"use client";

import { useMemo, useState } from "react";
import { CloudOff, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useKycGate } from "@/components/dashboard/dashboard-providers";
import { CandidateCard } from "@/components/company/home/candidate-card";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCandidates } from "@/hooks/use-candidates";
import { SAVED_CANDIDATES_KEY } from "@/hooks/use-saved-candidates";
import { getApiErrorMessage } from "@/lib/api/client";
import { companyMatchPrefs, sortByCandidateMatch } from "@/lib/candidate-match";
import { candidatesService } from "@/services/candidates";
import type { User, UsersResponse } from "@/types/api";
import type { Candidate } from "@/types/candidates";

type CandidateFeedProps = {
  user: User;
  /** Pre-fetched first page. When given, no request is made (scratch pages). */
  initialData?: UsersResponse;
};

/**
 * "Top candidates for you": the paged individual directory, scored client-side
 * with `computeCandidateMatch` and rendered as a Pass/Like list.
 */
export function CandidateFeed({ user, initialData }: CandidateFeedProps) {
  const queryClient = useQueryClient();
  const kyc = useKycGate();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const query = useCandidates();
  const fetched = query.candidates;

  const prefs = useMemo(() => companyMatchPrefs(user), [user]);

  const ranked = useMemo(() => {
    const live = initialData ? (initialData.users ?? []) : fetched;
    return sortByCandidateMatch(live, prefs).filter(
      (entry) => !dismissed.includes(entry.candidate._id),
    );
  }, [initialData, fetched, prefs, dismissed]);

  function dismiss(id: string) {
    setDismissed((previous) => (previous.includes(id) ? previous : [...previous, id]));
  }

  async function handleLike(candidate: Candidate) {
    if (pendingId) return;
    if (!kyc.requireVerified()) return;

    // Already saved? The cache answers without a round trip, like the app.
    const saved = queryClient.getQueryData<User[]>(SAVED_CANDIDATES_KEY);
    if (saved?.some((entry) => entry._id === candidate._id)) {
      toast.info("Candidate already saved");
      dismiss(candidate._id);
      return;
    }

    setPendingId(candidate._id);
    try {
      await candidatesService.save(candidate._id);
      toast.success("Candidate saved");
      void queryClient.invalidateQueries({ queryKey: SAVED_CANDIDATES_KEY });
      dismiss(candidate._id);
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not save candidate");
      if (/kyc|verif/i.test(message)) kyc.open();
      else if (/already/i.test(message)) {
        toast.info("Candidate already saved");
        dismiss(candidate._id);
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
        description="We couldn't load candidates. Check your connection and try again."
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
    return (
      <EmptyState
        icon={Users}
        title="No more candidates in this batch"
        description="You've swiped through all available candidates for now. Check back later or post a new job to attract more talent."
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {ranked.map(({ candidate, match }) => (
          <li key={candidate._id} className="flex">
            <CandidateCard
              candidate={candidate}
              match={match}
              pending={pendingId === candidate._id}
              onPass={() => dismiss(candidate._id)}
              onLike={() => void handleLike(candidate)}
              className="w-full"
            />
          </li>
        ))}
      </ul>

      {!initialData && query.hasNextPage ? (
        <Button
          variant="outline"
          size="lg"
          className="mt-4 h-11 w-full sm:w-auto"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more candidates"}
        </Button>
      ) : null}

      {kyc.fallback}
    </>
  );
}
