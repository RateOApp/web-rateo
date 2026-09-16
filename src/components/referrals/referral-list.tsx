"use client";

import { Loader2, Users } from "lucide-react";
import { useState } from "react";

import { ReferralStatusChip } from "@/components/referrals/referral-status-chip";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useMyReferralList } from "@/hooks/use-referrals";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReferralStatus, ReferredUser } from "@/types/referrals";

type Filter = ReferralStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "void", label: "Void" },
];

const EMPTY_COPY: Record<Filter, { title: string; description: string }> = {
  all: {
    title: "No one has joined with your code yet",
    description: "Share your code — every person who signs up with it shows up here.",
  },
  pending: {
    title: "Nothing pending",
    description: "Referrals sit here until your friend finishes verification.",
  },
  verified: {
    title: "No verified referrals yet",
    description: "A referral counts once your friend completes verification.",
  },
  void: {
    title: "No voided referrals",
    description: "Referrals only end up here when an admin voids them.",
  },
};

function roleLabel(person: ReferredUser): string {
  return person.role === "company" ? "Company" : "Individual";
}

function Row({ person }: { person: ReferredUser }) {
  const name = person.name?.trim() || "Rate'O user";
  const joined = formatDate(person.createdAt);

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <UserAvatar
        user={
          person.role === "company"
            ? { companyName: name, avatar: person.avatar }
            : { firstName: name, avatar: person.avatar }
        }
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-900">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {roleLabel(person)}
          {joined ? ` · Joined ${joined}` : ""}
        </p>
      </div>
      <ReferralStatusChip status={person.status} />
    </li>
  );
}

/** The referred-people list: status filter, rows, and "Load more". */
export function ReferralList() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMyReferralList(filter);

  const people = data?.pages.flatMap((page) => page.referrals ?? []) ?? [];
  const total = data?.pages[0]?.total ?? people.length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand-900">
          People you referred
          {total ? <span className="ml-1.5 text-sm text-muted-foreground">({total})</span> : null}
        </h2>
      </div>

      <div
        role="group"
        aria-label="Filter referrals by status"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              filter === option.value
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-border bg-white text-brand-900 hover:bg-muted/60",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CardListSkeleton rows={3} />
      ) : people.length === 0 ? (
        <EmptyState
          icon={Users}
          title={EMPTY_COPY[filter].title}
          description={EMPTY_COPY[filter].description}
        />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {people.map((person) => (
              <Row key={person._id} person={person} />
            ))}
          </ul>

          {hasNextPage ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
