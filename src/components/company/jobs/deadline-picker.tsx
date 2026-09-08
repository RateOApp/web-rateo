"use client";

import { describedBy, FieldShell } from "@/components/auth/text-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOM_DEADLINE_OPTION,
  DEADLINE_OPTIONS,
  todayInputValue,
} from "@/lib/constants/jobs";

/**
 * Presets plus "Pick a specific date". The calendar field only appears for the
 * custom option; every preset counts forward from today at submit time
 * (`deadlineFromOption`), so a draft left open overnight still gets a full
 * window.
 */
export function DeadlinePicker({
  option,
  date,
  onOptionChange,
  onDateChange,
  minDate = todayInputValue(),
  error,
  disabled = false,
}: {
  option: string;
  date: string;
  onOptionChange: (next: string) => void;
  onDateChange: (next: string) => void;
  minDate?: string;
  error?: string;
  disabled?: boolean;
}) {
  const custom = option === CUSTOM_DEADLINE_OPTION;

  return (
    <div className="flex flex-col gap-3">
      <FieldShell id="job-deadline" label="Application deadline">
        <Select value={option} onValueChange={onOptionChange} disabled={disabled}>
          <SelectTrigger id="job-deadline" className="h-11 w-full">
            <SelectValue placeholder="Select a deadline" />
          </SelectTrigger>
          <SelectContent>
            {[...DEADLINE_OPTIONS, CUSTOM_DEADLINE_OPTION].map((entry) => (
              <SelectItem key={entry} value={entry}>
                {entry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>

      {custom ? (
        <FieldShell id="job-deadline-date" label="Deadline date" error={error}>
          <Input
            id="job-deadline-date"
            type="date"
            value={date}
            min={minDate}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy("job-deadline-date", error)}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-11"
          />
        </FieldShell>
      ) : null}
    </div>
  );
}
