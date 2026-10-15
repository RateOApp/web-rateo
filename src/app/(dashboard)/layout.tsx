import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { DashboardProviders } from "@/components/dashboard/dashboard-providers";
import { UserProvider } from "@/providers/user-provider";
import { getCachedUser } from "@/lib/current-user";
import { getImpersonation } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/login");
  if (user.setupCompleted === false) redirect("/setup");
  const impersonation = await getImpersonation();

  return (
    <UserProvider user={user}>
      {impersonation ? <ImpersonationBanner {...impersonation} /> : null}
      {/* Banner is fixed 2.25rem; pad below it and offset the sticky header. */}
      <div
        className="flex min-w-0 flex-1 flex-col"
        style={
          impersonation
            ? ({ paddingTop: "2.25rem", "--imp-banner-h": "2.25rem" } as React.CSSProperties)
            : undefined
        }
      >
        <AppHeader user={user} />
        {/* pb-20 clears the fixed 64px mobile tab bar. */}
        <main className="min-w-0 flex-1 bg-cream-50 pb-20 md:pb-0">
          <DashboardProviders>{children}</DashboardProviders>
        </main>
      </div>
      <BottomTabs role={user.role} />
    </UserProvider>
  );
}
