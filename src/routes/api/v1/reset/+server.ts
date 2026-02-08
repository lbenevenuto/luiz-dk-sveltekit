import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { z } from 'zod/v4';

const resetSchema = z
	.object({
		value: z.number().int().min(0).optional()
	})
	.strict();

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	// Only admins can reset the counter
	requireAdmin(locals);

	if (!platform) {
		return json({ count: 'Platform not available (Local Dev?)' });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const parsed = resetSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Validation failed', details: z.prettifyError(parsed.error) }, { status: 400 });
	}

	const { value } = parsed.data;

	const id = platform.env.GLOBAL_COUNTER_DO.idFromName('global_counter');
	const stub = platform.env.GLOBAL_COUNTER_DO.get(id);

	const retObj = {
		status: 'ok',
		value: value,
		type: ''
	};

	if (typeof value === 'number') {
		retObj.type = 'resetToValue';
		await stub.resetToValue(value);
	} else {
		retObj.type = 'reset';
		await stub.reset();
	}

	return json(retObj);
};
