"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn } from "lucide-react";
import { isActive, publicNav, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Fixed bottom bar for public pages on < md. Mirrors the app's tab bar. */
export function MobilePublicTabs({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();

  const lastTab: NavItem = isLoggedIn
    ? { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
    : { label: "Log in", href: "/login", icon: LogIn };

  const tabs = [...publicNav, lastTab];

  return (
    <nav
      aria-label="Mobile"
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
