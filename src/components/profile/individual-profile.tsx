'use client';

import Link from 'next/link';
import {
  Briefcase,
  Building2,
  ChevronRight,
  FileText,
  Flag,
  Hourglass,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import { ParticipationStatCard } from '@/components/dashboard/participation-stat-card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { useMe } from '@/hooks/use-me';
import { useParticipationStatus } from '@/hooks/use-participation';
import { useUserReviews } from '@/hooks/use-reviews';
import { formatRating } from '@/lib/rating';
import type { User } from '@/types/api';

type MenuItem = { label: string; href: string; icon: LucideIcon };

const MENU: MenuItem[] = [
  { label: 'Edit profile information', href: '/dashboard/profile/edit', icon: UserRound },
  { label: 'Update skills', href: '/dashboard/profile/skills', icon: Flag },
  { label: 'Work history', href: '/dashboard/work-history', icon: Hourglass },
  { label: 'Request to join a company', href: '/dashboard/request-company', icon: Building2 },
  { label: 'Job preferences', href: '/dashboard/preferences', icon: SlidersHorizontal },
  { label: 'My Resume', href: '/dashboard/resume', icon: FileText },
];

/**
 * The individual's own profile.
 *
 * Seeded from the server-fetched user so the first paint is complete, then kept
 * live by `useMe()` - every editor on this page invalidates `['me']` rather
 * than writing back the partial `PUT /users/profile` response.
 */
export function IndividualProfile({ user: initialUser }: { user: User }) {
  const { data } = useMe();
  const user = data ?? initialUser;

  const reviews = useUserReviews(user._id);
  const participation = useParticipationStatus();

  const averageRating = reviews.data?.averageRating ?? 0;
  const score = participation.data?.participationScore ?? null;
  const status = participation.data?.participationStatus ?? null;

  const verified = user.kycStatus === 'verified';
  const currentJob = user.experience?.find((entry) => entry.current) ?? user.experience?.[0];
  const jobTitle = currentJob?.title?.trim() || 'Job Seeker';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'User';

  return (
    <div className="flex flex-col gap-4">
      {/* ---- header ------------------------------------------------------ */}
      <header className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center sm:flex-row sm:items-start sm:p-6 sm:text-left">
        <UserAvatar user={user} className="size-16 sm:size-20 [&_[data-slot=avatar-fallback]]:text-xl" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="truncate text-xl font-bold text-brand-900">{fullName}</h1>
            {user.isOg ? (
              <Badge
                className="bg-accent-600 text-white"
                title="Original Gangster - early Rate'O member"
              >
                OG
              </Badge>
            ) : null}
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Verified
              </span>
            ) : (
              <Link
                href="/dashboard/kyc"
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <ShieldAlert aria-hidden="true" className="size-3.5" />
                Unverified
              </Link>
            )}
          </div>

          {user.publicId ? (
            <p className="mt-0.5 text-xs text-muted-foreground">ID-{user.publicId}</p>
          ) : null}
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <Briefcase aria-hidden="true" className="size-4" />
            {jobTitle}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-brand-900 sm:justify-start">
            {formatRating(averageRating)}
            <Star aria-hidden="true" className="size-4 fill-star text-star" />
          </p>
        </div>
      </header>

      <ParticipationStatCard rating={averageRating} score={score} status={status} />

      {/* ---- bio --------------------------------------------------------- */}
      <section className="relative rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="sr-only">Bio</h2>
        <p className="pr-10 text-sm text-brand-900">{user.bio?.trim() || 'No bio added yet.'}</p>
        <Link
          href="/dashboard/profile/bio"
          aria-label="Edit bio"
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Link>
      </section>

      {/* ---- skills ------------------------------------------------------ */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-brand-900">Skills</h2>
        {user.skills?.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <li
                key={`${skill}-${index}`}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No skills added</p>
        )}
      </section>

      {/* ---- menu -------------------------------------------------------- */}
      <nav aria-label="Profile sections">
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {MENU.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted"
              >
                <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-700" />
                <span className="min-w-0 flex-1 text-sm font-medium text-brand-900">{label}</span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
