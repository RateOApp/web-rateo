import type { Metadata } from "next";

import { RegisterIndividualForm } from "@/components/auth/register-individual-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return <RegisterIndividualForm />;
}
