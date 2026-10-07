'use client';

import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type MonthAccordionProps = {
  label: string;
  subtitle?: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function MonthAccordion({
  label,
  subtitle,
  count,
  expanded,
  onToggle,
  children,
}: MonthAccordionProps) {
  const bodyId = useId();

  return (
    <div className="rounded-2xl border border-border bg-white">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-brand-900">{label}</span>
          {subtitle ? (
            <span className="block text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {count} rating{count === 1 ? '' : 's'}
          </span>
          <ChevronDown
            aria-hidden
            className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          />
        </span>
      </button>
      {expanded ? (
        <div id={bodyId} className="border-t border-border px-3 pb-3 pt-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
