/**
 * Canonical industry list. Source of truth: `docs/AUTH_FLOWS.md` -> "Lists",
 * mirrored from `app-rateo/src/constants/industries.js` and the server's
 * `normalizeIndustry`. Deliberately coarse - specific niches fall under a broad
 * category. Also used for job categories.
 *
 * The strings are sent verbatim to `PUT /users/profile`; the backend rejects
 * anything outside this list, so never edit an entry without editing the server.
 */
export const INDUSTRIES = [
  'Agriculture & Farming',
  'Animal Care & Veterinary',
  'Automotive',
  'Banking & Financial Services',
  'Construction & Real Estate',
  'Consulting & Professional Services',
  'Creative Arts & Design',
  'Education & Training',
  'Energy & Utilities',
  'Engineering & Manufacturing',
  'Entertainment & Media',
  'Environmental & Waste Management',
  'Fashion & Beauty',
  'Food & Beverage',
  'Government & Public Sector',
  'Healthcare & Pharmaceuticals',
  'Hospitality & Tourism',
  'Human Resources & Recruitment',
  'Information Technology & Software',
  'Insurance',
  'Legal Services',
  'Logistics & Transportation',
  'Marketing & Advertising',
  'Mining & Metals',
  'Non-Profit & NGO',
  'Oil & Gas',
  'Retail & E-commerce',
  'Security Services',
  'Sports & Recreation',
  'Telecommunications',
  'Other',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

/** Exact-match guard. Free text (e.g. "Technology") must never be accepted. */
export function isIndustry(value: string): value is Industry {
  return (INDUSTRIES as readonly string[]).includes(value);
}
