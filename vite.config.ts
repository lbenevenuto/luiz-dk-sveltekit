import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit/vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			adapter: 'cloudflare',
			telemetry: false,
			org: 'luiz-personal',
			project: 'luiz-dk',
			// store your auth token in an environment variable
			authToken: process.env.SENTRY_AUTH_TOKEN
		}),
		tailwindcss(),
		sveltekit()
	],

	ssr: {
		noExternal: ['@sentry/sveltekit', 'zod']
	},

	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			// Server/TS code only: Svelte components have no test environment here.
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
			// Floor of the current numbers: ratchet up as coverage grows, never down.
			thresholds: { statements: 81, branches: 73, functions: 75, lines: 82 }
		},

		projects: [
			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
