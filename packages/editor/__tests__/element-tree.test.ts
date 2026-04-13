import { describe, it, expect } from 'vitest';
import {
	createElement,
	findById,
	findParent,
	insertNode,
	removeNode,
	moveNode,
	cloneNode,
	updateSettings,
	updateSettingsBatch,
	getPath,
	countNodes,
	type ElementNode,
} from '../src/element-tree/types';
import {
	findById as findByIdOp,
	findParent as findParentOp,
	insertNode as insertOp,
	removeNode as removeOp,
	moveNode as moveOp,
	cloneNode as cloneOp,
	updateSettings as updateOp,
	updateSettingsBatch as updateBatchOp,
	getPath as getPathOp,
	countNodes as countOp,
} from '../src/element-tree/operations';
import {
	walkTree,
	flattenTree,
	getAncestors,
	getDescendants,
	findAll,
	findWidgetsByType,
	getMaxDepth,
} from '../src/element-tree/traversal';

function makeTree(): ElementNode[] {
	return [
		{
			id: 'container1',
			elType: 'container',
			settings: {},
			elements: [
				{
					id: 'heading1',
					elType: 'widget',
					widgetType: 'heading',
					settings: { content: 'Hello', level: 2 },
					elements: [],
				},
				{
					id: 'paragraph1',
					elType: 'widget',
					widgetType: 'paragraph',
					settings: { content: 'World' },
					elements: [],
				},
			],
		},
		{
			id: 'container2',
			elType: 'container',
			settings: {},
			elements: [
				{
					id: 'image1',
					elType: 'widget',
					widgetType: 'image',
					settings: { url: 'test.jpg' },
					elements: [],
				},
			],
		},
	];
}

describe('createElement', () => {
	it('should create a container', () => {
		const el = createElement('container');
		expect(el.elType).toBe('container');
		expect(el.id).toHaveLength(8);
		expect(el.elements).toEqual([]);
		expect(el.widgetType).toBeUndefined();
	});

	it('should create a widget with widgetType', () => {
		const el = createElement('widget', 'heading', { content: 'Hi' });
		expect(el.elType).toBe('widget');
		expect(el.widgetType).toBe('heading');
		expect(el.settings.content).toBe('Hi');
	});
});

describe('findById', () => {
	it('should find root-level element', () => {
		const tree = makeTree();
		expect(findByIdOp(tree, 'container1')?.id).toBe('container1');
	});

	it('should find nested element', () => {
		const tree = makeTree();
		expect(findByIdOp(tree, 'heading1')?.widgetType).toBe('heading');
	});

	it('should return undefined for non-existent', () => {
		expect(findByIdOp(makeTree(), 'nope')).toBeUndefined();
	});
});

describe('findParent', () => {
	it('should find parent of nested element', () => {
		const tree = makeTree();
		const result = findParentOp(tree, 'heading1');
		expect(result?.parent?.id).toBe('container1');
		expect(result?.index).toBe(0);
	});

	it('should return null parent for root element', () => {
		const tree = makeTree();
		const result = findParentOp(tree, 'container1');
		expect(result?.parent).toBeNull();
		expect(result?.index).toBe(0);
	});
});

describe('insertNode', () => {
	it('should insert at root level', () => {
		const tree = makeTree();
		const newEl = createElement('container');
		const result = insertOp(tree, newEl, null, 1);
		expect(result).toHaveLength(3);
		expect(result[1].id).toBe(newEl.id);
	});

	it('should insert as child', () => {
		const tree = makeTree();
		const widget = createElement('widget', 'button');
		const result = insertOp(tree, widget, 'container1', 1);
		expect(findByIdOp(result, 'container1')?.elements).toHaveLength(3);
		expect(findByIdOp(result, 'container1')?.elements[1].id).toBe(widget.id);
	});

	it('should append at end when no index', () => {
		const tree = makeTree();
		const widget = createElement('widget', 'spacer');
		const result = insertOp(tree, widget, 'container1');
		const container = findByIdOp(result, 'container1')!;
		expect(container.elements[container.elements.length - 1].id).toBe(widget.id);
	});
});

describe('removeNode', () => {
	it('should remove a root element', () => {
		const result = removeOp(makeTree(), 'container2');
		expect(result).toHaveLength(1);
	});

	it('should remove a nested element', () => {
		const result = removeOp(makeTree(), 'heading1');
		expect(findByIdOp(result, 'container1')?.elements).toHaveLength(1);
		expect(findByIdOp(result, 'heading1')).toBeUndefined();
	});
});

