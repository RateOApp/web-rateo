/**
 * Suggestions for the individual setup wizard's job-title field. Source of
 * truth: `docs/AUTH_FLOWS.md` -> "Lists" (28 titles), mirrored from
 * `app-rateo/src/screens/IndividualSetupScreen.js`.
 *
 * Unlike industries this list is NOT closed: the field accepts free text and
 * the backend stores whatever is typed.
 */
export const JOB_TITLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'Software Architect',
  'Data Scientist',
  'Data Analyst',
  'Data Engineer',
  'DevOps Engineer',
  'QA Engineer',
  'Product Manager',
  'Project Manager',
  'Product Designer',
  'UI/UX Designer',
  'Graphic Designer',
  'Designer',
  'Marketing Manager',
  'Digital Marketer',
  'Content Writer',
  'Sales Executive',
  'Business Analyst',
  'Business Development Manager',
  'Accountant',
  'Financial Analyst',
  'Human Resources Manager',
  'Customer Support Specialist',
  'Operations Manager',
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];
