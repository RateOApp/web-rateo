/**
 * Nigeria's 36 states plus the Federal Capital Territory. Source of truth:
 * `docs/AUTH_FLOWS.md` -> "Lists". Stored verbatim in `user.location`.
 */
export const NIGERIA_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'FCT - Abuja',
] as const;

export type NigeriaState = (typeof NIGERIA_STATES)[number];

/**
 * Options for "Where would you like to work?". The first entry is the default
 * and is stored as-is, so its apostrophe must stay a plain ASCII `'` (the
 * mobile app drifted to a typographic one - `docs/AUTH_FLOWS.md` wins).
 */
export const WORK_LOCATIONS = [
  "I'm open to work anywhere",
  'Remote',
  ...NIGERIA_STATES,
] as const;

export type WorkLocation = (typeof WORK_LOCATIONS)[number];

/** The pre-selected option on step 2 of the individual wizard. */
export const DEFAULT_WORK_LOCATION: WorkLocation = WORK_LOCATIONS[0];
