import { type ElementNode, generateElementId } from './types';

/**
 * Find a node by ID in the tree. Returns undefined if not found.
 */
export function findById(elements: ElementNode[], id: string): ElementNode | undefined {
	for (const el of elements) {
		if (el.id === id) return el;
		const found = findById(el.elements, id);
		if (found) return found;
	}
	return undefined;
}

/**
 * Find the parent of a node by the child's ID.
 * Returns { parent, index } or undefined.
 */
export function findParent(
	elements: ElementNode[],
	childId: string,
): { parent: ElementNode | null; index: number } | undefined {
	for (let i = 0; i < elements.length; i++) {
		if (elements[i].id === childId) {
			return { parent: null, index: i }; // root-level element
		}
	}

	for (const el of elements) {
		for (let i = 0; i < el.elements.length; i++) {
			if (el.elements[i].id === childId) {
				return { parent: el, index: i };
			}
		}
		const found = findParent(el.elements, childId);
		if (found) return found;
	}

	return undefined;
}

/**
 * Insert a node into the tree.
 * If parentId is null, inserts at root level.
 * Returns a new tree (immutable).
 */
export function insertNode(
	elements: ElementNode[],
	node: ElementNode,
	parentId: string | null,
	index?: number,
): ElementNode[] {
	if (parentId === null) {
		const idx = index ?? elements.length;
		return [...elements.slice(0, idx), node, ...elements.slice(idx)];
	}

	return elements.map((el) => {
		if (el.id === parentId) {
			const idx = index ?? el.elements.length;
			return {
				...el,
				elements: [...el.elements.slice(0, idx), node, ...el.elements.slice(idx)],
			};
		}
		return { ...el, elements: insertNode(el.elements, node, parentId, index) };
	});
}

/**
 * Remove a node from the tree by ID.
 * Returns a new tree (immutable).
 */
export function removeNode(elements: ElementNode[], id: string): ElementNode[] {
	return elements
		.filter((el) => el.id !== id)
		.map((el) => ({
			...el,
			elements: removeNode(el.elements, id),
		}));
}

/**
 * Move a node to a new position.
 * Returns a new tree (immutable).
 */
export function moveNode(
	elements: ElementNode[],
	nodeId: string,
	newParentId: string | null,
	newIndex: number,
): ElementNode[] {
	const node = findById(elements, nodeId);
	if (!node) return elements;

	// Remove from old position
	const withoutNode = removeNode(elements, nodeId);

	// Insert at new position
	return insertNode(withoutNode, node, newParentId, newIndex);
}

/**
 * Deep clone a node with new IDs for the clone and all descendants.
 */
export function cloneNode(node: ElementNode): ElementNode {
	return {
		...node,
		id: generateElementId(),
		settings: { ...node.settings },
		elements: node.elements.map(cloneNode),
	};
}

/**
 * Update settings for a specific node.
 * Returns a new tree (immutable).
 */
export function updateSettings(
	elements: ElementNode[],
	id: string,
	key: string,
	value: unknown,
): ElementNode[] {
	return elements.map((el) => {
		if (el.id === id) {
			return {
				...el,
				settings: { ...el.settings, [key]: value },
			};
		}
		return { ...el, elements: updateSettings(el.elements, id, key, value) };
	});
}

/**
 * Update multiple settings at once for a specific node.
 * Returns a new tree (immutable).
 */
export function updateSettingsBatch(
	elements: ElementNode[],
	id: string,
	updates: Record<string, unknown>,
): ElementNode[] {
	return elements.map((el) => {
		if (el.id === id) {
			return {
				...el,
				settings: { ...el.settings, ...updates },
			};
		}
		return { ...el, elements: updateSettingsBatch(el.elements, id, updates) };
	});
}

/**
 * Get the path (array of IDs) from root to a node.
 */
export function getPath(elements: ElementNode[], targetId: string): string[] | null {
	for (const el of elements) {
		if (el.id === targetId) return [el.id];
		const childPath = getPath(el.elements, targetId);
		if (childPath) return [el.id, ...childPath];
	}
	return null;
}

/**
 * Count total nodes in the tree.
 */
export function countNodes(elements: ElementNode[]): number {
	let count = elements.length;
	for (const el of elements) {
		count += countNodes(el.elements);
	}
	return count;
}
