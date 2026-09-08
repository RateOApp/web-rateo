"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKILLS_POOL } from "@/lib/constants/jobs";
import { cn } from "@/lib/utils";

/**
 * Multi-select over `SKILLS_POOL` plus free-text additions.
 *
 * The mobile app hides this behind a modal; on the web the whole pool fits on
 * screen, so the options are toggle chips and the selection is echoed above
 * them as removable chips (a custom skill only ever appears in that echo).
 */
export function SkillsPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function toggle(skill: string) {
    onChange(
      value.includes(skill) ? value.filter((entry) => entry !== skill) : [...value, skill],
    );
  }

  function addCustom() {
    const skill = draft.trim();
    if (!skill) return;
    if (!value.includes(skill)) onChange([...value, skill]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          id="job-skill"
          value={draft}
          placeholder="Type a skill & tap Add"
          disabled={disabled}
          aria-label="Add a custom skill"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          className="h-11"
        />
        <Button
          type="button"
          className="h-11 shrink-0 bg-brand-700 px-5 text-white"
          disabled={disabled || !draft.trim()}
          onClick={addCustom}
        >
          Add
        </Button>
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <li key={skill}>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pr-1 pl-3 text-sm font-medium text-brand-700">
                {skill}
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${skill}`}
                  onClick={() => onChange(value.filter((entry) => entry !== skill))}
                  className="inline-flex size-5 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No skills selected yet.</p>
      )}

      <ul className="flex flex-wrap gap-2">
        {SKILLS_POOL.map((skill) => {
          const active = value.includes(skill);
          return (
            <li key={skill}>
              <button
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => toggle(skill)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50",
                  active
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-border bg-card text-brand-900 hover:bg-muted",
                )}
              >
                {active ? <Check aria-hidden="true" className="size-3.5" /> : null}
                {skill}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
