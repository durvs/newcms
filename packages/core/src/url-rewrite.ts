/**
 * URL Rewrite system — maps URL patterns to query variables.
 *
 * Permalink structures use tags like %year%, %monthnum%, %postname%.
 * The rewriter converts these to regex patterns that capture named groups,
 * then resolves a URL path into query parameters.
 */

export interface RewriteRule {
	/** Regex pattern to match against the URL path */
	pattern: RegExp;
	/** Named query variables extracted from the match */
	queryVars: string[];
	/** Source (e.g., "post_permalink", "category", "custom") */
	source: string;
	/** Priority for ordering (lower = earlier) */
	priority: number;
}

export interface RewriteResult {
	matched: boolean;
	rule?: RewriteRule;
	queryVars: Record<string, string>;
}

/**
 * Permalink structure tags and their regex equivalents.
 */
const STRUCTURE_TAGS: Record<string, { regex: string; queryVar: string }> = {
	'%year%': { regex: '(?<year>\\d{4})', queryVar: 'year' },
	'%monthnum%': { regex: '(?<monthnum>\\d{2})', queryVar: 'monthnum' },
	'%day%': { regex: '(?<day>\\d{2})', queryVar: 'day' },
	'%hour%': { regex: '(?<hour>\\d{2})', queryVar: 'hour' },
	'%minute%': { regex: '(?<minute>\\d{2})', queryVar: 'minute' },
	'%second%': { regex: '(?<second>\\d{2})', queryVar: 'second' },
	'%postname%': { regex: '(?<postname>[^/]+)', queryVar: 'name' },
	'%post_id%': { regex: '(?<post_id>\\d+)', queryVar: 'p' },
	'%category%': { regex: '(?<category>[^/]+)', queryVar: 'category_name' },
	'%tag%': { regex: '(?<tag>[^/]+)', queryVar: 'tag' },
	'%author%': { regex: '(?<author>[^/]+)', queryVar: 'author_name' },
	'%pagename%': { regex: '(?<pagename>[^/]+)', queryVar: 'pagename' },
};

export class UrlRewriter {
	private rules: RewriteRule[] = [];

	/**
	 * Add a rewrite rule.
	 */
	addRule(pattern: RegExp, queryVars: string[], source: string, priority: number = 10): void {
		this.rules.push({ pattern, queryVars, source, priority });
		this.rules.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Generate rules from a permalink structure string.
	 * E.g., "/%year%/%monthnum%/%postname%/"
	 */
	addPermalinkStructure(structure: string, source: string = 'post_permalink'): void {
		let regexStr = structure;
		const queryVars: string[] = [];

		for (const [tag, def] of Object.entries(STRUCTURE_TAGS)) {
			if (regexStr.includes(tag)) {
				regexStr = regexStr.replace(tag, def.regex);
				queryVars.push(def.queryVar);
			}
		}

		// Clean up leading/trailing slashes for matching
		regexStr = regexStr.replace(/^\//, '').replace(/\/$/, '');
		const pattern = new RegExp(`^${regexStr}/?$`);

		this.addRule(pattern, queryVars, source, 5);
	}

	/**
	 * Add default rules for categories, tags, authors, search, pages, feeds.
	 */
	addDefaultRules(): void {
		this.addRule(/^category\/(?<category>[^/]+)\/?$/, ['category_name'], 'category', 10);
		this.addRule(/^tag\/(?<tag>[^/]+)\/?$/, ['tag'], 'tag', 10);
		this.addRule(/^author\/(?<author>[^/]+)\/?$/, ['author_name'], 'author', 10);
		this.addRule(/^search\/(?<s>.+)\/?$/, ['s'], 'search', 10);
		this.addRule(/^page\/(?<paged>\d+)\/?$/, ['paged'], 'paging', 10);
		this.addRule(/^feed\/?(?<feed>rss2?|atom|rdf)?\/?$/, ['feed'], 'feed', 10);
		// Catch-all for pages (lowest priority)
		this.addRule(/^(?<pagename>[^/]+)\/?$/, ['pagename'], 'page', 99);
	}

	/**
	 * Resolve a URL path to query variables.
	 */
	resolve(path: string): RewriteResult {
		// Normalize: strip leading/trailing slashes
		const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');

		for (const rule of this.rules) {
			const match = cleanPath.match(rule.pattern);
			if (match?.groups) {
				const queryVars: Record<string, string> = {};
				for (const [key, value] of Object.entries(match.groups)) {
					if (value !== undefined) {
						// Map regex group name to query var name
						const tag = Object.entries(STRUCTURE_TAGS).find(([_, def]) =>
							def.regex.includes(`<${key}>`),
						);
						queryVars[tag ? tag[1].queryVar : key] = value;
					}
				}
				return { matched: true, rule, queryVars };
			}
		}

		return { matched: false, queryVars: {} };
	}

	/**
	 * Build a permalink URL from a structure and values.
	 * E.g., buildPermalink("/%year%/%monthnum%/%postname%/", { year: "2026", monthnum: "04", postname: "hello" })
	 * → "/2026/04/hello/"
	 */
	static buildPermalink(structure: string, values: Record<string, string>): string {
		let result = structure;
		for (const [tag, def] of Object.entries(STRUCTURE_TAGS)) {
			if (result.includes(tag) && values[def.queryVar]) {
				result = result.replace(tag, values[def.queryVar]);
			}
		}
		return result;
	}

	getRules(): RewriteRule[] {
		return [...this.rules];
	}

	reset(): void {
		this.rules = [];
	}
}
