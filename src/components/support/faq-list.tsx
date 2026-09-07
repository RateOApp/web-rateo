"use client";

import { useMemo, useState } from "react";
import { ChevronDown, HelpCircle, Search, SearchX } from "lucide-react";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFaqs } from "@/hooks/use-faqs";
import { cn } from "@/lib/utils";
import type { Faq } from "@/types/support";

function FaqRow({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  const bodyId = `faq-${faq.id}-answer`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex-1 text-sm font-semibold text-brand-900">
          {faq.question}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div id={bodyId} hidden={!open} className="border-t border-border px-4 py-4">
        <p className="text-sm whitespace-pre-line text-muted-foreground">{faq.answer}</p>
        {faq.category ? (
          <span className="mt-3 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {faq.category}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** `/dashboard/help` — searchable FAQ accordion backed by `GET /faqs`. */
export function FaqList() {
  const [query, setQuery] = useState("");
  const { data, isPending, isError, refetch, isFetching } = useFaqs();

  const faqs = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(needle) ||
        faq.answer.toLowerCase().includes(needle),
    );
  }, [faqs, query]);

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search questions..."
          aria-label="Search questions"
          className="h-11 pl-9"
        />
      </div>

      {isPending ? (
        <CardListSkeleton rows={4} />
      ) : isError ? (
        <EmptyState
          icon={HelpCircle}
          title="Something went wrong"
          description="We couldn't load the FAQs. Check your connection and try again."
          action={
            <Button type="button" size="lg" onClick={() => void refetch()} disabled={isFetching}>
              Retry
            </Button>
          }
        />
      ) : !faqs.length ? (
        <EmptyState
          icon={HelpCircle}
          title="No FAQs Available"
          description="There are currently no FAQs in our database. Please check back later."
          action={
            <Button type="button" size="lg" onClick={() => void refetch()} disabled={isFetching}>
              Refresh
            </Button>
          }
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={SearchX}
          title="No results found"
          description="Try using different keywords"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((faq) => (
            <li key={faq.id}>
              <FaqRow faq={faq} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
