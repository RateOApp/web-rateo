"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationsList } from "@/components/saved/applications-list";
import { InterestsList } from "@/components/saved/interests-list";
import { SavedJobsList } from "@/components/saved/saved-jobs-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppliedJobs } from "@/hooks/use-applied-jobs";
import { useMyInterests } from "@/hooks/use-my-interests";
import { useSavedJobs } from "@/hooks/use-saved-jobs";
import { parseSavedTab, type SavedTab } from "@/components/saved/saved-tab";


const TAB_ROUTES: Record<SavedTab, string> = {
  applications: "/dashboard/saved",
  saved: "/dashboard/saved?tab=saved",
  interested: "/dashboard/saved?tab=interested",
};

/**
 * Applications / Saved Jobs / Interested, with counts on all three tabs - so
 * every list loads, unlike the mobile app which only fetches the visible one.
 * The active tab is mirrored into `?tab=` so the view survives a refresh or a
 * shared link.
 */
export function SavedTabs({ initialTab }: { initialTab: SavedTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<SavedTab>(initialTab);

  const applications = useAppliedJobs();
  const saved = useSavedJobs();
  const interests = useMyInterests();

  const applicationCount = applications.data?.length ?? 0;
  const savedCount = saved.data?.length ?? 0;
  const interestCount = interests.data?.length ?? 0;

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        const next = parseSavedTab(value);
        setTab(next);
        router.replace(TAB_ROUTES[next], { scroll: false });
      }}
    >
      <TabsList className="mb-4 w-full">
        <TabsTrigger value="applications" className="flex-1 gap-2">
          Applications
          {applicationCount > 0 ? <Count value={applicationCount} /> : null}
        </TabsTrigger>
        <TabsTrigger value="saved" className="flex-1 gap-2">
          Saved Jobs
          {savedCount > 0 ? <Count value={savedCount} /> : null}
        </TabsTrigger>
        <TabsTrigger value="interested" className="flex-1 gap-2">
          Interested
          {interestCount > 0 ? <Count value={interestCount} /> : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="applications">
        <ApplicationsList />
      </TabsContent>
      <TabsContent value="saved">
        <SavedJobsList />
      </TabsContent>
      <TabsContent value="interested">
        <InterestsList />
      </TabsContent>
    </Tabs>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-[11px] leading-5 font-bold text-white tabular-nums">
      {value}
    </span>
  );
}
