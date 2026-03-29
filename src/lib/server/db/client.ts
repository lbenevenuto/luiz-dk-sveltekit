/**
 * Drizzle Database Clients
 * Provides configured Drizzle instances for D1 (production) and SQLite (local)
 */

import * as schema from '$lib/server/db/schemas';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/**
 * Common Drizzle client type that works with both D1 (async) and better-sqlite3 (sync).
 * Uses the shared base class rather than a union of driver-specific types,
 * which avoids type incompatibilities in query builder methods.
 */
export type DrizzleClient = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>;

/**
 * Create Drizzle client for Cloudflare D1
 */
export async function createD1Client(d1: D1Database): Promise<DrizzleClient> {
	const { drizzle: drizzleD1 } = await import('drizzle-orm/d1');
	return drizzleD1(d1, { schema });
}

/**
 * Create Drizzle client for SQLite (local development)
 */
export async function createSQLiteClient(dbPath: string = './data/local.db'): Promise<DrizzleClient> {
	const { default: Database } = await import('better-sqlite3');
	const { drizzle: drizzleSQLite } = await import('drizzle-orm/better-sqlite3');
	const sqlite = new Database(dbPath, { fileMustExist: false });
	sqlite.pragma('journal_mode = WAL');
	return drizzleSQLite(sqlite, { schema });
}
