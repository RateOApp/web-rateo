import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { toDate } from "@/lib/format";

/** `Today` / `Yesterday` / `12 Mar` / `12 Mar 2024`. */
export function dayLabel(value: string | Date | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, isThisYear(date) ? "d MMM" : "d MMM yyyy");
}

/** Stable key for grouping messages into day buckets. */
export function dayKey(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "yyyy-MM-dd") : "unknown";
}

/** The pill that separates one day of conversation from the next. */
export function DateDivider({ label }: { label: string }) {
  return (
    <li className="my-2 flex justify-center">
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </li>
  );
}
