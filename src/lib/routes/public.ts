export const PUBLIC_ROUTES = [
	'/',
	'/about',
	'/login',
	'/register',
	'/forgot-password',
	'/403',
	'/shortener',
	'/api/v1/shorten',
	'/api/webhooks/clerk'
];

export function isPublicRoute(pathname: string): boolean {
	if (PUBLIC_ROUTES.includes(pathname)) {
		return true;
	}

	if (pathname.startsWith('/s/')) return true;
	if (pathname.startsWith('/api/webhooks/')) return true;

	return false;
}
