export const load = async ({ platform }: { platform?: App.Platform }) => {
	const clerkPublishableKey = platform?.env.CLERK_PUBLISHABLE_KEY || '';
	const clerkFrontendApi = platform?.env.CLERK_FRONTEND_API || '';

	console.log('[Layout Server] Clerk config:', {
		hasPlatform: !!platform,
		hasEnv: !!platform?.env,
		publishableKey: clerkPublishableKey ? `${clerkPublishableKey.substring(0, 20)}...` : 'MISSING',
		frontendApi: clerkFrontendApi || 'MISSING'
	});

	return {
		clerkPublishableKey,
		clerkFrontendApi
	};
};
