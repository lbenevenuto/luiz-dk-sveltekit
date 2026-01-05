import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schemas',
	out: './migrations',

	dbCredentials: {
		url: process.env.DATABASE_URL || 'sqlite.db'
	},

	verbose: true,
	strict: true,
	dialect: 'sqlite'
});
