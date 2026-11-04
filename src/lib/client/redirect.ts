import { base } from '$app/paths';

const PROBE_ORIGIN = 'http://localhost';

export function normalizeRedirectPath(input?: string | null): string {
	if (!input?.startsWith('/')) return '/';

	// Let the URL parser decide: browsers treat `\` as `/` and strip tabs/newlines,
	// so `/\evil.com` and `/\t/evil.com` both escape to another origin.
	try {
		const url = new URL(input, PROBE_ORIGIN);
		// Dot segments can normalize to `//host` (`/.//evil.com`), which is protocol-relative once returned.
		const sameOrigin = url.origin === PROBE_ORIGIN && !url.pathname.startsWith('//');
		return sameOrigin ? `${url.pathname}${url.search}${url.hash}` : '/';
	} catch {
		return '/';
	}
}

export function withBase(path: string): string {
	if (path === '/') return base || '/';
	return `${base}${path}`;
}
