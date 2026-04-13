import type { TaxonomyDefinition } from './types';

/**
 * Registry for taxonomies (categories, tags, custom taxonomies).
 */
export class TaxonomyRegistry {
	private taxonomies: Map<string, TaxonomyDefinition> = new Map();

	register(definition: TaxonomyDefinition): void {
		if (this.taxonomies.has(definition.name)) {
			throw new Error(`Taxonomy "${definition.name}" is already registered.`);
		}
		this.taxonomies.set(definition.name, definition);
	}

	get(name: string): TaxonomyDefinition | undefined {
		return this.taxonomies.get(name);
	}

	has(name: string): boolean {
		return this.taxonomies.has(name);
	}

	getAll(): TaxonomyDefinition[] {
		return [...this.taxonomies.values()];
	}

	/**
	 * Get taxonomies assigned to a specific object type (e.g., 'post').
	 */
	getForObjectType(objectType: string): TaxonomyDefinition[] {
		return this.getAll().filter((t) => t.objectTypes.includes(objectType));
	}

	getRestVisible(): TaxonomyDefinition[] {
		return this.getAll().filter((t) => t.showInRest === true);
	}

	unregister(name: string): boolean {
		return this.taxonomies.delete(name);
	}

	reset(): void {
		this.taxonomies.clear();
	}
}

export const BUILTIN_TAXONOMIES: TaxonomyDefinition[] = [
	{
		name: 'category',
		objectTypes: ['post'],
		label: 'Categories',
		labels: { singular: 'Category', plural: 'Categories' },
		public: true,
		hierarchical: true,
		showInRest: true,
		restBase: 'categories',
		rewrite: { slug: 'category', withFront: true, hierarchical: true },
	},
	{
		name: 'post_tag',
		objectTypes: ['post'],
		label: 'Tags',
		labels: { singular: 'Tag', plural: 'Tags' },
		public: true,
		hierarchical: false,
		showInRest: true,
		restBase: 'tags',
		rewrite: { slug: 'tag', withFront: true },
	},
	{
		name: 'nav_menu',
		objectTypes: ['nav_menu_item'],
		label: 'Navigation Menus',
		labels: { singular: 'Navigation Menu', plural: 'Navigation Menus' },
		public: false,
		hierarchical: false,
		showInRest: false,
		rewrite: false,
	},
];
