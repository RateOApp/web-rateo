"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationsList } from "@/components/saved/applications-list";
import { SavedJobsList } from "@/components/saved/saved-jobs-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppliedJobs } from "@/hooks/use-applied-jobs";
import { useSavedJobs } from "@/hooks/use-saved-jobs";

export type SavedTab = "applications" | "saved";

export function parseSavedTab(value: string | undefined): SavedTab {
  return value === "saved" ? "saved" : "applications";
}

/**
 * Applications / Saved Jobs, with counts on both tabs - so both lists load,
 * unlike the mobile app which only fetches the visible one. The active tab is
 * mirrored into `?tab=` so the view survives a refresh or a shared link.
 */
export function SavedTabs({ initialTab }: { initialTab: SavedTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<SavedTab>(initialTab);

  const applications = useAppliedJobs();
  const saved = useSavedJobs();

  const applicationCount = applications.data?.length ?? 0;
  const savedCount = saved.data?.length ?? 0;

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        const next = parseSavedTab(value);
        setTab(next);
        router.replace(next === "saved" ? "/dashboard/saved?tab=saved" : "/dashboard/saved", {
          scroll: false,
        });
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
      </TabsList>

      <TabsContent value="applications">
        <ApplicationsList />
      </TabsContent>
      <TabsContent value="saved">
        <SavedJobsList />
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
