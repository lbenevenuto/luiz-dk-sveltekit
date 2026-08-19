import { defineConfig } from 'drizzle-kit';

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} environment variable is required for production migrations.`);
	}
	return value;
}

export default defineConfig({
	schema: './src/lib/server/db/schemas',
	out: './migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: required('CLOUDFLARE_ACCOUNT_ID'),
		databaseId: required('CLOUDFLARE_D1_DATABASE_ID'),
		token: required('CLOUDFLARE_API_TOKEN')
	},
	verbose: true,
	strict: true
});
