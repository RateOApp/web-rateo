import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmployeeRatingFlow } from "@/components/company/ratings/employee-rating-flow";
import { isObjectId } from "@/lib/format";

export const metadata: Metadata = {
  title: "Rate your employee",
};

/** Company-only: the six-step monthly rating for one employee. */
export default async function RateEmployeePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  // A junk id would reach the backend as a target and come back 500; the route
  // simply does not exist for one.
  if (!isObjectId(employeeId)) notFound();

  return <EmployeeRatingFlow employeeId={employeeId} />;
}
