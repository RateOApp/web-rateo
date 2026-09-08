import type { Metadata } from "next";
import { EmployerRatingFlow } from "@/components/ratings/employer-rating-flow";

export const metadata: Metadata = {
  title: "Rate your employer",
};

/** Individual-only: the six-step monthly rating flow. */
export default function RateCompanyPage() {
  return <EmployerRatingFlow />;
}
