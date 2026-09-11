import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const footerLinks = [
  { label: "Jobs", href: "/jobs", external: false },
  { label: "Companies", href: "/companies", external: false },
  { label: "Terms", href: "/terms", external: false },
  { label: "Privacy", href: "https://rateo.ng/privacy-policy", external: true },
  { label: "Get the app", href: "https://rateo.ng", external: true },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background">
      {/* pb-24 on mobile keeps the copyright clear of the fixed tab bar. */}
      <div className="container-app flex flex-col gap-6 pt-8 pb-24 sm:flex-row sm:items-center sm:justify-between md:pb-8">
        <Link href="/jobs" aria-label="Rate'O home" className="shrink-0">
          <Logo height={24} />
        </Link>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded text-sm text-muted-foreground transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="rounded text-sm text-muted-foreground transition-colors hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Rate&rsquo;O. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
