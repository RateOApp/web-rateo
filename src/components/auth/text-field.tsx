"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldShellProps = {
  id: string;
  label: string;
  /** Appends "(optional)" to the label, like the mobile phone field. */
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  /** Rendered between the control and the error (checklist, hints). */
  below?: React.ReactNode;
  className?: string;
};

/** Label + control + error text, wired together with `aria-describedby`. */
export function FieldShell({
  id,
  label,
  optional,
  error,
  children,
  below,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-brand-900">
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </Label>
      {children}
      {below}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, extraId?: string): string | undefined {
  const ids = [error ? `${id}-error` : null, extraId ?? null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

type TextFieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
};

/** The plain labelled text input used across the auth forms. */
export function TextField({
  id,
  label,
  optional,
  error,
  className,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} optional={optional} error={error}>
      <Input
        id={id}
        {...props}
        className={cn("h-11", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error)}
      />
    </FieldShell>
  );
}
