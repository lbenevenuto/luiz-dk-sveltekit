import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schemas';
import { dev } from '$app/environment';
import type { DrizzleClient } from './client';

let db: DrizzleClient;

export async function getDb(platform?: App.Platform): Promise<DrizzleClient> {
	if (dev) {
		if (!db) {
			const { default: Database } = await import('better-sqlite3');
			const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
			const sqlite = new Database('./data/local.db', { fileMustExist: false });
			db = drizzleSqlite(sqlite, { schema });
		}
		return db;
	}

	if (platform?.env?.DB) {
		if (!db) {
			db = drizzle(platform.env.DB, { schema });
		}
		return db;
	}

	throw new Error('Database binding not found. Ensure D1 is configured and passed via platform.env');
}
