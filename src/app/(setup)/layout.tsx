import { redirect } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { SetupLogoutButton } from "@/components/setup/logout-button";
import { UserProvider } from "@/providers/user-provider";
import { getCachedUser } from "@/lib/current-user";

/**
 * `/setup` lives in its own group so the dashboard's `setupCompleted === false`
 * redirect can never bounce back into itself.
 *
 * The guard is the mirror image of the dashboard's: anyone whose setup is
 * already done (or who predates the flag) is sent to `/dashboard`, so a
 * finished user can never re-enter the wizard and overwrite their profile.
 */
export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/login");
  if (user.setupCompleted !== false) redirect("/dashboard");

  return (
    <UserProvider user={user}>
      <main className="flex flex-1 flex-col bg-cream-50 px-4 py-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <Logo height={28} priority />
          <SetupLogoutButton />
        </div>
        <div className="mx-auto mt-6 w-full max-w-lg">{children}</div>
      </main>
    </UserProvider>
  );
}
