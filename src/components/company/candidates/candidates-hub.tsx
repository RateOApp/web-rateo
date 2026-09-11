"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseCandidatesTab, type CandidatesTab } from "@/components/company/candidates/candidates-tab";
import { ManageApplications } from "@/components/company/candidates/manage-applications";
import { SavedTalents } from "@/components/company/candidates/saved-talents";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


/**
 * The candidates hub: the company's job posts on one tab, its saved talents on
 * the other. The active tab is mirrored into `?tab=` so the view survives a
 * refresh or a shared link.
 */
export function CandidatesHub({ initialTab }: { initialTab: CandidatesTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<CandidatesTab>(initialTab);

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Your job postings and the talent you saved."
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = parseCandidatesTab(value);
          setTab(next);
          router.replace(
            next === "saved" ? "/dashboard/candidates?tab=saved" : "/dashboard/candidates",
            { scroll: false },
          );
        }}
      >
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="applications" className="flex-1">
            Manage applications
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">
            Saved talents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <ManageApplications />
        </TabsContent>
        <TabsContent value="saved">
          <SavedTalents />
        </TabsContent>
      </Tabs>
    </>
  );
}
