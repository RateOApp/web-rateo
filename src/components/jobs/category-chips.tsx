import Link from "next/link";
import { cn } from "@/lib/utils";
import type { JobCategory } from "@/types/api";

type CategoryChipsProps = {
  categories: JobCategory[];
  /** The industry currently filtered on, or `undefined` for "All". */
  active?: string;
  /** Route the chips link to. */
  basePath: string;
  /** Params carried across, e.g. the current keyword. */
  params?: Record<string, string | undefined>;
  className?: string;
};

function chipHref(
  basePath: string,
  params: Record<string, string | undefined>,
  category?: string,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) search.set(key, value.trim());
  }
  if (category) search.set("category", category);
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Horizontally scrollable industry filter. The backend personalises the feed
 * when no `categories` param is sent, so "All" is an explicit choice, not an
 * absence - see `jobListQuery` in `@/services/params`.
 */
export function CategoryChips({
  categories,
  active,
  basePath,
  params = {},
  className,
}: CategoryChipsProps) {
  if (!categories.length) return null;

  const items = [
    { key: "all", label: "All", href: chipHref(basePath, params), isActive: !active },
    ...categories.map((category) => ({
      key: category.industry,
      label: category.count ? `${category.industry} (${category.count})` : category.industry,
      href: chipHref(basePath, params, category.industry),
      isActive: active === category.industry,
    })),
  ];

  return (
    <nav
      aria-label="Filter by industry"
      className={cn("-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6", className)}
    >
      <ul className="flex w-max items-center gap-2 pb-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.isActive ? "true" : undefined}
              className={cn(
                "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                item.isActive
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-border bg-white text-muted-foreground hover:border-brand-100 hover:text-brand-900",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
