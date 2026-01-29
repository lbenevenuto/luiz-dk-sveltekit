export function normalizeRedirectPath(input?: string | null): string {
	if (!input) return '/';
	if (!input.startsWith('/') || input.startsWith('//')) return '/';
	return input;
}
