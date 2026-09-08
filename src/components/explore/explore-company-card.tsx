import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { CompanyCard } from "@/components/companies/company-card";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/api";

/**
 * The directory card as the dashboard shows it: the public card plus a
 * **Message** shortcut into the thread.
 *
 * The button only renders for a verified viewer, because `POST /messages` is
 * behind `requireKycVerified` server-side - offering it earlier would just
 * walk the user into a 403.
 */
export function ExploreCompanyCard({
  company,
  verified,
}: {
  company: User;
  verified: boolean;
}) {
  return (
    <CompanyCard
      company={company}
      footer={
        verified ? (
          <Button asChild variant="outline" size="lg" className="h-9">
            <Link href={`/dashboard/messages/${company._id}`}>
              <MessageCircle aria-hidden="true" />
              Message
            </Link>
          </Button>
        ) : null
      }
    />
  );
}
