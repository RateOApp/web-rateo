'use client';

import Link from 'next/link';
import {
  Briefcase,
  ChevronRight,
  Hourglass,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { KycBanner } from '@/components/dashboard/kyc-banner';
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
  { label: 'Employees', href: '/dashboard/employees', icon: Hourglass },
  {
    label: 'Candidate preferences',
    href: '/dashboard/candidate-preferences',
    icon: SlidersHorizontal,
  },
  { label: 'My jobs', href: '/dashboard/jobs', icon: Briefcase },
];

/**
 * The company's own profile.
 *
 * Seeded from the server-fetched user so the first paint is complete, then kept
 * live by `useMe()` - the editors on this page invalidate `['me']` rather than
 * writing back the partial `PUT /users/profile` response.
 *
 * The public id is shown as `BID-` here and `ID-` for individuals: support
 * reads these aloud, and the prefix is how they tell a business record from a
 * personal one.
 */
export function CompanyProfile({ user: initialUser }: { user: User }) {
  const { data } = useMe();
  const user = data ?? initialUser;

  const reviews = useUserReviews(user._id);
  const participation = useParticipationStatus();

  const averageRating = reviews.data?.averageRating ?? 0;
  const score = participation.data?.participationScore ?? null;
  const status = participation.data?.participationStatus ?? null;

  const verified = user.kycStatus === 'verified';
  const companyName = user.companyName?.trim() || 'Company';

  return (
    <div className="flex flex-col gap-4">
      {/* ---- header ------------------------------------------------------ */}
      <header className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center sm:flex-row sm:items-start sm:p-6 sm:text-left">
        <UserAvatar
          user={user}
          className="size-16 rounded-2xl sm:size-20 [&_[data-slot=avatar-fallback]]:text-xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="truncate text-xl font-bold text-brand-900">{companyName}</h1>
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
            <p className="mt-0.5 text-xs text-muted-foreground">BID-{user.publicId}</p>
          ) : null}
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <Briefcase aria-hidden="true" className="size-4" />
            {user.industry?.trim() || 'Industry not set'}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-brand-900 sm:justify-start">
            {formatRating(averageRating)}
            <Star aria-hidden="true" className="size-4 fill-star text-star" />
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <Users aria-hidden="true" className="size-4" />
            {user.companySize?.trim() || 'Size not set'}
          </p>
        </div>
      </header>

      <ParticipationStatCard rating={averageRating} score={score} status={status} />

      <KycBanner status={user.kycStatus} />

      {/* ---- about ------------------------------------------------------- */}
      <section className="relative rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="sr-only">About</h2>
        <p className="pr-10 text-sm text-brand-900">
          {user.description?.trim() || 'No description added yet.'}
        </p>
        <Link
          href="/dashboard/profile/bio"
          aria-label="Edit description"
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Link>
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
