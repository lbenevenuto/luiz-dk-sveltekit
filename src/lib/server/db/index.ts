import { dev } from '$app/environment';
import { createD1Client, createSQLiteClient } from './client';
import type { DrizzleClient } from './client';

let db: DrizzleClient;

export async function getDb(platform?: App.Platform): Promise<DrizzleClient> {
	if (dev) {
		if (!db) {
			db = await createSQLiteClient();
		}
		return db;
	}

	if (platform?.env?.DB) {
		if (!db) {
			db = await createD1Client(platform.env.DB);
		}
		return db;
	}

	throw new Error('Database binding not found. Ensure D1 is configured and passed via platform.env');
}
