import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanyHome } from "@/components/company/home/company-home";
import { IndividualHome } from "@/components/feed/individual-home";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardHomePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  if (user.role === "company") return <CompanyHome user={user} />;

  return <IndividualHome user={user} />;
}
