/**
 * Sitemap XML generator.
 * Generates index + paginated sub-sitemaps for posts, pages, taxonomies, authors.
 */

export interface SitemapEntry {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
}

export interface SitemapIndex {
	sitemaps: { loc: string; lastmod?: string }[];
}

const URLS_PER_SITEMAP = 2000;

/**
 * Generate sitemap XML from entries.
 */
export function generateSitemapXml(entries: SitemapEntry[]): string {
	const urls = entries.map((e) => {
		const parts = [`    <loc>${escapeXml(e.loc)}</loc>`];
		if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
		if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
		if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
		return `  <url>\n${parts.join('\n')}\n  </url>`;
	});

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/**
 * Generate sitemap index XML.
 */
export function generateSitemapIndexXml(index: SitemapIndex): string {
	const sitemaps = index.sitemaps.map((s) => {
		const parts = [`    <loc>${escapeXml(s.loc)}</loc>`];
		if (s.lastmod) parts.push(`    <lastmod>${s.lastmod}</lastmod>`);
		return `  <sitemap>\n${parts.join('\n')}\n  </sitemap>`;
	});

	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
}

/**
 * Paginate entries into sub-sitemaps.
 */
export function paginateEntries(entries: SitemapEntry[], perPage: number = URLS_PER_SITEMAP): SitemapEntry[][] {
	const pages: SitemapEntry[][] = [];
	for (let i = 0; i < entries.length; i += perPage) {
		pages.push(entries.slice(i, i + perPage));
	}
	return pages;
}

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
