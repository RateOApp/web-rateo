import type { Metadata } from "next";
import { CandidatePreferencesForm } from "@/components/company/preferences/candidate-preferences-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Candidate preferences",
};

export default function CandidatePreferencesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Candidate Preference"
        description="Who we should put in front of you."
      />
      <CandidatePreferencesForm />
    </PageContainer>
  );
}