describe('moveNode', () => {
	it('should move a widget between containers', () => {
		const result = moveOp(makeTree(), 'heading1', 'container2', 0);
		expect(findByIdOp(result, 'container1')?.elements).toHaveLength(1);
		expect(findByIdOp(result, 'container2')?.elements).toHaveLength(2);
		expect(findByIdOp(result, 'container2')?.elements[0].id).toBe('heading1');
	});

	it('should move to root level', () => {
		const result = moveOp(makeTree(), 'heading1', null, 0);
		expect(result).toHaveLength(3);
		expect(result[0].id).toBe('heading1');
	});
});

describe('cloneNode', () => {
	it('should create a deep clone with new IDs', () => {
		const tree = makeTree();
		const original = tree[0];
		const clone = cloneOp(original);
		expect(clone.id).not.toBe(original.id);
		expect(clone.elements).toHaveLength(original.elements.length);
		expect(clone.elements[0].id).not.toBe(original.elements[0].id);
		expect(clone.elements[0].settings).toEqual(original.elements[0].settings);
	});
});

describe('updateSettings', () => {
	it('should update a single setting immutably', () => {
		const tree = makeTree();
		const result = updateOp(tree, 'heading1', 'content', 'Changed');
		expect(findByIdOp(result, 'heading1')?.settings.content).toBe('Changed');
		// Original unchanged
		expect(findByIdOp(tree, 'heading1')?.settings.content).toBe('Hello');
	});
});

describe('updateSettingsBatch', () => {
	it('should update multiple settings at once', () => {
		const tree = makeTree();
		const result = updateBatchOp(tree, 'heading1', { content: 'New', level: 3 });
		const heading = findByIdOp(result, 'heading1')!;
		expect(heading.settings.content).toBe('New');
		expect(heading.settings.level).toBe(3);
	});
});

describe('getPath', () => {
	it('should return path from root to target', () => {
		expect(getPathOp(makeTree(), 'heading1')).toEqual(['container1', 'heading1']);
	});

	it('should return null for non-existent', () => {
		expect(getPathOp(makeTree(), 'nope')).toBeNull();
	});
});

describe('countNodes', () => {
	it('should count all nodes', () => {
		expect(countOp(makeTree())).toBe(5); // 2 containers + 2 widgets + 1 image
	});
});

describe('walkTree', () => {
	it('should visit all nodes depth-first', () => {
		const ids: string[] = [];
		walkTree(makeTree(), (node) => { ids.push(node.id); });
		expect(ids).toEqual(['container1', 'heading1', 'paragraph1', 'container2', 'image1']);
	});

	it('should provide depth and path', () => {
		const depths: number[] = [];
		walkTree(makeTree(), (_node, depth) => { depths.push(depth); });
		expect(depths).toEqual([0, 1, 1, 0, 1]);
	});
});

describe('flattenTree', () => {
	it('should return all nodes in order', () => {
		const flat = flattenTree(makeTree());
		expect(flat).toHaveLength(5);
		expect(flat.map((n) => n.id)).toEqual(['container1', 'heading1', 'paragraph1', 'container2', 'image1']);
	});
});

describe('getAncestors', () => {
	it('should return ancestors from root to parent', () => {
		const ancestors = getAncestors(makeTree(), 'heading1');
		expect(ancestors).toHaveLength(1);
		expect(ancestors[0].id).toBe('container1');
	});

	it('should return empty for root elements', () => {
		expect(getAncestors(makeTree(), 'container1')).toHaveLength(0);
	});
});

describe('getDescendants', () => {
	it('should return all descendants', () => {
		const container = makeTree()[0];
		const desc = getDescendants(container);
		expect(desc).toHaveLength(2);
	});
});

describe('findWidgetsByType', () => {
	it('should find all widgets of a type', () => {
		const headings = findWidgetsByType(makeTree(), 'heading');
		expect(headings).toHaveLength(1);
		expect(headings[0].id).toBe('heading1');
	});
});

describe('getMaxDepth', () => {
	it('should calculate max depth', () => {
		expect(getMaxDepth(makeTree())).toBe(2); // containers at 0, widgets at 1
	});

	it('should return 0 for empty', () => {
		expect(getMaxDepth([])).toBe(0);
	});
});
