import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Small print under the form: "Already have an account?" and friends. */
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Heading + body + footer for the auth pages. The white card, the cream canvas
 * and the logo come from `src/app/(auth)/layout.tsx`; this only lays out what
 * goes inside it, so every auth page reads the same.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className={cn("w-full", className)}>
      <h1 className="text-xl font-semibold tracking-tight text-brand-900 sm:text-2xl">
        {title}
      </h1>
      {description ? (
        <div className="mt-1.5 text-sm text-muted-foreground">{description}</div>
      ) : null}
      <div className="mt-6">{children}</div>
      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
