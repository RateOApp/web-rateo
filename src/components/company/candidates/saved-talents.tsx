"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Search, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RemoveDialog } from "@/components/saved/remove-dialog";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { SAVED_CANDIDATES_KEY, useSavedCandidates } from "@/hooks/use-saved-candidates";
import { getApiErrorMessage } from "@/lib/api/client";
import { formatRating } from "@/lib/rating";
import { candidatesService } from "@/services/candidates";
import type { User } from "@/types/api";
import {
  blockedUserIds,
  candidateName,
  candidateTitleLabel,
  type Candidate,
} from "@/types/candidates";

/**
 * "Saved talents": `GET /users/saved`, minus anyone this company has blocked
 * (the endpoint does not filter them out - the mobile screen does it locally).
 */
export function SavedTalents() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const query = useSavedCandidates();

  const [target, setTarget] = useState<Candidate | null>(null);
  const [busy, setBusy] = useState(false);

  const talents = useMemo(() => {
    const blocked = blockedUserIds(me);
    return (query.data ?? []).filter((talent) => !blocked.includes(String(talent._id)));
  }, [query.data, me]);

  async function handleRemove() {
    if (!target || busy) return;
    setBusy(true);
    try {
      await candidatesService.unsave(target._id);
      queryClient.setQueryData<User[]>(SAVED_CANDIDATES_KEY, (old) =>
        Array.isArray(old) ? old.filter((entry) => entry._id !== target._id) : old,
      );
      setTarget(null);
      toast.success("Removed successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove candidate"));
    } finally {
      setBusy(false);
    }
  }

  if (query.isLoading) return <CardListSkeleton rows={3} />;

  if (!talents.length) {
    return (
      <EmptyState
        icon={Heart}
        title="You don't have any saved talents yet."
        description="Swipe right to save talents faster."
        action={
          <Button asChild size="lg" className="h-11 bg-accent-600 text-white">
            <Link href="/dashboard/explore">
              <Search aria-hidden="true" />
              Find great candidates
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {talents.map((talent) => (
          <li
            key={talent._id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 sm:p-4"
          >
            <Link
              href={`/dashboard/talent/${talent._id}`}
              className="flex min-w-0 flex-1 items-center gap-3 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <UserAvatar user={talent} size="default" className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-muted-foreground">
                  {candidateTitleLabel(talent)}
                </span>
                <span className="block truncate font-semibold text-brand-900">
                  {candidateName(talent)}
                </span>
              </span>
            </Link>

            <StarRating
              value={talent.overallRating ?? 0}
              size={14}
              label={formatRating(talent.overallRating)}
              className="shrink-0"
            />

            <button
              type="button"
              aria-label={`Remove ${candidateName(talent)}`}
              onClick={() => setTarget(talent)}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          </li>
        ))}
      </ul>

      <RemoveDialog
        open={Boolean(target)}
        onOpenChange={(open) => (open ? null : setTarget(null))}
        busy={busy}
        onConfirm={() => void handleRemove()}
      />
    </>
  );
}
