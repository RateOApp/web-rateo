import type { ParticipationStatus } from '@/types/api';

/**
 * Participation score tiers, ported from app-rateo's ParticipationRing.js.
 * Colours are expressed as token names so components stay hex-free:
 * use them as `text-{tone}` / `bg-{tone}` via the maps below.
 */
export type ParticipationTone = 'muted' | 'success' | 'warning' | 'danger';

export type ParticipationTier = {
  hasScore: boolean;
  tone: ParticipationTone;
  chip: { label: 'Overdue' | 'Excellent' | 'Good' | 'Low' } | null;
};

export function participationTier(
  score: number | null | undefined,
  status: ParticipationStatus | null | undefined,
): ParticipationTier {
  const hasScore = typeof score === 'number' && status !== 'not_established';
  if (!hasScore) return { hasScore: false, tone: 'muted', chip: null };
  if (status === 'overdue') return { hasScore: true, tone: 'danger', chip: { label: 'Overdue' } };
  if (score >= 90) return { hasScore: true, tone: 'success', chip: { label: 'Excellent' } };
  if (score >= 70) return { hasScore: true, tone: 'warning', chip: { label: 'Good' } };
  return { hasScore: true, tone: 'danger', chip: { label: 'Low' } };
}

/** Tailwind classes per tone (tokens only). */
export const PARTICIPATION_TONE_CLASSES: Record<
  ParticipationTone,
  { text: string; ring: string; chip: string }
> = {
  muted: { text: 'text-gray-400', ring: 'border-gray-400', chip: 'bg-muted text-muted-foreground' },
  success: { text: 'text-success', ring: 'border-success', chip: 'bg-success/10 text-success' },
  warning: { text: 'text-accent-600', ring: 'border-accent-600', chip: 'bg-accent-50 text-accent-600' },
  danger: { text: 'text-danger', ring: 'border-danger', chip: 'bg-danger/10 text-danger' },
};

export const NOT_ESTABLISHED_LABEL = 'Not yet established';

export function participationSubtitle(
  score: number | null | undefined,
  status: ParticipationStatus | null | undefined,
): string {
  if (status === 'not_established' || typeof score !== 'number') {
    return 'Not yet established — starts counting when you rate your company.';
  }
  if (status === 'grace') return 'You missed last month — rate this month to stay on track.';
  if (status === 'overdue') return 'Features locked — rate now to unlock.';
  if (score >= 90) return 'Excellent! Keep up your consistency.';
  if (score >= 70) return "Good — don't miss a rating window.";
  return 'Falling behind — rate this month to recover.';
}

export const PARTICIPATION_INFO =
  'Your participation score reflects how consistently you complete your monthly ratings (1st–10th of each month). Completing every rating keeps it high; missed months reduce it. It is separate from your star rating.';

export function participationBannerCopy(
  status: ParticipationStatus | null | undefined,
): string {
  if (status === 'overdue') return 'Your features are locked — rate now to unlock.';
  if (status === 'grace') return 'You missed last month — rate your employer to stay on track.';
  return 'Rate your employer — window closes on the 10th.';
}
