import type { PostTypeDefinition } from './types';

/**
 * Registry for content types (post types).
 *
 * Manages registration and lookup of all content types in the system.
 * Built-in types (post, page, attachment, revision, nav_menu_item) are
 * registered during bootstrap; custom types are registered by extensions.
 */
export class PostTypeRegistry {
	private types: Map<string, PostTypeDefinition> = new Map();

	/**
	 * Register a new post type.
	 *
	 * @throws If a type with the same name is already registered
	 */
	register(definition: PostTypeDefinition): void {
		if (this.types.has(definition.name)) {
			throw new Error(`Post type "${definition.name}" is already registered.`);
		}
		this.types.set(definition.name, definition);
	}

	/**
	 * Get a post type definition by name.
	 */
	get(name: string): PostTypeDefinition | undefined {
		return this.types.get(name);
	}

	/**
	 * Check if a post type is registered.
	 */
	has(name: string): boolean {
		return this.types.has(name);
	}

	/**
	 * Get all registered post types.
	 */
	getAll(): PostTypeDefinition[] {
		return [...this.types.values()];
	}

	/**
	 * Get only public post types (for REST API, search, etc).
	 */
	getPublic(): PostTypeDefinition[] {
		return this.getAll().filter((t) => t.public !== false);
	}

	/**
	 * Get post types that are exposed via REST API.
	 */
	getRestVisible(): PostTypeDefinition[] {
		return this.getAll().filter((t) => t.showInRest === true);
	}

	/**
	 * Unregister a post type. Only custom types can be unregistered.
	 */
	unregister(name: string): boolean {
		return this.types.delete(name);
	}

	/**
	 * Reset registry — for testing only.
	 */
	reset(): void {
		this.types.clear();
	}
}

/**
 * Built-in post type definitions, registered during bootstrap.
 */
export const BUILTIN_POST_TYPES: PostTypeDefinition[] = [
	{
		name: 'post',
		label: 'Posts',
		labels: { singular: 'Post', plural: 'Posts' },
		public: true,
		hierarchical: false,
		showInRest: true,
		restBase: 'posts',
		supports: [
			'title',
			'editor',
			'author',
			'thumbnail',
			'excerpt',
			'trackbacks',
			'custom-fields',
			'comments',
			'revisions',
			'post-formats',
		],
		taxonomies: ['category', 'post_tag'],
		hasArchive: true,
		rewrite: { slug: '', withFront: true },
		menuPosition: 5,
		capability_type: 'post',
	},
	{
		name: 'page',
		label: 'Pages',
		labels: { singular: 'Page', plural: 'Pages' },
		public: true,
		hierarchical: true,
		showInRest: true,
		restBase: 'pages',
		supports: [
			'title',
			'editor',
			'author',
			'thumbnail',
			'page-attributes',
			'custom-fields',
			'comments',
			'revisions',
		],
		taxonomies: [],
		hasArchive: false,
		rewrite: { slug: '', withFront: false },
		menuPosition: 20,
		capability_type: 'page',
	},
	{
		name: 'attachment',
		label: 'Media',
		labels: { singular: 'Media', plural: 'Media' },
		public: true,
		hierarchical: false,
		showInRest: true,
		restBase: 'media',
		supports: ['title', 'author', 'comments'],
		taxonomies: [],
		hasArchive: false,
		rewrite: false,
		capability_type: 'post',
	},
	{
		name: 'revision',
		label: 'Revisions',
		labels: { singular: 'Revision', plural: 'Revisions' },
		public: false,
		hierarchical: false,
		showInRest: false,
		supports: ['author'],
		taxonomies: [],
		hasArchive: false,
		rewrite: false,
		capability_type: 'post',
	},
	{
		name: 'nav_menu_item',
		label: 'Navigation Menu Items',
		labels: { singular: 'Navigation Menu Item', plural: 'Navigation Menu Items' },
		public: false,
		hierarchical: false,
		showInRest: false,
		supports: [],
		taxonomies: ['nav_menu'],
		hasArchive: false,
		rewrite: false,
		capability_type: 'post',
	},
];
