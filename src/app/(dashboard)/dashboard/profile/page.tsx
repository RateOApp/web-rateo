import type { Metadata } from "next";
import { User } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <PageContainer>
      <PageHeader title="Profile" description="Your Rate’O profile as others see it." />
      <EmptyState
        icon={User}
        title="Profile"
        description="Coming in Phase 4/5."
      />
    </PageContainer>
  );
}
