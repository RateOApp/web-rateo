import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExploreJobs } from "@/components/explore/explore-jobs";
import { getCachedUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Jobs",
};

export default async function ExploreJobsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return <ExploreJobs user={user} />;
}
