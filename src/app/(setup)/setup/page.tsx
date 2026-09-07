import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CompanySetup } from "@/components/setup/company-setup";
import { IndividualSetup } from "@/components/setup/individual-setup";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Finish setting up",
};

/**
 * Role-aware wizard entry point. The layout has already proved the user exists
 * and still needs setup; `getCachedUser` is memoised per request, so reading it
 * again here is free.
 */
export default async function SetupPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return user.role === "company" ? (
    <CompanySetup user={user} />
  ) : (
    <IndividualSetup user={user} />
  );
}
