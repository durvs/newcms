import type { TagDefinition, TagContext } from './types';

/**
 * Registry of dynamic tag providers.
 */
export class DynamicTagRegistry {
	private tags: Map<string, TagDefinition> = new Map();

	register(tag: TagDefinition): void {
		this.tags.set(tag.name, tag);
	}

	get(name: string): TagDefinition | undefined {
		return this.tags.get(name);
	}

	getByCategory(category: string): TagDefinition[] {
		return [...this.tags.values()].filter((t) => t.category === category);
	}

	getAll(): TagDefinition[] {
		return [...this.tags.values()];
	}

	getCategories(): string[] {
		return [...new Set(this.getAll().map((t) => t.category))];
	}

	resolve(name: string, settings: Record<string, unknown>, context: TagContext): unknown {
		const tag = this.tags.get(name);
		if (!tag) return '';
		return tag.resolve(settings, context);
	}

	reset(): void {
		this.tags.clear();
	}
}

/**
 * Built-in tag definitions.
 */
export const BUILTIN_TAGS: TagDefinition[] = [
	// Post
	{
		name: 'post-title',
		title: 'Post Title',
		category: 'post',
		returnType: 'text',
		resolve: (_, ctx) => ctx.postTitle ?? '',
	},
	{
		name: 'post-content',
		title: 'Post Content',
		category: 'post',
		returnType: 'html',
		resolve: (_, ctx) => ctx.postContent ?? '',
	},
	{
		name: 'post-excerpt',
		title: 'Post Excerpt',
		category: 'post',
		returnType: 'text',
		resolve: (_, ctx) => ctx.postExcerpt ?? '',
	},
	{
		name: 'post-date',
		title: 'Post Date',
		category: 'post',
		returnType: 'text',
		resolve: (_, ctx) => ctx.postDate ?? '',
	},
	{
		name: 'post-url',
		title: 'Post URL',
		category: 'post',
		returnType: 'url',
		resolve: (_, ctx) => ctx.postUrl ?? '',
	},
	{
		name: 'post-id',
		title: 'Post ID',
		category: 'post',
		returnType: 'text',
		resolve: (_, ctx) => String(ctx.postId ?? ''),
	},
	{
		name: 'featured-image',
		title: 'Featured Image',
		category: 'post',
		returnType: 'url',
		resolve: (_, ctx) => ctx.featuredImage ?? '',
	},

	// Site
	{
		name: 'site-name',
		title: 'Site Name',
		category: 'site',
		returnType: 'text',
		resolve: (_, ctx) => ctx.siteName ?? '',
	},
	{
		name: 'site-url',
		title: 'Site URL',
		category: 'site',
		returnType: 'url',
		resolve: (_, ctx) => ctx.siteUrl ?? '',
	},
	{
		name: 'site-description',
		title: 'Site Description',
		category: 'site',
		returnType: 'text',
		resolve: (_, ctx) => ctx.siteDescription ?? '',
	},

	// Author
	{
		name: 'author-name',
		title: 'Author Name',
		category: 'author',
		returnType: 'text',
		resolve: (_, ctx) => ctx.authorName ?? '',
	},
	{
		name: 'author-bio',
		title: 'Author Bio',
		category: 'author',
		returnType: 'text',
		resolve: (_, ctx) => ctx.authorBio ?? '',
	},
	{
		name: 'author-avatar',
		title: 'Author Avatar',
		category: 'author',
		returnType: 'url',
		resolve: (_, ctx) => ctx.authorAvatar ?? '',
	},

	// Actions
	{
		name: 'current-date',
		title: 'Current Date',
		category: 'actions',
		returnType: 'text',
		resolve: () => new Date().toLocaleDateString(),
	},
	{
		name: 'current-time',
		title: 'Current Time',
		category: 'actions',
		returnType: 'text',
		resolve: () => new Date().toLocaleTimeString(),
	},
	{
		name: 'current-year',
		title: 'Current Year',
		category: 'actions',
		returnType: 'text',
		resolve: () => String(new Date().getFullYear()),
	},

	// Custom field
	{
		name: 'custom-field',
		title: 'Custom Field',
		category: 'custom',
		returnType: 'text',
		resolve: (settings, ctx) => {
			const key = String(settings.key ?? '');
			return ctx.customFields?.[key] ?? '';
		},
	},
];
