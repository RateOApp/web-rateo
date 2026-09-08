import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanyRatings } from "@/components/company/ratings/company-ratings";
import { IndividualRatings } from "@/components/ratings/individual-ratings";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Ratings",
};

/** Shared route: each role's two rating tabs live at the same URL. */
export default async function RatingsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  if (user.role === "company") return <CompanyRatings user={user} />;

  return <IndividualRatings />;
}
