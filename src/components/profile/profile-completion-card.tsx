'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getProfileCompletion } from '@/lib/profile-completion';
import type { User } from '@/types/api';

const ROUTES: Record<string, string> = {
  skills: '/dashboard/profile/skills',
  experience: '/dashboard/work-history',
  resume: '/dashboard/resume',
};

/** "Complete your profile" checklist; hidden for companies and complete profiles. */
export function ProfileCompletionCard({ user, className }: { user: User; className?: string }) {
  const completion = getProfileCompletion(user);
  if (!completion || completion.complete) return null;

  const { done, total, items } = completion;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-semibold text-brand-900">Complete your profile</CardTitle>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {done} of {total} done
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-brand-50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={`Profile completion: ${done} of ${total}`}
        >
          <div
            className="h-full rounded-full bg-brand-700 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const href = ROUTES[item.key];
            if (item.done || !href) {
              return (
                <li key={item.key}>
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground">
                    <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-brand-700" />
                    <span>{item.label}</span>
                  </div>
                </li>
              );
            }
            return (
              <li key={item.key}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-brand-900 transition-colors hover:bg-muted',
                    'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  )}
                >
                  <Circle aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  <span className="flex items-center gap-0.5 text-sm font-semibold text-accent-600">
                    Add
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-sm text-muted-foreground">
          A complete profile gives employers a better understanding of your experience.
        </p>
      </CardContent>
    </Card>
  );
}
