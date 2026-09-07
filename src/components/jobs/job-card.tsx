import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  jobCompanyName,
  jobMetaLine,
  timeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { isImportedJob, type AnyJob } from "@/types/api";

/**
 * One row in the jobs feed. Server-safe (no hooks, no handlers) so listings
 * stay fully server-rendered and crawlable.
 */
export function JobCard({ job, className }: { job: AnyJob; className?: string }) {
  const imported = isImportedJob(job);
  const companyName = jobCompanyName(job);
  const meta = jobMetaLine(job);
  const posted = timeAgo(job.createdAt);
  const closed = !imported && job.status === "closed";

  const badges = [job.workArrangement, job.category].filter(Boolean) as string[];

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-100 sm:p-5",
        className,
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <UserAvatar
          user={{ companyName, avatar: imported ? undefined : job.company?.avatar }}
          size="lg"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{companyName}</p>

          <h3 className="mt-0.5 text-base font-semibold text-brand-900 sm:text-lg">
            <Link
              href={`/jobs/${job._id}`}
              className="rounded transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {job.title?.trim() || "Untitled role"}
            </Link>
          </h3>

          {meta ? (
            <p className="mt-1 text-sm break-words text-muted-foreground">{meta}</p>
          ) : null}

          {badges.length || imported || closed ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="max-w-full truncate">
                  {badge}
                </Badge>
              ))}
              {imported ? (
                <Badge className="bg-accent-50 text-accent-600">Imported</Badge>
              ) : null}
              {closed ? <Badge variant="destructive">Closed</Badge> : null}
            </div>
          ) : null}

          {posted ? (
            <p className="mt-3 text-xs text-muted-foreground">Posted {posted}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
