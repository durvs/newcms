/**
 * Theme Builder — visual templates for site structure.
 * Each template type maps to a location (header, footer, single, archive, etc.)
 * and has conditions that determine where it applies.
 */

export type TemplateLocation =
	| 'header'
	| 'footer'
	| 'single-post'
	| 'single-page'
	| 'archive'
	| 'search'
	| 'error-404'
	| 'product-single'
	| 'product-archive'
	| 'cart'
	| 'checkout'
	| 'my-account';

export interface TemplateCondition {
	type: 'include' | 'exclude';
	scope: 'general' | 'taxonomy' | 'specific' | 'role';
	/** For general: "all", "singular", "archive" */
	/** For taxonomy: "category/news", "post_tag/featured" */
	/** For specific: "post/42", "page/about" */
	/** For role: "administrator", "editor" */
	value: string;
}

export interface ThemeTemplate {
	id: number;
	title: string;
	location: TemplateLocation;
	conditions: TemplateCondition[];
	/** Priority for conflict resolution (higher = more specific wins) */
	priority: number;
}

export const TEMPLATE_LOCATIONS: { id: TemplateLocation; label: string; description: string }[] = [
	{ id: 'header', label: 'Header', description: 'Global site header' },
	{ id: 'footer', label: 'Footer', description: 'Global site footer' },
	{ id: 'single-post', label: 'Single Post', description: 'Individual post layout' },
	{ id: 'single-page', label: 'Single Page', description: 'Individual page layout' },
	{ id: 'archive', label: 'Archive', description: 'Category, tag, date, and author listings' },
	{ id: 'search', label: 'Search Results', description: 'Search results page' },
	{ id: 'error-404', label: '404 Error', description: 'Page not found' },
	{ id: 'product-single', label: 'Product Page', description: 'Individual product' },
	{ id: 'product-archive', label: 'Shop', description: 'Product listing' },
	{ id: 'cart', label: 'Cart', description: 'Shopping cart' },
	{ id: 'checkout', label: 'Checkout', description: 'Checkout page' },
	{ id: 'my-account', label: 'My Account', description: 'Customer dashboard' },
];

/**
 * Evaluate conditions against a request context.
 * Returns true if the template should apply.
 */
export function evaluateConditions(
	conditions: TemplateCondition[],
	context: {
		type: 'singular' | 'archive' | 'search' | '404' | 'home';
		postType?: string;
		postId?: number;
		taxonomy?: string;
		termSlug?: string;
		userRole?: string;
	},
): boolean {
	const includes = conditions.filter((c) => c.type === 'include');
	const excludes = conditions.filter((c) => c.type === 'exclude');

	// If no include conditions, default include all
	let included = includes.length === 0;

	for (const cond of includes) {
		if (matchCondition(cond, context)) {
			included = true;
			break;
		}
	}

	if (!included) return false;

	// Check excludes
	for (const cond of excludes) {
		if (matchCondition(cond, context)) {
			return false;
		}
	}

	return true;
}

function matchCondition(
	cond: TemplateCondition,
	context: {
		type: string;
		postType?: string;
		postId?: number;
		taxonomy?: string;
		termSlug?: string;
		userRole?: string;
	},
): boolean {
	switch (cond.scope) {
		case 'general':
			if (cond.value === 'all') return true;
			if (cond.value === 'singular') return context.type === 'singular';
			if (cond.value === 'archive') return context.type === 'archive';
			return false;

		case 'taxonomy': {
			const [tax, slug] = cond.value.split('/');
			return context.taxonomy === tax && context.termSlug === slug;
		}

		case 'specific': {
			const [type, id] = cond.value.split('/');
			return context.postType === type && context.postId === Number(id);
		}

		case 'role':
			return context.userRole === cond.value;

		default:
			return false;
	}
}
