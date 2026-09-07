import Link from "next/link";
import { ParticipationChip } from "@/components/dashboard/participation-chip";
import { ParticipationRing } from "@/components/dashboard/participation-ring";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { compareTopRated, formatRating } from "@/lib/rating";
import type { User } from "@/types/api";

/**
 * The five best-ranked companies on the first page, by the same
 * rating + participation blend the mobile app uses (`topRatedScore`), so a
 * five-star company that stops rating its people cannot camp at the top.
 */
export function TopRatedCompanies({ companies }: { companies: User[] }) {
  const top = [...companies].sort(compareTopRated).slice(0, 5);
  if (!top.length) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-brand-900">Top rated companies</h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {top.map((company) => (
          <li key={company._id} className="w-56 shrink-0 snap-start">
            <Link
              href={`/companies/${company._id}`}
              className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <UserAvatar user={company} size="lg" />
              <p className="truncate font-semibold text-brand-900">
                {company.companyName?.trim() || "Unnamed company"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {company.industry?.trim() || "General"}
              </p>
              <StarRating
                value={company.overallRating ?? 0}
                label={formatRating(company.overallRating)}
              />
              <div className="mt-auto flex items-center gap-2 pt-2">
                <ParticipationRing
                  score={company.participationScore ?? null}
                  status={company.participationStatus ?? null}
                  size={34}
                  percent
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Participation</p>
                  <ParticipationChip
                    score={company.participationScore ?? null}
                    status={company.participationStatus ?? null}
                    showNotEstablished
                  />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
