import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';

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
		noExternal: ['@sentry/sveltekit']
	},

	test: {
		expect: { requireAssertions: true },

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
