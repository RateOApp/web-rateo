import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { DashboardProviders } from "@/components/dashboard/dashboard-providers";
import { UserProvider } from "@/providers/user-provider";
import { getCachedUser } from "@/lib/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/login");
  if (user.setupCompleted === false) redirect("/setup");

  return (
    <UserProvider user={user}>
      <AppHeader user={user} />
      {/* pb-20 clears the fixed 64px mobile tab bar. */}
      <main className="flex-1 bg-cream-50 pb-20 md:pb-0">
        <DashboardProviders>{children}</DashboardProviders>
      </main>
      <BottomTabs role={user.role} />
    </UserProvider>
  );
}
