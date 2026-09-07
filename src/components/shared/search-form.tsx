import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  /** Route the GET form submits to, e.g. `/jobs`. */
  action: string;
  /** Current value of the `q` field. */
  value?: string;
  placeholder?: string;
  label?: string;
  /** Extra params rendered as hidden inputs so filters survive a search. */
  hidden?: Record<string, string | undefined>;
  autoFocus?: boolean;
  size?: "default" | "lg";
  className?: string;
};

/**
 * Plain `<form method="get">`. No JavaScript, so search works on the first
 * paint and every result URL is shareable and crawlable.
 */
export function SearchForm({
  action,
  value,
  placeholder = "Search",
  label = "Search",
  hidden = {},
  autoFocus = false,
  size = "default",
  className,
}: SearchFormProps) {
  const large = size === "lg";

  return (
    <form method="get" action={action} role="search" className={cn("flex gap-2", className)}>
      {Object.entries(hidden).map(([name, hiddenValue]) =>
        hiddenValue?.trim() ? (
          <input key={name} type="hidden" name={name} value={hiddenValue.trim()} />
        ) : null,
      )}

      <div className="relative min-w-0 flex-1">
        <label htmlFor="q" className="sr-only">
          {label}
        </label>
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground",
            large ? "size-5" : "size-4",
          )}
        />
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={value ?? ""}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "rounded-xl bg-white",
            large ? "h-12 pl-11 text-base" : "h-11 pl-10",
          )}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className={cn("shrink-0 bg-brand-700 px-4 text-white", large ? "h-12 px-5" : "h-11")}
      >
        Search
      </Button>
    </form>
  );
}
