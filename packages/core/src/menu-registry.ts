/**
 * Menu navigation system — register menu locations and manage menu items.
 */

export interface MenuLocation {
	name: string;
	description: string;
}

export interface MenuItem {
	id: number;
	title: string;
	url: string;
	target?: string;
	cssClasses?: string[];
	description?: string;
	/** Type: custom, post_type, taxonomy */
	type: 'custom' | 'post_type' | 'taxonomy';
	/** Object ID (post ID or term ID) for non-custom items */
	objectId?: number;
	/** Post type or taxonomy name */
	objectType?: string;
	/** Parent item ID (0 for top-level) */
	parentId: number;
	/** Sort order */
	menuOrder: number;
	/** Children (built client-side from parentId) */
	children?: MenuItem[];
}

export class MenuRegistry {
	private locations: Map<string, MenuLocation> = new Map();

	/**
	 * Register a menu location (e.g., "primary", "footer").
	 */
	registerLocation(name: string, description: string): void {
		this.locations.set(name, { name, description });
	}

	/**
	 * Unregister a menu location.
	 */
	unregisterLocation(name: string): boolean {
		return this.locations.delete(name);
	}

	/**
	 * Get all registered locations.
	 */
	getLocations(): MenuLocation[] {
		return [...this.locations.values()];
	}

	/**
	 * Check if a location is registered.
	 */
	hasLocation(name: string): boolean {
		return this.locations.has(name);
	}

	/**
	 * Build a tree from a flat list of menu items using parentId.
	 */
	static buildTree(items: MenuItem[]): MenuItem[] {
		const map = new Map<number, MenuItem>();
		const roots: MenuItem[] = [];

		// Sort by menuOrder
		const sorted = [...items].sort((a, b) => a.menuOrder - b.menuOrder);

		for (const item of sorted) {
			map.set(item.id, { ...item, children: [] });
		}

		for (const item of sorted) {
			const node = map.get(item.id)!;
			if (item.parentId === 0) {
				roots.push(node);
			} else {
				const parent = map.get(item.parentId);
				if (parent) {
					parent.children = parent.children ?? [];
					parent.children.push(node);
				} else {
					roots.push(node);
				}
			}
		}

		return roots;
	}

	reset(): void {
		this.locations.clear();
	}
}
