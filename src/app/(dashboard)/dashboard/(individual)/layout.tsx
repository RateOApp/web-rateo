import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/current-user";

/** Individual-only pages under /dashboard. */
export default async function IndividualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/login");
  if (user.role !== "individual") redirect("/dashboard");

  return <>{children}</>;
}
