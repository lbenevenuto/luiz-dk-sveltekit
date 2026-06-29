/**
 * Zod validation schemas for server-side request parsing.
 * Kept separate from `$lib/utils/validation` so lightweight helper imports
 * (e.g. `sanitizeIdentifier`) don't transitively pull in Zod.
 */

import { z } from 'zod';
import { ALLOWED_DAYS, ALLOWED_PAGE_SIZES, DEFAULT_DAYS, DEFAULT_PAGE_SIZE } from '$lib/utils/constants';

/** Zod schema coercing/validating an analytics day range, defaulting to {@link DEFAULT_DAYS}. */
export const daysSchema = z.coerce
	.number()
	.int()
	.refine((v) => (ALLOWED_DAYS as readonly number[]).includes(v))
	.default(DEFAULT_DAYS);

/** Zod schema coercing/validating a page size, defaulting to {@link DEFAULT_PAGE_SIZE}. */
export const pageSizeSchema = z.coerce
	.number()
	.int()
	.refine((v) => (ALLOWED_PAGE_SIZES as readonly number[]).includes(v))
	.default(DEFAULT_PAGE_SIZE);
