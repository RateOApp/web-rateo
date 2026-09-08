import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { DojahWidget } from "@/components/kyc/dojah-widget";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Verify your identity",
};

/**
 * The hosted Dojah widget, for whichever flow the signed-in account needs.
 *
 * The company method step links here as `?flow=business`, but the role is what
 * actually selects the product: a query string must not be able to push an
 * individual into a CAC check, and a company arriving without the parameter
 * (a bookmark, a back button) must still get the business widget.
 */
export default async function DojahKycPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const isCompany = user.role === "company";

  return (
    <PageContainer>
      <PageHeader
        title={isCompany ? "Verify your business" : "Verify your identity"}
        description={
          isCompany
            ? "CAC records and a director check, done instantly."
            : "NIN and a live selfie, checked instantly."
        }
      />
      <DojahWidget flow={isCompany ? "business" : "individual"} />
    </PageContainer>
  );
}
