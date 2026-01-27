import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const urls = sqliteTable(
	'urls',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		shortCode: text('short_code').notNull().unique(),
		originalUrl: text('original_url').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		expiresAt: integer('expires_at', { mode: 'timestamp' }),
		// Clerk user ID (null for anonymous users)
		userId: text('user_id')
	},
	(table) => [
		index('urls_created_at_idx').on(table.createdAt),
		index('urls_original_url_idx').on(table.originalUrl),
		index('urls_user_id_idx').on(table.userId)
	]
);
