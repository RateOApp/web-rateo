import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeesTabs } from "@/components/company/employees/employees-tabs";
import { parseEmployeesTab } from "@/components/company/employees/employees-tab";

export const metadata: Metadata = {
  title: "Employees",
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        description="Your team, the people waiting to be confirmed, and past employments."
      />
      <EmployeesTabs initialTab={parseEmployeesTab(tab)} />
    </PageContainer>
  );
}
