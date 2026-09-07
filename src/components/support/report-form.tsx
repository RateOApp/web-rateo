"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { FormAlert } from "@/components/auth/form-alert";
import { FieldShell } from "@/components/auth/text-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket, useSupportTickets } from "@/hooks/use-support";
import { getApiErrorMessage } from "@/lib/api/client";
import { supportService } from "@/services/support";
import { PROBLEM_TYPES } from "@/types/support";

const WORD_LIMIT = 100;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg"];

function wordsLeft(text: string): number {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(0, WORD_LIMIT - words);
}

/**
 * `/dashboard/report`. An open ticket short-circuits to its thread unless the
 * user asked for a new one (`?new=1`) — the server closes the previous open
 * ticket when a new one is created.
 */
export function ReportForm() {
  const router = useRouter();
  const params = useSearchParams();
  const forceNew = params.get("new") === "1";

  const tickets = useSupportTickets(!forceNew);
  const createTicket = useCreateTicket();

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const redirected = useRef(false);

  const openTicket = forceNew
    ? undefined
    : tickets.data?.find((ticket) => ticket.status === "open");

  useEffect(() => {
    if (forceNew || redirected.current || !openTicket) return;
    redirected.current = true;
    router.replace(`/dashboard/support/${openTicket._id}`);
  }, [forceNew, openTicket, router]);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      setError("Evidence must be a PNG or JPG image.");
      event.target.value = "";
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("Evidence must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createTicket.isPending || uploading) return;

    if (!type || !description.trim()) {
      setError("Please select a problem type and describe the problem.");
      return;
    }
    setError(null);

    try {
      let attachments: string[] = [];
      if (file) {
        setUploading(true);
        const uploaded = await supportService.uploadEvidence(file);
        setUploading(false);
        if (uploaded.url) attachments = [uploaded.url];
      }

      const ticket = await createTicket.mutateAsync({
        type,
        description: description.trim(),
        attachments,
      });
      router.replace(`/dashboard/support/${ticket._id}`);
    } catch (submitError) {
      setUploading(false);
      setError(getApiErrorMessage(submitError, "Failed to submit report. Please try again."));
      toast.error("Failed to submit report. Please try again.");
    }
  }

  // Still checking for an open ticket, or bouncing to it.
  if (!forceNew && (tickets.isPending || openTicket)) {
    return <Skeleton className="h-96 w-full max-w-xl rounded-2xl" />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex max-w-xl flex-col gap-5 rounded-2xl border border-border bg-white p-5 sm:p-6"
    >
      <p className="text-sm text-muted-foreground">
        If a feature or product isn&rsquo;t working correctly, you can give feedback to
        help us make Rateo better.
      </p>

      <FieldShell id="problem-type" label="Problem type">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="problem-type" className="h-11 w-full">
            <SelectValue placeholder="Select problem type" />
          </SelectTrigger>
          <SelectContent>
            {PROBLEM_TYPES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>

      <FieldShell
        id="problem-description"
        label="Describe problem"
        below={
          <p className="text-right text-xs text-muted-foreground">
            {wordsLeft(description)} words left
          </p>
        }
      >
        <Textarea
          id="problem-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          className="min-h-36"
        />
      </FieldShell>

      <FieldShell id="problem-evidence" label="Evidence (png, jpg. Max 5Mb)">
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
          <ImageUp aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {file ? file.name : "Upload file"}
          </span>
          {file ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove evidence"
              onClick={() => {
                setFile(null);
                if (fileInput.current) fileInput.current.value = "";
              }}
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            {file ? "Replace" : "Select file"}
          </Button>
          <input
            ref={fileInput}
            id="problem-evidence"
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={handleFile}
          />
        </div>
      </FieldShell>

      <FormAlert>{error}</FormAlert>

      <SubmitButton
        pending={uploading || createTicket.isPending}
        pendingLabel={uploading ? "Uploading…" : "Submitting…"}
      >
        Submit report
      </SubmitButton>
    </form>
  );
}
