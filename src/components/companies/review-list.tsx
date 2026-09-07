import { EyeOff } from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import { formatDate, toDate } from "@/lib/format";
import type { Review } from "@/types/api";

/**
 * Comments are stored as `"title\n\nbody"` by the mobile rating flow. A single
 * paragraph becomes the title with no body, matching the app.
 */
function splitComment(comment: string | undefined): { title: string; body: string } {
  const parts = (comment ?? "").split("\n\n");
  const title = parts[0]?.trim() ?? "";
  const body = parts.slice(1).join("\n\n").trim();
  return { title, body };
}

function ReviewItem({ review }: { review: Review }) {
  const { title, body } = splitComment(review.comment);
  const date = formatDate(review.createdAt);

  return (
    <article className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating value={review.rating ?? 0} />
        {date ? <span className="text-xs text-muted-foreground">{date}</span> : null}
      </div>

      {review.isCurrentEmployee ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground italic">
          <EyeOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Review hidden until this employment ends.
        </p>
      ) : (
        <>
          {title ? <p className="mt-3 font-semibold text-brand-900">{title}</p> : null}
          {body ? (
            <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{body}</p>
          ) : null}
          {!title && !body ? (
            <p className="mt-3 text-sm text-muted-foreground">No comment left.</p>
          ) : null}
        </>
      )}
    </article>
  );
}

/** Newest first. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  const sorted = [...reviews].sort((a, b) => {
    const left = toDate(b.createdAt)?.getTime() ?? 0;
    const right = toDate(a.createdAt)?.getTime() ?? 0;
    return left - right;
  });

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((review) => (
        <li key={review._id}>
          <ReviewItem review={review} />
        </li>
      ))}
    </ul>
  );
}
