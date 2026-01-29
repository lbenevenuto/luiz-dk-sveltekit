import type { RequestHandler } from './$types';

const publicPaths = ['/', '/shortener', '/about'];

export const GET: RequestHandler = ({ url }) => {
	const baseUrl = url.origin;

	const urls = publicPaths
		.map(
			(path) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
  </url>`
		)
		.join('');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

	return new Response(sitemap.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
