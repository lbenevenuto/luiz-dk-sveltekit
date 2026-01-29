import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schemas';
import { dev } from '$app/environment';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export let db: DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema>;

export async function getDb(platform?: App.Platform) {
	if (dev) {
		// Re-use connection if possible or create new.
		// For better-sqlite3, creating new every time is fine but singleton is better.
		if (!db) {
			const { default: Database } = await import('better-sqlite3');
			const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
			const sqlite = new Database('./data/local.db', { fileMustExist: false });
			db = drizzleSqlite(sqlite, { schema });
		}
		return db;
	}

	if (platform?.env?.DB) {
		return drizzle(platform.env.DB, { schema });
	}

	throw new Error('Database binding not found. Ensure D1 is configured and passed via platform.env');
}
