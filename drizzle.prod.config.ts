import { defineConfig } from 'drizzle-kit';

// Read from env or use known project values
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId) {
	throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required for production migrations.');
}

if (!databaseId) {
	throw new Error('CLOUDFLARE_D1_DATABASE_ID environment variable is required for production migrations.');
}

if (!token) {
	throw new Error('CLOUDFLARE_API_TOKEN environment variable is required for production migrations.');
}

export default defineConfig({
	schema: './src/lib/server/db/schemas',
	out: './migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId,
		databaseId,
		token
	},
	verbose: true,
	strict: true
});
