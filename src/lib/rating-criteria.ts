import { COMPANY_CRITERIA } from '@/lib/rating';

/**
 * Rating criteria and the copy behind the ⓘ icon, ported verbatim from
 * `app-rateo/src/constants/ratingInfo.js`.
 *
 * `COMPANY_CRITERIA` (what an employee scores their employer on) is owned by
 * `@/lib/rating.ts` and re-exported here so every rating screen has one import.
 */
export { COMPANY_CRITERIA } from '@/lib/rating';

/** What an employer scores an employee on. Display order is fixed. */
export const INDIVIDUAL_CRITERIA = [
  'Attendance',
  'Behaviour',
  'Responsibility',
  'Skills',
  'Performance',
] as const;

export type CompanyCriterion = (typeof COMPANY_CRITERIA)[number];
export type IndividualCriterion = (typeof INDIVIDUAL_CRITERIA)[number];

export type CriterionInfo = {
  /** One-line explanation shown under the criterion name. */
  summary: string;
  /** "This rating may include:" bullets. */
  points: string[];
};

/**
 * Only criteria present in this map get an ⓘ icon — same rule as mobile.
 */
export const RATING_CRITERIA_INFO: Record<string, CriterionInfo> = {
  /* --- employee rates employer --------------------------------------- */
  Salary: {
    summary: 'How fairly and reliably the company pays you.',
    points: [
      'Salary paid on time',
      'Fair pay for the role',
      'Bonuses or incentives (if applicable)',
      'Employee benefits (if applicable)',
      'Overtime pay (if applicable)',
    ],
  },
  'Career Growth': {
    summary: 'How much the company helps you grow professionally.',
    points: [
      'Promotion opportunities',
      'Training',
      'Learning new skills',
      'Career progression',
      'Recognition for good work',
    ],
  },
  Management: {
    summary: 'How well leaders and supervisors treat and guide their team.',
    points: [
      'Leadership',
      'Communication',
      'Respect from managers',
      'Fair decision-making',
      'Support from supervisors',
    ],
  },
  'Work Environment': {
    summary: 'What it feels like day to day inside the workplace.',
    points: [
      'Workplace safety',
      'Respect in the workplace',
      'Freedom from bullying or harassment',
      'Working conditions',
      'Workplace culture',
    ],
  },
  Fairness: {
    summary: 'Whether the company treats people equally and keeps its word.',
    points: [
      'Equal treatment',
      'Honesty',
      'Keeping promises',
      'Fair company policies',
      'Respecting employee rights',
    ],
  },

  /* --- employer rates employee --------------------------------------- */
  Attendance: {
    summary: 'How consistently they show up and manage their time.',
    points: [
      'Attendance',
      'Punctuality',
      'Reliability',
      'Time management',
      'Meeting work schedules',
    ],
  },
  Behaviour: {
    summary: 'How they conduct themselves with colleagues and at work.',
    points: [
      'Professionalism',
      'Respect',
      'Teamwork',
      'Communication',
      'Attitude',
      'Following workplace rules',
    ],
  },
  Responsibility: {
    summary: 'How dependably they own their duties and see them through.',
    points: [
      'Accountability',
      'Taking responsibility',
      'Dependability',
      'Commitment',
      'Completing assigned tasks',
      'Initiative',
    ],
  },
  Skills: {
    summary: 'Their knowledge, ability and capacity to learn.',
    points: [
      'Job knowledge',
      'Technical ability',
      'Learning ability',
      'Problem-solving',
      'Competence',
    ],
  },
  Performance: {
    summary: 'The quality and output of the work they deliver.',
    points: [
      'Quality of work',
      'Productivity',
      'Meeting targets',
      'Efficiency',
      'Accuracy',
    ],
  },
};

/** `null` when the label has no explainer (so the ⓘ icon stays hidden). */
export function getCriterionInfo(label: string | null | undefined): CriterionInfo | null {
  const key = String(label ?? '').trim();
  return RATING_CRITERIA_INFO[key] ?? null;
}
