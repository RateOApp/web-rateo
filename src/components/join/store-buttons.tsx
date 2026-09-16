"use client";

import { Apple, Play } from "lucide-react";
import { toast } from "sonner";

import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants/stores";
import { cn } from "@/lib/utils";

const STORES = [
  { href: APP_STORE_URL, label: "Download on the App Store", icon: Apple },
  { href: PLAY_STORE_URL, label: "Get it on Google Play", icon: Play },
] as const;

/**
 * App Store / Play Store links for the join page.
 *
 * The code is written to the clipboard INSIDE the click handler - that is the
 * user gesture browsers require - and the anchor then navigates natively, so
 * the store still opens if the clipboard write is refused. The mobile app
 * reads the clipboard on its Register screen, which is the whole deferred
 * deep-link handoff (no SDK).
 */
export function StoreButtons({ code, className }: { code?: string; className?: string }) {
  function handleClick() {
    if (!code) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      void navigator.clipboard
        .writeText(code)
        .then(() => toast.success("Code copied", { description: "Paste it when the app asks." }))
        .catch(() => {});
    } catch {
      // Clipboard unavailable: the store link still works, the visitor types
      // the code manually.
    }
  }

  return (
    <div className={cn("grid gap-2.5 sm:grid-cols-2", className)}>
      {STORES.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {label}
        </a>
      ))}
    </div>
  );
}
