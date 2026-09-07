import type { Metadata } from "next";
import { RatingFlow } from "@/components/ratings/rating-flow";

export const metadata: Metadata = {
  title: "Rate your employer",
};

/** Individual-only: the six-step monthly rating flow. */
export default function RateCompanyPage() {
  return <RatingFlow />;
}
