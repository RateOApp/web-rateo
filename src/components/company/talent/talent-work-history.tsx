"use client";

import { useMemo, useState } from "react";
import { Briefcase, Calendar, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/shared/star-rating";
import { formatDate } from "@/lib/format";
import type { ReviewItem } from "@/types/reviews";
import type { TalentExperience } from "@/types/candidates";

/**
 * A review's `comment` is stored as "Title\n\nBody" by the rating flow. Split
 * on the first newline; a comment without one becomes the body.
 */
export function parseComment(comment: string | undefined): {
  title: string;
  body: string;
} {
  const raw = (comment ?? "").trim();
  if (!raw) return { title: "Feedback", body: "" };
  const index = raw.indexOf("\n");
  if (index === -1) return { title: "Feedback", body: raw };
  return {
    title: raw.slice(0, index).trim() || "Feedback",
    body: raw.slice(index + 1).trim(),
  };
}

/** "Resigned — gave 30 days' notice" / "Resigned — immediate". */
function resignChip(entry: TalentExperience): string | null {
  if (entry.current || entry.endedBy !== "employee" || !entry.endMethod) return null;
  if (entry.endMethod === "notice") {
    return entry.noticeDays
      ? `Resigned — gave ${entry.noticeDays} days' notice`
      : "Resigned — gave notice";
  }
  return "Resigned — immediate";
}

/** `"3 Sep 2026 – Present"`. */
function period(entry: TalentExperience): string {
  const start = formatDate(entry.startDate) ?? "";
  const end = entry.current ? "Present" : (formatDate(entry.endDate) ?? "Present");
  return [start, end].filter(Boolean).join(" – ");
}

/**
 * Work history with the latest review from each employer attached, mirroring
 * the mobile applicant-details screen. Hidden reviews keep their lock copy;
 * older ones open in a dialog.
 */
export function TalentWorkHistory({
  experience,
  reviews,
}: {
  experience: TalentExperience[];
  reviews: ReviewItem[];
}) {
  const [openCompany, setOpenCompany] = useState<string | null>(null);

  // Group the candidate's reviews by the reviewing company, newest first.
  const byCompany = useMemo(() => {
    const map = new Map<string, ReviewItem[]>();
    for (const review of reviews) {
      const key = String(review.reviewer?._id ?? "");
      if (!key) continue;
      map.set(key, [...(map.get(key) ?? []), review]);
    }
    for (const [key, list] of map) {
      map.set(
        key,
        [...list].sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        ),
      );
    }
    return map;
  }, [reviews]);

  if (!experience.length) {
    return <p className="text-sm text-muted-foreground italic">No work history available</p>;
  }

  const openList = openCompany ? (byCompany.get(openCompany) ?? []) : [];

  return (
    <>
      <ul className="flex flex-col gap-3">
        {experience.map((entry, index) => {
          const companyKey = String(entry.companyId ?? "");
          const companyReviews = byCompany.get(companyKey) ?? [];
          const latest = companyReviews[0];
          const parsed = latest ? parseComment(latest.comment) : null;
          const chip = resignChip(entry);

          const companyLabel =
            entry.company?.trim() ||
            latest?.reviewer?.companyName?.trim() ||
            (entry.companyId ? "Company" : "Not in employment");

          return (
            <li
              key={entry._id ?? `${companyLabel}-${index}`}
              className="rounded-2xl border border-border bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-semibold text-brand-900">
                  {companyLabel}
                </p>
                {chip ? (
                  <Badge variant="secondary" className="max-w-full truncate">
                    {chip}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase aria-hidden="true" className="size-4" />
                  {entry.title?.trim() || "Role"}
                </span>
                <span aria-hidden="true">&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar aria-hidden="true" className="size-4" />
                  {period(entry)}
                </span>
              </div>

              {latest && parsed ? (
                <>
                  <hr className="my-3 border-border" />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold text-brand-900">
                      {latest.isCurrentEmployee && !latest.commentHidden
                        ? "Review Hidden"
                        : parsed.title}
                    </p>
                    <StarRating value={latest.rating ?? 0} size={16} />
                  </div>

                  {latest.commentHidden ? (
                    <HiddenNote text="Feedback hidden — this user hasn't completed their monthly rating." />
                  ) : latest.isCurrentEmployee ? (
                    <HiddenNote text="Review hidden — revealed when the contract ends." />
                  ) : parsed.body ? (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {parsed.body}
                    </p>
                  ) : null}

                  {companyReviews.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setOpenCompany(companyKey)}
                      className="mt-3 flex items-center gap-1 rounded text-sm font-semibold text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      View more comments ({companyReviews.length})
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>

      <Dialog
        open={openCompany !== null}
        onOpenChange={(next) => {
          if (!next) setOpenCompany(null);
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {openList[0]?.reviewer?.companyName?.trim() || "Reviews"}
            </DialogTitle>
          </DialogHeader>

          <ul className="flex flex-col gap-4">
            {openList.map((review) => {
              const parsed = parseComment(review.comment);
              return (
                <li key={review._id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-brand-900">{parsed.title}</p>
                    <StarRating value={review.rating ?? 0} size={14} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(review.createdAt) ?? ""}
                  </p>
                  {review.commentHidden ? (
                    <HiddenNote text="Feedback hidden — this user hasn't completed their monthly rating." />
                  ) : review.isCurrentEmployee ? (
                    <HiddenNote text="Review hidden — revealed when the contract ends." />
                  ) : parsed.body ? (
                    <p className="mt-2 text-sm text-muted-foreground">{parsed.body}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HiddenNote({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
