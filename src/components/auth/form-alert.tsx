import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type FormAlertProps = {
  id?: string;
  children?: React.ReactNode;
  className?: string;
};

/** Inline server-error box above a form's submit button. */
export function FormAlert({ id, children, className }: FormAlertProps) {
  if (!children) return null;

  return (
    <div
      id={id}
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
