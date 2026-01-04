import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) {
		return json({ count: 'Platform not available (Local Dev?)' });
	}

	const body = await request.json();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const { value } = body;
	console.log(value);

	const id = platform.env.GLOBAL_COUNTER_DO.idFromName('global_counter');
	const stub = platform.env.GLOBAL_COUNTER_DO.get(id);

	if (value) {
		console.log('resetToValue');
		await stub.resetToValue(value);
	} else {
		console.log('reset');
		await stub.reset();
	}

	return json('ok');
};
