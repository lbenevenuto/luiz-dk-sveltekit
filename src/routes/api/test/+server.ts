import { json, type RequestHandler } from '@sveltejs/kit';
import { generateShortCode } from '$lib/utils/hashids';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const { code } = body;

	const lala = generateShortCode(code, 'abd');

	return json({ lala });
};
