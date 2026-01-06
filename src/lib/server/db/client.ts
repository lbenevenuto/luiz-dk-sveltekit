/**
 * Drizzle Database Clients
 * Provides configured Drizzle instances for D1 (production) and SQLite (local)
 */

import * as schema from '$lib/server/db/schemas';

/**
 * Create Drizzle client for Cloudflare D1
 */
export async function createD1Client(d1: D1Database) {
	console.log('Creating D1 client');

	const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');
	return drizzleD1(d1, { schema });
}

/**
 * Create Drizzle client for SQLite (local development)
 */
export async function createSQLiteClient(dbPath: string = './data/local.db') {
	console.log('Creating SQLite client for path:', dbPath);

	const { default: Database } = await import('better-sqlite3');
	const { drizzle: drizzleSQLite } = await import('drizzle-orm/better-sqlite3');
	const sqlite = new Database(dbPath, { verbose: console.log, fileMustExist: false });
	sqlite.pragma('journal_mode = WAL');
	return drizzleSQLite(sqlite, { schema });
}

/**
 * Type exports
 */
export type D1DrizzleClient = ReturnType<typeof createD1Client>;
export type SQLiteDrizzleClient = ReturnType<typeof createSQLiteClient>;
export type DrizzleClient = D1DrizzleClient | SQLiteDrizzleClient;
