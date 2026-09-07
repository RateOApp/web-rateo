import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { DojahWidget } from "@/components/kyc/dojah-widget";

export const metadata: Metadata = {
  title: "Verify your identity",
};

export default function DojahKycPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Verify your identity"
        description="NIN and a live selfie, checked instantly."
      />
      <DojahWidget />
    </PageContainer>
  );
}
