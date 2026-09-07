"use client";

import { FieldShell } from "@/components/auth/text-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CommentStepProps = {
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
};

/** Final step of the rating flow — both fields are required. */
export function CommentStep({
  title,
  body,
  onTitleChange,
  onBodyChange,
}: CommentStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">Leave a comment.</h2>

      <FieldShell id="review-title" label="Title">
        <Input
          id="review-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={120}
          className="h-11"
          autoComplete="off"
        />
      </FieldShell>

      <FieldShell id="review-body" label="Comment">
        <Textarea
          id="review-body"
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          rows={6}
          className="min-h-36"
        />
      </FieldShell>
    </div>
  );
}
