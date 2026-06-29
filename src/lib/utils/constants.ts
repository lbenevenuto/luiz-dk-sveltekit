/**
 * Shared application constants.
 * Single source of truth for values previously duplicated across routes and services.
 */

/** Time ranges (in days) accepted by analytics endpoints. */
export const ALLOWED_DAYS = [7, 30, 90, 180] as const;
export const DEFAULT_DAYS = 7;

/** Page sizes accepted by paginated endpoints. */
export const ALLOWED_PAGE_SIZES = [5, 10, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Allowed characters/length for short codes (used when sanitizing codes before SQL interpolation). */
export const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;
