/**
 * Job-posting enumerations. Source of truth: `docs/COMPANY_DASHBOARD.md` -> "B.
 * Jobs", mirrored from `app-rateo/src/screens/PostJobScreen.js`. The strings are
 * sent verbatim to `POST /jobs` / `PUT /jobs/:id`, so never reword an entry
 * without checking `server-rateo/src/controllers/jobController.js`.
 *
 * The job *industry* is not here - it reuses the canonical `INDUSTRIES` list
 * from `@/lib/constants/industries`, which the server validates against.
 */

export const JOB_TYPES = [
  'Full time',
  'Part time',
  'Contract',
  'Internship',
  'Freelance',
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const WORK_ARRANGEMENTS = ['Remote', 'Hybrid', 'On-site'] as const;

export type WorkArrangementOption = (typeof WORK_ARRANGEMENTS)[number];

/** Presets for the location picker. A custom location is also accepted. */
export const JOB_LOCATIONS = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Enugu',
  'Remote',
] as const;

/** Suggestions for the skills picker. Custom skills are also accepted. */
export const SKILLS_POOL = [
  'HTML',
  'CSS',
  'Javascript',
  'React Native',
  'React',
  'Node.js',
  'Python',
  'UI Design',
  'UX Design',
  'Project Management',
  'Agile',
  'SQL',
  'NoSQL',
  'DevOps',
  'Cloud Computing',
  'Communication',
  'Leadership',
  'Problem Solving',
] as const;

/** The chip every new posting starts with, as on mobile. */
export const DEFAULT_JOB_SKILLS: string[] = ['Communication'];

export const DEADLINE_OPTIONS = [
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  'Indefinite',
] as const;

export type DeadlineOption = (typeof DEADLINE_OPTIONS)[number];

/** The extra entry that swaps the preset picker for a calendar field. */
export const CUSTOM_DEADLINE_OPTION = 'Pick a specific date';

export const DEFAULT_DEADLINE_OPTION: DeadlineOption = '1 month';

/** Days added to today per preset. `Indefinite` sends `deadline: null`. */
const DEADLINE_DAYS: Record<string, number> = {
  '1 week': 7,
  '2 weeks': 14,
  '1 month': 30,
  '3 months': 90,
};

/** `Both | Male | Female` on screen; `any | male | female` on the wire. */
export const GENDER_OPTIONS = [
  { label: 'Both', value: 'any' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

export type GenderOptionValue = (typeof GENDER_OPTIONS)[number]['value'];

export const DEFAULT_GENDER_PREFERENCE: GenderOptionValue = 'any';

/** Narrows whatever the API stored back onto the three supported values. */
export function toGenderOptionValue(value: string | null | undefined): GenderOptionValue {
  const normalised = value?.trim().toLowerCase();
  const match = GENDER_OPTIONS.find((option) => option.value === normalised);
  return match ? match.value : DEFAULT_GENDER_PREFERENCE;
}

export const JOB_STATUSES = ['open', 'closed'] as const;

export type JobStatusOption = (typeof JOB_STATUSES)[number];

/** `<input type="date">` speaks `YYYY-MM-DD`; today, in the viewer's timezone. */
export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** `"2026-09-30T22:59:00Z" -> "2026-09-30"` (local calendar day). */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Resolves the deadline picker to the ISO instant the API stores.
 *
 * Presets count forward from today (7 / 14 / 30 / 90 days, as on mobile);
 * `Indefinite` and an unusable custom date both mean "no deadline" (`null`).
 * A picked calendar day expires at the END of that day, so a job posted with a
 * deadline of today is still open today.
 */
export function deadlineFromOption(
  option: string,
  customDate?: string | null,
): string | null {
  if (option === CUSTOM_DEADLINE_OPTION) {
    if (!customDate) return null;
    const picked = new Date(`${customDate}T23:59:59`);
    return Number.isNaN(picked.getTime()) ? null : picked.toISOString();
  }

  const days = DEADLINE_DAYS[option];
  if (days === undefined) return null;

  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
