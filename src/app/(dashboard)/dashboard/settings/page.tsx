import type { Metadata } from "next";
import { SettingsMenu } from "@/components/settings/settings-menu";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Account, password and notification preferences."
      />
      <SettingsMenu />
    </PageContainer>
  );
}
