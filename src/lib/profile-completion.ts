import type { User } from '@/types/api';

export type ProfileCompletion = NonNullable<User['profileCompletion']>;

/**
 * Profile-completion state for the card. Uses the server's `profileCompletion`
 * when present; falls back to the same three checks (same keys/labels as
 * server-rateo/src/utils/profileCompletion.js) while the server isn't deployed.
 * Null for companies / no user.
 */
export function getProfileCompletion(
  user: Pick<User, 'role' | 'skills' | 'experience' | 'resume' | 'profileCompletion'> | null | undefined,
): ProfileCompletion | null {
  if (!user || user.role !== 'individual') return null;
  if (user.profileCompletion !== undefined) return user.profileCompletion;

  const items = [
    { key: 'skills', label: 'Skills', done: Array.isArray(user.skills) && user.skills.length >= 1 },
    {
      key: 'experience',
      label: 'Work experience',
      done: Array.isArray(user.experience) && user.experience.length >= 1,
    },
    { key: 'resume', label: 'CV', done: typeof user.resume === 'string' && user.resume.trim() !== '' },
  ];
  const done = items.filter((i) => i.done).length;
  return { complete: done === items.length, done, total: 3, items };
}
