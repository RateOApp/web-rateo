import {
  Bookmark,
  Briefcase,
  Building2,
  Compass,
  Home,
  Search,
  Star,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/session";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `exact` matches the pathname only; `prefix` (default) also matches children. */
  match?: "exact" | "prefix";
};

/** Marketing / logged-out navigation. */
export const publicNav: NavItem[] = [
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Search", href: "/search", icon: Search },
];

/** Mirrors the Expo app's individual bottom tabs. */
export const individualTabs: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home, match: "exact" },
  { label: "Explore", href: "/dashboard/explore", icon: Compass },
  { label: "Ratings", href: "/dashboard/ratings", icon: Star },
  { label: "Saved", href: "/dashboard/saved", icon: Bookmark },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

/** Mirrors the Expo app's company bottom tabs. */
export const companyTabs: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home, match: "exact" },
  { label: "Explore", href: "/dashboard/explore", icon: Compass },
  { label: "Ratings", href: "/dashboard/ratings", icon: Star },
  { label: "Candidates", href: "/dashboard/candidates", icon: Users },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

/** Individuals are the default when the role is not known yet. */
export function tabsForRole(role: Role | null): NavItem[] {
  return role === "company" ? companyTabs : individualTabs;
}

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
