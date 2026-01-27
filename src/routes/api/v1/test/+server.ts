import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const { auth } = locals;
	console.log('Auth:', auth);

	return json('ok');
};
