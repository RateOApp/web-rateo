import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Change password",
};

export default function ChangePasswordPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Change password"
        description="Use at least 8 characters with an uppercase letter, a lowercase letter and a number."
      />
      <ChangePasswordForm />
    </PageContainer>
  );
}
