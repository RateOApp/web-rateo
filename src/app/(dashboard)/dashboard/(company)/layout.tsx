import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/current-user";

/** Company-only pages under /dashboard. */
export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/login");
  if (user.role !== "company") redirect("/dashboard");

  return <>{children}</>;
}
