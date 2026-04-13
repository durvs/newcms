import type { ElementNode } from './types';

/**
 * Walk the tree depth-first, calling visitor for each node.
 * If visitor returns false, stop walking children of that node.
 */
export function walkTree(
	elements: ElementNode[],
	visitor: (node: ElementNode, depth: number, path: string[]) => void | false,
	depth: number = 0,
	path: string[] = [],
): void {
	for (const el of elements) {
		const currentPath = [...path, el.id];
		const result = visitor(el, depth, currentPath);
		if (result !== false) {
			walkTree(el.elements, visitor, depth + 1, currentPath);
		}
	}
}

/**
 * Flatten the tree into a list of all nodes.
 */
export function flattenTree(elements: ElementNode[]): ElementNode[] {
	const result: ElementNode[] = [];
	walkTree(elements, (node) => {
		result.push(node);
	});
	return result;
}

/**
 * Get all ancestor nodes of a target (from root to parent).
 */
export function getAncestors(elements: ElementNode[], targetId: string): ElementNode[] {
	const ancestors: ElementNode[] = [];

	function search(nodes: ElementNode[], chain: ElementNode[]): boolean {
		for (const node of nodes) {
			if (node.id === targetId) {
				ancestors.push(...chain);
				return true;
			}
			if (search(node.elements, [...chain, node])) return true;
		}
		return false;
	}

	search(elements, []);
	return ancestors;
}

/**
 * Get all descendant nodes of a target (children, grandchildren, etc.).
 */
export function getDescendants(node: ElementNode): ElementNode[] {
	const result: ElementNode[] = [];
	for (const child of node.elements) {
		result.push(child);
		result.push(...getDescendants(child));
	}
	return result;
}

/**
 * Find all nodes matching a predicate.
 */
export function findAll(
	elements: ElementNode[],
	predicate: (node: ElementNode) => boolean,
): ElementNode[] {
	const result: ElementNode[] = [];
	walkTree(elements, (node) => {
		if (predicate(node)) result.push(node);
	});
	return result;
}

/**
 * Find all widgets of a specific type.
 */
export function findWidgetsByType(elements: ElementNode[], widgetType: string): ElementNode[] {
	return findAll(elements, (node) => node.elType === 'widget' && node.widgetType === widgetType);
}

/**
 * Get the maximum depth of the tree.
 */
export function getMaxDepth(elements: ElementNode[]): number {
	if (elements.length === 0) return 0;
	let max = 0;
	walkTree(elements, (_node, depth) => {
		if (depth > max) max = depth;
	});
	return max + 1;
}
