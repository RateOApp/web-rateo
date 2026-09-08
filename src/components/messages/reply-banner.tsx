"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ComposerBanner =
  | { kind: "reply"; name: string; preview: string }
  | { kind: "edit" };

/**
 * The strip above the composer while a reply or an edit is armed. Copy matches
 * mobile: **Replying to {name}** / **Replying to Yourself** / **Editing
 * message...**.
 */
export function ReplyBanner({
  banner,
  onCancel,
}: {
  banner: ComposerBanner;
  onCancel: () => void;
}) {
  const title = banner.kind === "edit" ? "Editing message..." : `Replying to ${banner.name}`;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
      <span aria-hidden="true" className="w-0.5 shrink-0 self-stretch rounded-full bg-brand-700" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-brand-900">{title}</span>
        {banner.kind === "reply" && banner.preview ? (
          <span className="block truncate text-xs text-muted-foreground">{banner.preview}</span>
        ) : null}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={banner.kind === "edit" ? "Cancel edit" : "Cancel reply"}
        onClick={onCancel}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
