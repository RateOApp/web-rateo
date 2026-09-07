import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span
          aria-hidden="true"
          className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"
        >
          <Icon className="size-6" />
        </span>
      ) : null}
      <p className="text-base font-semibold text-brand-900">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
