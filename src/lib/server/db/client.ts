/**
 * Drizzle Database Clients
 * Provides configured Drizzle instances for D1 (production) and SQLite (local)
 */

import * as schema from '$lib/server/db/schemas';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/**
 * Create Drizzle client for Cloudflare D1
 */
export async function createD1Client(d1: D1Database) {
	const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');
	return drizzleD1(d1, { schema });
}

/**
 * Create Drizzle client for SQLite (local development)
 */
export async function createSQLiteClient(dbPath: string = './data/local.db') {
	const { default: Database } = await import('better-sqlite3');
	const { drizzle: drizzleSQLite } = await import('drizzle-orm/better-sqlite3');
	const sqlite = new Database(dbPath, { fileMustExist: false });
	sqlite.pragma('journal_mode = WAL');
	return drizzleSQLite(sqlite, { schema });
}

/**
 * Type exports
 */
export type D1DrizzleClient = DrizzleD1Database<typeof schema>;
export type SQLiteDrizzleClient = BetterSQLite3Database<typeof schema>;
export type DrizzleClient = D1DrizzleClient | SQLiteDrizzleClient;
