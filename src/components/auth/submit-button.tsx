"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = React.ComponentProps<"button"> & {
  pending?: boolean;
  /** Announced while the request is in flight. */
  pendingLabel?: string;
};

/** Full-width primary submit that disables and shows a spinner while pending. */
export function SubmitButton({
  pending = false,
  pendingLabel,
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn("h-11 w-full text-sm font-semibold", className)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
