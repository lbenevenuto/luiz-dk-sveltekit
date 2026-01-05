import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '../$types';
import { getDb } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { urls } from '$lib/server/db/schemas';

export const GET: RequestHandler = async ({ platform, url, params }) => {
	console.log('GET');
	console.log(url);
	console.log(params);

	const { shortCode } = params as { shortCode: string };

	const db = await getDb(platform);
	const res = await db.query.urls.findFirst({ where: eq(urls.shortCode, shortCode) });
	if (res) {
		console.log('******* Found');
		console.log(res);
		throw redirect(302, res.originalUrl);
	}

	throw redirect(302, 'https://luiz.dk');
};
