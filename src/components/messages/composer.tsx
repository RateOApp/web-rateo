"use client";

import { useRef } from "react";
import { Check, ImageUp, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { ReplyBanner, type ComposerBanner } from "@/components/messages/reply-banner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

type ComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  /** Fired on every keystroke so the thread can emit `typing` (rate-limited there). */
  onTyping: () => void;
  banner: ComposerBanner | null;
  onCancelBanner: () => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  sending: boolean;
  disabled?: boolean;
};

/**
 * The message composer. Enter sends, Shift+Enter adds a newline - the same
 * contract as every chat client, and the reason the field is a textarea rather
 * than an input.
 *
 * While an edit is armed the attach button is hidden: `PUT /messages/:id` only
 * takes `content`, so there is nothing an attachment could do.
 */
export function Composer({
  value,
  onValueChange,
  onSubmit,
  onTyping,
  banner,
  onCancelBanner,
  file,
  onFileChange,
  sending,
  disabled = false,
}: ComposerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const editing = banner?.kind === "edit";
  const canSend = Boolean(value.trim() || file) && !sending && !disabled;

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      toast.error("Attachments must be a PNG, JPG or WebP image.");
      event.target.value = "";
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error("Attachments must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    onFileChange(picked);
  }

  function clearFile() {
    onFileChange(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <form
      className="flex shrink-0 flex-col gap-2 border-t border-border bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSend) return;
        clearFile();
        onSubmit();
      }}
    >
      {banner ? <ReplyBanner banner={banner} onCancel={onCancelBanner} /> : null}

      {file ? (
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <ImageUp aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {file.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Remove attachment"
            onClick={clearFile}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {editing ? null : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Attach an image"
              disabled={disabled || sending}
              onClick={() => fileInput.current?.click()}
            >
              <ImageUp aria-hidden="true" />
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleFile}
            />
          </>
        )}

        <Textarea
          value={value}
          rows={1}
          disabled={disabled}
          aria-label="Message"
          placeholder="Type a message..."
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-muted/50 py-2.5"
          onChange={(event) => {
            onValueChange(event.target.value);
            onTyping();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            if (!canSend) return;
            clearFile();
            onSubmit();
          }}
        />

        <Button
          type="submit"
          size="icon-lg"
          aria-label={editing ? "Save edit" : "Send"}
          className="bg-brand-700 text-white"
          disabled={!canSend}
        >
          {sending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : editing ? (
            <Check aria-hidden="true" />
          ) : (
            <Send aria-hidden="true" />
          )}
        </Button>
      </div>
    </form>
  );
}
