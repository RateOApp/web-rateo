import type { Metadata } from "next";
import "./hire.css";
import { Compare } from "./sections/compare";
import { Faq } from "./sections/faq";
import { FinalCta } from "./sections/final-cta";
import { Hero } from "./sections/hero";
import { How } from "./sections/how";
import { Marquee } from "./sections/marquee";
import { Preview } from "./sections/preview";
import { Sprite } from "./sections/sprite";
import { Talent } from "./sections/talent";
import { Why } from "./sections/why";

const DESCRIPTION =
  "Hire people with verified work reviews and build an employer brand candidates trust.";

export const metadata: Metadata = {
  title: "Hire with Rate’O",
  description: DESCRIPTION,
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Hire with Rate’O | Verified hiring for Nigerian employers",
    description: DESCRIPTION,
    url: "/hire",
  },
};

export default function HirePage() {
  return (
    <div className="hire" id="top">
      <Sprite />
      <Hero />
      <Marquee />
      <Why />
      <How />
      <Talent />
      <Preview />
      <Compare />
      <Faq />
      <FinalCta />
    </div>
  );
}
