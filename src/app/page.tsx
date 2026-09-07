import { redirect } from "next/navigation";

/** The marketing home lives on Framer (rateo.ng); this app opens on jobs. */
export default function RootPage() {
  redirect("/jobs");
}
