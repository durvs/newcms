/**
 * Theme manifest — found in the theme's theme.json file.
 */
export interface ThemeManifest {
	slug: string;
	name: string;
	version: string;
	description?: string;
	author?: string;
	authorUri?: string;
	/** Parent theme slug (for child themes) */
	parent?: string;
	/** Supported features */
	supports?: ThemeSupports;
	/** Menu locations */
	menuLocations?: Record<string, string>;
	/** Design tokens / settings */
	settings?: Record<string, unknown>;
}

export interface ThemeSupports {
	thumbnails?: boolean;
	postFormats?: string[];
	html5?: string[];
	customLogo?: { width?: number; height?: number; flexWidth?: boolean; flexHeight?: boolean };
	customHeader?: { width?: number; height?: number; flexWidth?: boolean; flexHeight?: boolean };
	customBackground?: boolean;
	menus?: boolean;
	feedLinks?: boolean;
	responsiveEmbeds?: boolean;
	blockTemplates?: boolean;
}

export interface ThemeEntry {
	manifest: ThemeManifest;
	path: string;
	active: boolean;
	parentTheme?: ThemeEntry;
}

/**
 * Registry for installed themes.
 */
export class ThemeRegistry {
	private themes: Map<string, ThemeEntry> = new Map();
	private activeSlug: string | null = null;

	register(manifest: ThemeManifest, path: string): void {
		this.themes.set(manifest.slug, { manifest, path, active: false });
	}

	get(slug: string): ThemeEntry | undefined {
		return this.themes.get(slug);
	}

	getAll(): ThemeEntry[] {
		return [...this.themes.values()];
	}

	getActive(): ThemeEntry | undefined {
		if (!this.activeSlug) return undefined;
		return this.themes.get(this.activeSlug);
	}

	/**
	 * Activate a theme. Resolves parent theme for child themes.
	 */
	activate(slug: string): void {
		const theme = this.themes.get(slug);
		if (!theme) throw new Error(`Theme "${slug}" not found`);

		// Deactivate current
		if (this.activeSlug) {
			const current = this.themes.get(this.activeSlug);
			if (current) current.active = false;
		}

		// Resolve parent for child themes
		if (theme.manifest.parent) {
			const parent = this.themes.get(theme.manifest.parent);
			if (!parent) {
				throw new Error(
					`Parent theme "${theme.manifest.parent}" not found for child theme "${slug}"`,
				);
			}
			theme.parentTheme = parent;
		}

		theme.active = true;
		this.activeSlug = slug;
	}

	/**
	 * Check if the active theme supports a feature.
	 */
	supports(feature: keyof ThemeSupports): boolean {
		const active = this.getActive();
		if (!active) return false;

		const supports = active.manifest.supports;
		if (!supports) return false;

		const value = supports[feature];
		if (value === undefined || value === false) return false;
		return true;
	}

	reset(): void {
		this.themes.clear();
		this.activeSlug = null;
	}
}

/**
 * Template hierarchy resolver.
 *
 * Given query flags and context, returns an ordered list of template
 * names to search for (most specific first).
 */
export interface TemplateContext {
	type: 'single' | 'page' | 'category' | 'tag' | 'taxonomy' | 'author' | 'date' | 'search' | '404' | 'home' | 'archive' | 'attachment';
	slug?: string;
	id?: number;
	postType?: string;
	taxonomy?: string;
	term?: string;
	mimeType?: string;
	mimeSubtype?: string;
	nicename?: string;
	customTemplate?: string;
}

export function resolveTemplateHierarchy(ctx: TemplateContext): string[] {
	switch (ctx.type) {
		case 'single':
			return [
				ctx.postType && ctx.slug ? `${ctx.postType}-${ctx.slug}` : null,
				ctx.postType ?? null,
				'singular',
				'index',
			].filter(Boolean) as string[];

		case 'page':
			return [
				ctx.customTemplate ?? null,
				ctx.slug ? `page-${ctx.slug}` : null,
				ctx.id ? `page-${ctx.id}` : null,
				'page',
				'singular',
				'index',
			].filter(Boolean) as string[];

		case 'category':
			return [
				ctx.slug ? `category-${ctx.slug}` : null,
				ctx.id ? `category-${ctx.id}` : null,
				'category',
				'archive',
				'index',
			].filter(Boolean) as string[];

		case 'tag':
			return [
				ctx.slug ? `tag-${ctx.slug}` : null,
				ctx.id ? `tag-${ctx.id}` : null,
				'tag',
				'archive',
				'index',
			].filter(Boolean) as string[];

		case 'taxonomy':
			return [
				ctx.taxonomy && ctx.term ? `taxonomy-${ctx.taxonomy}-${ctx.term}` : null,
				ctx.taxonomy && ctx.id ? `taxonomy-${ctx.taxonomy}-${ctx.id}` : null,
				ctx.taxonomy ? `taxonomy-${ctx.taxonomy}` : null,
				'taxonomy',
				'archive',
				'index',
			].filter(Boolean) as string[];

		case 'author':
			return [
				ctx.nicename ? `author-${ctx.nicename}` : null,
				ctx.id ? `author-${ctx.id}` : null,
				'author',
				'archive',
				'index',
			].filter(Boolean) as string[];

		case 'date':
			return ['date', 'archive', 'index'];

		case 'search':
			return ['search', 'index'];

		case '404':
			return ['404', 'index'];

		case 'home':
			return ['front-page', 'home', 'index'];

		case 'archive':
			return ['archive', 'index'];

		case 'attachment':
			return [
				ctx.mimeType && ctx.mimeSubtype
					? `${ctx.mimeType}-${ctx.mimeSubtype}`
					: null,
				ctx.mimeSubtype ?? null,
				ctx.mimeType ?? null,
				'attachment',
				'single',
				'index',
			].filter(Boolean) as string[];

		default:
			return ['index'];
	}
}
