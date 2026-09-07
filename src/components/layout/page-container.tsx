import { cn } from "@/lib/utils";

/** The standard centred content column: max-w-6xl with page padding. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container-app py-6 md:py-8", className)}>{children}</div>
  );
}
