import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform) {
		return json({ count: 'Platform not available (Local Dev?)' });
	}

	// 1. Get the ID for the counter (using a fixed name for a global counter)
	const id = platform.env.GLOBAL_COUNTER_DO.idFromName('global_counter');

	// 2. Get the stub
	const stub = platform.env.GLOBAL_COUNTER_DO.get(id);

	// 3. Call the 'increment' method directly (RPC style)
	const newCount = await stub.nextValue();

	return json({
		count: newCount
	});
};
