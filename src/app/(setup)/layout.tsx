import { redirect } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { UserProvider } from "@/providers/user-provider";
import { getCachedUser } from "@/lib/current-user";

/**
 * `/setup` lives in its own group so the dashboard's `setupCompleted === false`
 * redirect can never bounce back into itself. Auth check only.
 */
export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return (
    <UserProvider user={user}>
      <main className="flex flex-1 flex-col items-center bg-cream-50 px-4 py-10">
        <Logo height={30} className="mb-6" priority />
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          {children}
        </div>
      </main>
    </UserProvider>
  );
}
