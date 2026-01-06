import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schemas',
	out: './migrations',

	dbCredentials: {
		url: './data/local.db'
	},

	verbose: true,
	strict: true,
	dialect: 'sqlite'
});
