/**
 * Monthly rating window: ratings can be submitted from the 1st to the 10th
 * of each month (server enforces it in West Africa Time; the UI uses the
 * browser's local day, same as the mobile app).
 */
export const RATING_WINDOW_END = 10;

export function isWithinRatingWindow(date: Date = new Date()): boolean {
  const day = date.getDate();
  return day >= 1 && day <= RATING_WINDOW_END;
}

/** "the 1st and 10th" — used in copy. */
export function ratingWindowLabel(): string {
  return `the 1st and ${RATING_WINDOW_END}th`;
}

export const RATING_UNAVAILABLE_TITLE = 'Rating unavailable';
export const RATING_UNAVAILABLE_MESSAGE = `You can only submit ratings between ${ratingWindowLabel()} of each month.`;
