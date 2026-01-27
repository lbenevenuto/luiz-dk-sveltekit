import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const rateLimits = sqliteTable(
	'rate_limits',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		ipHash: text('ip_hash').notNull(),
		requests: integer('requests').notNull().default(0),
		windowStart: integer('window_start').notNull() // Unix timestamp in seconds
	},
	(table) => [
		index('rate_limits_ip_window_idx').on(table.ipHash, table.windowStart),
		index('rate_limits_window_start_idx').on(table.windowStart)
	]
);

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
