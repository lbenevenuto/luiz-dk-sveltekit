export const load = async ({ platform }: { platform?: App.Platform }) => {
	const clerkPublishableKey = platform?.env.CLERK_PUBLISHABLE_KEY || '';
	const clerkFrontendApi = platform?.env.CLERK_FRONTEND_API || '';

	return {
		clerkPublishableKey,
		clerkFrontendApi
	};
};
