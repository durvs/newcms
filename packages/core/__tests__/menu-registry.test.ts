import { describe, it, expect, beforeEach } from 'vitest';
import { MenuRegistry, type MenuItem } from '../src/menu-registry';

describe('MenuRegistry', () => {
	let registry: MenuRegistry;

	beforeEach(() => {
		registry = new MenuRegistry();
	});

	it('should register and retrieve locations', () => {
		registry.registerLocation('primary', 'Primary Navigation');
		registry.registerLocation('footer', 'Footer Menu');
		expect(registry.getLocations()).toHaveLength(2);
		expect(registry.hasLocation('primary')).toBe(true);
	});

	it('should unregister locations', () => {
		registry.registerLocation('primary', 'Primary');
		registry.unregisterLocation('primary');
		expect(registry.hasLocation('primary')).toBe(false);
	});

	describe('buildTree', () => {
		it('should build a tree from flat items', () => {
			const items: MenuItem[] = [
				{ id: 1, title: 'Home', url: '/', type: 'custom', parentId: 0, menuOrder: 1 },
				{ id: 2, title: 'About', url: '/about', type: 'custom', parentId: 0, menuOrder: 2 },
				{ id: 3, title: 'Team', url: '/about/team', type: 'custom', parentId: 2, menuOrder: 1 },
				{ id: 4, title: 'Contact', url: '/contact', type: 'custom', parentId: 0, menuOrder: 3 },
			];

			const tree = MenuRegistry.buildTree(items);
			expect(tree).toHaveLength(3); // Home, About, Contact
			expect(tree[1].title).toBe('About');
			expect(tree[1].children).toHaveLength(1);
			expect(tree[1].children![0].title).toBe('Team');
		});

		it('should sort by menuOrder', () => {
			const items: MenuItem[] = [
				{ id: 1, title: 'C', url: '/c', type: 'custom', parentId: 0, menuOrder: 3 },
				{ id: 2, title: 'A', url: '/a', type: 'custom', parentId: 0, menuOrder: 1 },
				{ id: 3, title: 'B', url: '/b', type: 'custom', parentId: 0, menuOrder: 2 },
			];

			const tree = MenuRegistry.buildTree(items);
			expect(tree.map((i) => i.title)).toEqual(['A', 'B', 'C']);
		});

		it('should handle deep nesting', () => {
			const items: MenuItem[] = [
				{ id: 1, title: 'L1', url: '/1', type: 'custom', parentId: 0, menuOrder: 1 },
				{ id: 2, title: 'L2', url: '/2', type: 'custom', parentId: 1, menuOrder: 1 },
				{ id: 3, title: 'L3', url: '/3', type: 'custom', parentId: 2, menuOrder: 1 },
			];

			const tree = MenuRegistry.buildTree(items);
			expect(tree).toHaveLength(1);
			expect(tree[0].children![0].children![0].title).toBe('L3');
		});

		it('should handle empty list', () => {
			expect(MenuRegistry.buildTree([])).toHaveLength(0);
		});
	});
});
