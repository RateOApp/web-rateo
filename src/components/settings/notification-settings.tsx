"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "notificationSettings";

type NotificationSettingsState = {
  notification: boolean;
  push: boolean;
  email: boolean;
};

const DEFAULTS: NotificationSettingsState = {
  notification: true,
  push: false,
  email: true,
};

const ROWS: { key: keyof NotificationSettingsState; label: string }[] = [
  { key: "notification", label: "Notification" },
  { key: "push", label: "Push notification" },
  { key: "email", label: "Email notification" },
];

/* --- localStorage as an external store ------------------------------------
   `useSyncExternalStore` keeps the server render (defaults) and the client
   render in step without a setState-in-effect, and picks up changes made in
   another tab. -------------------------------------------------------------- */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The raw JSON string — a stable snapshot value between writes. */
function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function parse(raw: string | null): NotificationSettingsState {
  if (!raw) return DEFAULTS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULTS;
    const record = parsed as Partial<Record<keyof NotificationSettingsState, unknown>>;
    return {
      notification:
        typeof record.notification === "boolean"
          ? record.notification
          : DEFAULTS.notification,
      push: typeof record.push === "boolean" ? record.push : DEFAULTS.push,
      email: typeof record.email === "boolean" ? record.email : DEFAULTS.email,
    };
  } catch {
    return DEFAULTS;
  }
}

function write(next: NotificationSettingsState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage disabled — nothing else to do.
  }
  for (const listener of listeners) listener();
}

function Toggle({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        checked ? "bg-accent-600" : "bg-muted",
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

/**
 * Preferences live in `localStorage` only — there is no backend settings
 * endpoint yet, exactly as in `NotificationSettingsScreen`.
 */
export function NotificationSettings() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settings = useMemo(() => parse(raw), [raw]);

  return (
    <div className="max-w-md divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 px-4 py-4">
          <label
            htmlFor={`notify-${row.key}`}
            className="text-sm font-medium text-brand-900"
          >
            {row.label}
          </label>
          <Toggle
            id={`notify-${row.key}`}
            checked={settings[row.key]}
            onCheckedChange={(checked) => write({ ...settings, [row.key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}
