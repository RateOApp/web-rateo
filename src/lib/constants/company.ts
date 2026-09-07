/**
 * Company / profile enumerations shared by the setup wizards and (later) the
 * profile editor. Source of truth: `docs/AUTH_FLOWS.md` -> "Lists".
 */

export const COMPANY_SIZES = [
  'Small (1 - 10 employees)',
  'Medium (20 - 50 employees)',
  'Large (50 - 200 employees)',
  'Enterprise (200+ employees)',
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number];

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

export type Gender = (typeof GENDERS)[number];

/**
 * Literal value written to `experience[0].company` when an individual ticks
 * "I'm currently not employed". The backend and the mobile app both match on
 * this exact string, so it must not be reworded.
 */
export const UNEMPLOYED_LABEL = 'Currently Unemployed';

/** Accepted company-logo MIME types (`<input accept>` and client validation). */
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Cloudinary-backed upload ceiling for the logo step. */
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
