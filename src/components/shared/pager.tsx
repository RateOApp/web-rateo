import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PagerProps = {
  page: number;
  pages: number;
  /** Route the links point at, e.g. `/jobs`. */
  basePath: string;
  /** Query params to carry across page links (`page` is added by the pager). */
  params?: Record<string, string | undefined>;
  className?: string;
};

/** Page numbers to show, with `null` marking an ellipsis gap. */
function windowFor(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const items = new Set<number>([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => items.add(n));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((n) => items.add(n));

  const sorted = [...items].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  const out: (number | null)[] = [];
  let previous = 0;
  for (const n of sorted) {
    if (previous && n - previous > 1) out.push(null);
    out.push(n);
    previous = n;
  }
  return out;
}

/**
 * Link-based pagination. Server-rendered, so every page is crawlable and
 * shareable; the backend page size is fixed at 10.
 */
export function Pager({ page, pages, basePath, params = {}, className }: PagerProps) {
  if (!pages || pages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value?.trim()) search.set(key, value.trim());
    }
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const current = Math.min(Math.max(page, 1), pages);

  return (
    <Pagination className={cn("mt-8", className)}>
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          {current > 1 ? (
            <Button asChild variant="ghost" size="lg" className="px-2">
              <Link href={href(current - 1)} aria-label="Go to previous page" rel="prev">
                <ChevronLeft aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="lg" className="px-2" disabled aria-hidden="true">
              <ChevronLeft aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          )}
        </PaginationItem>

        {windowFor(current, pages).map((target, index) =>
          target === null ? (
            <PaginationItem key={`gap-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={target}>
              <Button
                asChild
                size="icon-lg"
                variant={target === current ? "default" : "ghost"}
                className={target === current ? "bg-brand-700 text-white" : undefined}
              >
                <Link
                  href={href(target)}
                  aria-label={`Go to page ${target}`}
                  aria-current={target === current ? "page" : undefined}
                >
                  {target}
                </Link>
              </Button>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          {current < pages ? (
            <Button asChild variant="ghost" size="lg" className="px-2">
              <Link href={href(current + 1)} aria-label="Go to next page" rel="next">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="lg" className="px-2" disabled aria-hidden="true">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
