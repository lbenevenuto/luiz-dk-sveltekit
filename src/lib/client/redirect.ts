import { base } from '$app/paths';

export function normalizeRedirectPath(input?: string | null): string {
	if (!input) return '/';
	if (!input.startsWith('/') || input.startsWith('//')) return '/';
	return input;
}

export function withBase(path: string): string {
	if (path === '/') return base || '/';
	return `${base}${path}`;
}
