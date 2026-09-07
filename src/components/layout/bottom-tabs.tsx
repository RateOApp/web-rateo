"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, tabsForRole } from "@/lib/nav";
import type { Role } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Dashboard bottom tab bar (< md). 64px tall — the dashboard <main> adds
 * matching bottom padding so content never hides behind it.
 */
export function BottomTabs({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const tabs = tabsForRole(role);

  return (
    <nav
      aria-label="Dashboard"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:-outline-offset-2",
                  active ? "text-brand-700" : "text-gray-400",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="truncate px-1">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
