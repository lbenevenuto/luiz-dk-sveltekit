import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { urls } from '$lib/server/db/schemas/urls';
import { generateShortCode } from '$lib/utils/hashids';

export const POST: RequestHandler = async ({ platform, request }) => {
	if (!platform) {
		return json({ count: 'Platform not available (Local Dev?)' });
	}

	const body = await request.json();
	const { url: originalUrl } = body as { url: string };

	const db = await getDb(platform);

	const existing = await db.select().from(urls).where(eq(urls.originalUrl, originalUrl)).get();
	if (existing) {
		return json({
			shortUrl: `https://luiz.dk/s/${existing.shortCode}`,
			originalUrl: existing.originalUrl,
			shortCode: existing.shortCode,
			expiresAt: existing.expiresAt,
			isExisting: true
		});
	}

	const id = platform.env.GLOBAL_COUNTER_DO.idFromName('global_counter');
	const stub = platform.env.GLOBAL_COUNTER_DO.get(id);
	const newCount = await stub.nextValue();
	const shortCode = generateShortCode(newCount, 'abd');

	try {
		const res = await db.insert(urls).values({ shortCode, originalUrl }).returning();
		return json({
			shortUrl: `https://luiz.dk/s/${shortCode}`,
			originalUrl,
			shortCode,
			expiresAt: res[0].expiresAt,
			isExisting: false
		});
	} catch (e: any) {
		return json({ error: e?.message }, { status: 500 });
	}
};
