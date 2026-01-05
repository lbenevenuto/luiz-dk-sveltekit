import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	console.log('hooks.server.ts');

	const response = await resolve(event);
	return response;
};
