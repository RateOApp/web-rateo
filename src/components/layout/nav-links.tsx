"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, publicNav, tabsForRole, type NavItem } from "@/lib/nav";
import type { Role } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Nav items carry lucide components, which are not serialisable across the
 * server/client boundary — so these read `@/lib/nav` themselves and only take
 * plain props (a role string) from their server parents.
 */
function NavLinkList({
  items,
  withIcons,
  className,
}: {
  items: NavItem[];
  withIcons: boolean;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted-foreground hover:bg-muted hover:text-brand-900",
              )}
            >
              {withIcons ? <Icon aria-hidden="true" className="size-4" /> : null}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop links for the public header. */
export function PublicNavLinks({ className }: { className?: string }) {
  return <NavLinkList items={publicNav} withIcons={false} className={className} />;
}

/** Desktop links for the dashboard header; mirrors the mobile tab bar. */
export function AppNavLinks({
  role,
  className,
}: {
  role: Role | null;
  className?: string;
}) {
  return <NavLinkList items={tabsForRole(role)} withIcons className={className} />;
}
