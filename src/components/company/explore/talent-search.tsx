"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCandidateSearch } from "@/hooks/use-candidates";
import { candidateName, candidateTitleLabel } from "@/types/candidates";

/**
 * Explore's search box for companies. Suggestions come from the same endpoint
 * the results list uses (top 5), and submitting reloads the page with `?q=` so
 * the results are shareable.
 */
export function TalentSearch({
  query,
  onSuggestionPick,
}: {
  query?: string;
  /** Return `false` to swallow the navigation (e.g. the KYC gate opened). */
  onSuggestionPick?: (id: string) => boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query ?? "");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const { candidates, isFetching } = useCandidateSearch(value);
  const suggestions = candidates.slice(0, 5);

  // Re-sync with the URL when the server sends a different `?q=` (the component
  // stays mounted across that navigation). Adjusting state during render is the
  // supported pattern; an effect here would cascade.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setValue(query ?? "");
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function submit(term: string) {
    setOpen(false);
    const trimmed = term.trim();
    router.push(
      trimmed ? `/dashboard/explore?q=${encodeURIComponent(trimmed)}` : "/dashboard/explore",
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <label htmlFor="talent-search" className="sr-only">
            Search for roles &amp; people
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="talent-search"
            type="search"
            value={value}
            placeholder="Search for roles & people"
            className="h-11 rounded-xl bg-white pl-10"
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(event.target.value.length > 0);
            }}
            onFocus={() => setOpen(value.length > 0)}
          />
        </div>
        <Button type="submit" size="lg" className="h-11 shrink-0 bg-brand-700 px-4 text-white">
          Search
        </Button>
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Search suggestions
          </p>
          {isFetching ? (
            <p className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Searching
            </p>
          ) : suggestions.length ? (
            <ul className="pb-1">
              {suggestions.map((candidate) => (
                <li key={candidate._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (onSuggestionPick && !onSuggestionPick(candidate._id)) return;
                      router.push(`/dashboard/talent/${candidate._id}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <UserAvatar user={candidate} size="sm" className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-brand-900">
                        <span className="truncate">{candidateName(candidate)}</span>
                        <span aria-hidden="true" className="text-muted-foreground">
                          &bull;
                        </span>
                        <span className="truncate text-muted-foreground">
                          {candidateTitleLabel(candidate)}
                        </span>
                      </span>
                      {candidate.publicId ? (
                        <span className="block text-xs text-muted-foreground">
                          ID-{candidate.publicId}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : value.trim().length >= 2 ? (
            <p className="p-4 text-sm text-muted-foreground">No matches found</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
