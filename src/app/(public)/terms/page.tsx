import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The Terms of Use for the Rate'O website, web app and mobile apps, including how ratings, identity verification and job listings work.",
  alternates: { canonical: "/terms" },
};

const PRIVACY_POLICY_URL = "https://rateo.ng/privacy-policy";

type Clause = {
  id: string;
  title: string;
  paragraphs: string[];
};

const CLAUSES: Clause[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    paragraphs: [
      "By accessing or using Rate’O, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing the Service.",
      "We reserve the right to modify these terms at any time, and such modifications shall be effective immediately upon posting of the modified terms. Your continued use of the Service after the posting of any modified terms constitutes your acceptance of the modified terms.",
    ],
  },
  {
    id: "user-accounts",
    title: "User Accounts",
    paragraphs: [
      "To access certain features of the Service, you may be required to create a user account. You are responsible for maintaining the confidentiality of your account information, including your password, and for all activities that occur under your account.",
      "You agree to notify us immediately of any unauthorized use of your account or any other breach of security. We will not be liable for any loss that you may incur as a result of someone else using your account, either with or without your knowledge.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "Rate’O and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.",
      "You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on the Service, except as generally and ordinarily permitted through the Service according to these Terms of Use.",
    ],
  },
  {
    id: "user-content",
    title: "User Content",
    paragraphs: [
      "By posting, uploading, inputting, providing, or submitting content to the Service, you grant us a non-exclusive, royalty-free, perpetual, and irrevocable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content throughout the world in any media.",
      "You represent and warrant that you own or control all rights to the content you submit, and that such content does not violate these Terms of Use or any applicable laws.",
    ],
  },
  {
    id: "ratings-and-reviews",
    title: "Ratings and Reviews",
    paragraphs: [
      "Rate’O invites employers and employees to submit monthly ratings of one another. Ratings must be honest, given in good faith and based on a genuine working relationship between the parties. Submitting a rating for a relationship that does not exist, or rating with intent to mislead, harass or defame, is prohibited.",
      "Ratings are kept private and are not shared with the party being rated until the employment relationship has ended. We may investigate, suspend or remove any rating that we reasonably believe is fraudulent, abusive, retaliatory or otherwise in violation of these Terms of Use.",
      "Your participation score reflects how consistently you submit ratings when they fall due. A low participation score may limit your access to certain features of the Service, including visibility in search results and job or candidate recommendations.",
    ],
  },
  {
    id: "identity-verification",
    title: "Identity Verification",
    paragraphs: [
      "Certain features of the Service, including the verified badge, require you to complete Know Your Customer (KYC) identity verification. You must provide accurate, current and complete information, including, where applicable, your National Identification Number (NIN) or your company’s Corporate Affairs Commission (CAC) registration details.",
      "Information submitted for verification is used only to confirm your identity or your company’s registration and is handled in accordance with our Privacy Policy. It is not displayed publicly.",
      "If we determine that any information you provided for verification is false, outdated or misleading, we may suspend your account and withdraw any verified badge or status previously granted, without prior notice.",
    ],
  },
  {
    id: "job-listings-and-applications",
    title: "Job Listings and Applications",
    paragraphs: [
      "Companies that post job listings on the Service are solely responsible for the accuracy, legality and completeness of those listings, including the role, compensation and requirements described.",
      "Rate’O provides a platform for connecting employers and job seekers but does not guarantee that any application will result in an interview, offer or employment, and is not a party to any employment relationship formed through the Service.",
      "Some job listings displayed on the Service are imported from public sources, and the associated employer may not yet have a Rate’O account. Registering interest in such a listing does not guarantee a response, and we will attempt to notify the employer of your interest on a best-efforts basis.",
    ],
  },
  {
    id: "prohibited-uses",
    title: "Prohibited Uses",
    paragraphs: [
      "You agree not to use the Service: (a) in any way that violates any applicable federal, state, local, or international law or regulation; (b) to transmit any material that is defamatory, obscene, or offensive; (c) to impersonate or attempt to impersonate Rate’O, a Rate’O employee, or another user; (d) to engage in any conduct that restricts or inhibits anyone’s use or enjoyment of the Service.",
      "Additionally, you agree not to: (a) use the Service in any manner that could disable, overburden, damage, or impair the Service; (b) use any robot, spider, or other automatic device to access the Service; (c) introduce any viruses, Trojan horses, worms, or other material that is malicious or technologically harmful.",
    ],
  },
  {
    id: "disclaimer-of-warranties",
    title: "Disclaimer of Warranties",
    paragraphs: [
      "The Service is provided on an “as is” and “as available” basis, without any warranties of any kind, either express or implied. We disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
      "We do not warrant that the Service will be uninterrupted or error-free, that defects will be corrected, or that the Service is free of viruses or other harmful components.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses resulting from your access to or use of, or inability to access or use, the Service.",
      "In no event shall our total liability to you for all claims exceed the amount paid by you, if any, for accessing or using the Service during the twelve (12) months prior to bringing the claim.",
    ],
  },
  {
    id: "indemnification",
    title: "Indemnification",
    paragraphs: [
      "You agree to defend, indemnify, and hold us harmless from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys’ fees) arising out of or relating to your violation of these Terms of Use or your use of the Service.",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    paragraphs: [
      "We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of Use.",
      "Upon termination, your right to use the Service will immediately cease. All provisions of these Terms of Use which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    paragraphs: [
      "These Terms of Use and any disputes relating thereto shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles.",
      "Any legal suit, action, or proceeding arising out of, or related to, these Terms of Use or the Service shall be instituted exclusively in courts located in Lagos, Nigeria.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Terms of Use"
        description="Last updated 11 September 2026. These terms apply to the Rate’O website, web app and mobile apps."
      />

      <article className="max-w-3xl">
        <p className="text-sm text-muted-foreground">
          In these Terms of Use, &ldquo;Rate’O&rdquo;, &ldquo;the Service&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to the Rate’O website, web application and
          mobile applications. &ldquo;You&rdquo; refers to any person or company that accesses or
          uses the Service.
        </p>

        <nav
          aria-label="Table of contents"
          className="mt-6 hidden rounded-2xl border border-border bg-white p-5 md:block"
        >
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            On this page
          </h2>
          <ol className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
            {CLAUSES.map((clause, index) => (
              <li key={clause.id}>
                <a
                  href={`#${clause.id}`}
                  className="rounded text-sm text-muted-foreground transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {index + 1}. {clause.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className="rounded text-sm text-muted-foreground transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {CLAUSES.length + 1}. Contact
              </a>
            </li>
          </ol>
        </nav>

        <div className="mt-6 flex flex-col gap-4">
          {CLAUSES.map((clause, index) => (
            <section
              key={clause.id}
              id={clause.id}
              className="scroll-mt-20 rounded-2xl border border-border bg-white p-5 sm:p-6"
            >
              <h2 className="text-lg font-bold text-brand-900">
                {index + 1}. {clause.title}
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {clause.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="text-sm leading-6 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section
            id="contact"
            className="scroll-mt-20 rounded-2xl border border-border bg-white p-5 sm:p-6"
          >
            <h2 className="text-lg font-bold text-brand-900">{CLAUSES.length + 1}. Contact</h2>
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Questions about these terms: support@rateo.ng.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Also see our{" "}
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded font-medium text-brand-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </article>
    </PageContainer>
  );
}
