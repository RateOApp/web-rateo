import { Building2, User } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { role: "individual", href: "/register", label: "Individual", Icon: User },
  { role: "company", href: "/register/company", label: "Company", Icon: Building2 },
] as const;

/**
 * Segmented control at the top of the register pages. Each half is a link, so
 * the two forms stay separate pages (and separate documents to link to).
 */
export function RoleSwitch({ active }: { active: "individual" | "company" }) {
  return (
    <div
      role="group"
      aria-label="Account type"
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1"
    >
      {OPTIONS.map(({ role, href, label, Icon }) => {
        const selected = role === active;
        return (
          <Link
            key={role}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected
                ? "bg-card text-brand-900 shadow-sm"
                : "text-muted-foreground hover:text-brand-900",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
