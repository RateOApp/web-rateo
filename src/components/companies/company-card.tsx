import Link from "next/link";
import { MapPin } from "lucide-react";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { formatRating, kycBadgeStatus, participationLabel } from "@/lib/rating";
import { cn } from "@/lib/utils";
import type { User } from "@/types/api";

/**
 * One row in the company directory. Renders only public fields - the listing
 * endpoint also returns email, phone, kycDocuments and verification codes,
 * which must never reach the page.
 *
 * `footer` is the slot the dashboard uses for its **Message** shortcut; the
 * public directory passes nothing and the card renders exactly as before.
 */
export function CompanyCard({
  company,
  className,
  footer,
}: {
  company: User;
  className?: string;
  footer?: React.ReactNode;
}) {
  const name = company.companyName?.trim() || "Unnamed company";
  const rating = company.overallRating ?? 0;
  const participation = participationLabel(company.participationStatus);

  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-100 sm:p-5",
        className,
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <UserAvatar user={company} size="lg" className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold text-brand-900 sm:text-lg">
              <Link
                href={`/companies/${company._id}`}
                className="rounded transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {name}
              </Link>
            </h3>
            {company.isOg ? (
              <Badge className="bg-accent-600 text-white" title="Original Gangster - early Rate'O company">
                OG
              </Badge>
            ) : null}
          </div>

          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {company.industry?.trim() || "General"}
          </p>

          {company.location?.trim() ? (
            <p className="mt-1 flex items-center gap-1 text-sm break-words text-muted-foreground">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              {company.location.trim()}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <StarRating value={rating} label={formatRating(company.overallRating)} />
            <VerifiedBadge status={kycBadgeStatus(company)} />
            {participation ? (
              <Badge variant="outline" className="text-muted-foreground">
                {participation}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {footer ? <div className="mt-3 flex flex-wrap justify-end gap-2">{footer}</div> : null}
    </article>
  );
}
