import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShortUrl } from '$lib/utils';

export const POST: RequestHandler = async ({ platform, request }) => {
	const body = await request.json();
	const { url: originalUrl } = body as { url: string };

	const shortCode = await createShortUrl(originalUrl, null, platform);
	return json({ ...shortCode, url: originalUrl });
};
