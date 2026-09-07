"use client";

import { Check, Circle } from "lucide-react";

import { PASSWORD_RULES, passwordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";

type PasswordChecklistProps = {
  password: string;
  /** Adds the mobile app's Weak / Medium / Good hint above the rules. */
  showStrength?: boolean;
  id?: string;
};

/**
 * Live password rules, ported from `app-rateo/src/components/PasswordChecklist.js`.
 * Items turn green as they pass; the list is the same one the server enforces.
 */
export function PasswordChecklist({
  password,
  showStrength = false,
  id,
}: PasswordChecklistProps) {
  const strength = passwordStrength(password);

  return (
    <div id={id} className="mt-2">
      {showStrength && strength.label ? (
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                strength.level === "weak" && "bg-destructive",
                strength.level === "medium" && "bg-accent-600",
                strength.level === "good" && "bg-success",
              )}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              strength.level === "weak" && "text-destructive",
              strength.level === "medium" && "text-accent-600",
              strength.level === "good" && "text-success",
            )}
          >
            {strength.label}
          </span>
        </div>
      ) : null}

      <ul className="flex flex-col gap-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              key={rule.key}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                passed ? "text-success" : "text-muted-foreground",
              )}
            >
              {passed ? (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{rule.label}</span>
              <span className="sr-only">{passed ? " — met" : " — not met yet"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
