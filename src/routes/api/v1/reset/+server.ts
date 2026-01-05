import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) {
		return json({ count: 'Platform not available (Local Dev?)' });
	}

	const body = await request.json();
	const { value } = body as { value: number };

	const id = platform.env.GLOBAL_COUNTER_DO.idFromName('global_counter');
	const stub = platform.env.GLOBAL_COUNTER_DO.get(id);

	const retObj = {
		status: 'ok',
		value: value,
		type: ''
	};

	if (value) {
		console.log('resetToValue');
		retObj.type = 'resetToValue';
		await stub.resetToValue(value);
	} else {
		console.log('reset');
		retObj.type = 'reset';
		await stub.reset();
	}

	return json(retObj);
};
