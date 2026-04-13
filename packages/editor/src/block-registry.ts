import type { BlockTypeDefinition, BlockPattern } from './types';

/**
 * Registry of block types and patterns.
 */
export class BlockRegistry {
	private blockTypes: Map<string, BlockTypeDefinition> = new Map();
	private patterns: Map<string, BlockPattern> = new Map();

	registerBlockType(definition: BlockTypeDefinition): void {
		if (this.blockTypes.has(definition.name)) {
			throw new Error(`Block type "${definition.name}" is already registered.`);
		}
		this.blockTypes.set(definition.name, definition);
	}

	getBlockType(name: string): BlockTypeDefinition | undefined {
		return this.blockTypes.get(name);
	}

	getAllBlockTypes(): BlockTypeDefinition[] {
		return [...this.blockTypes.values()];
	}

	getBlockTypesByCategory(category: string): BlockTypeDefinition[] {
		return this.getAllBlockTypes().filter((bt) => bt.category === category);
	}

	unregisterBlockType(name: string): boolean {
		return this.blockTypes.delete(name);
	}

	registerPattern(pattern: BlockPattern): void {
		this.patterns.set(pattern.name, pattern);
	}

	getPattern(name: string): BlockPattern | undefined {
		return this.patterns.get(name);
	}

	getAllPatterns(): BlockPattern[] {
		return [...this.patterns.values()];
	}

	getPatternsByCategory(category: string): BlockPattern[] {
		return this.getAllPatterns().filter((p) => p.categories?.includes(category));
	}

	reset(): void {
		this.blockTypes.clear();
		this.patterns.clear();
	}
}

/**
 * Built-in block types registered by default.
 */
export const BUILTIN_BLOCK_TYPES: BlockTypeDefinition[] = [
	{
		name: 'cms/paragraph',
		title: 'Paragraph',
		category: 'text',
		supports: {
			color: { background: true, text: true },
			typography: { fontSize: true, lineHeight: true },
			spacing: { margin: true, padding: true },
			className: true,
		},
		defaultAttributes: { content: '', dropCap: false },
	},
	{
		name: 'cms/heading',
		title: 'Heading',
		category: 'text',
		supports: {
			align: ['wide', 'full'],
			anchor: true,
			color: { text: true, background: true },
			typography: { fontSize: true, fontFamily: true, fontWeight: true },
			spacing: { margin: true },
			className: true,
		},
		defaultAttributes: { content: '', level: 2 },
	},
	{
		name: 'cms/image',
		title: 'Image',
		category: 'media',
		supports: {
			align: ['left', 'center', 'right', 'wide', 'full'],
			border: { radius: true },
			shadow: true,
			className: true,
		},
		defaultAttributes: { url: '', alt: '', caption: '' },
	},
	{
		name: 'cms/list',
		title: 'List',
		category: 'text',
		supports: {
			color: { text: true, background: true },
			typography: { fontSize: true },
			spacing: { margin: true, padding: true },
			className: true,
		},
		defaultAttributes: { ordered: false, values: '' },
	},
	{
		name: 'cms/quote',
		title: 'Quote',
		category: 'text',
		supports: {
			align: ['left', 'right', 'wide', 'full'],
			color: { text: true, background: true },
			typography: { fontSize: true },
			className: true,
		},
		defaultAttributes: { value: '', citation: '' },
	},
	{
		name: 'cms/code',
		title: 'Code',
		category: 'text',
		supports: {
			color: { text: true, background: true },
			typography: { fontSize: true, fontFamily: true },
			spacing: { margin: true, padding: true },
			border: { radius: true },
			className: true,
		},
		defaultAttributes: { content: '' },
	},
	{
		name: 'cms/html',
		title: 'Custom HTML',
		category: 'widgets',
		supports: { html: true, className: true },
		defaultAttributes: { content: '' },
	},
	{
		name: 'cms/separator',
		title: 'Separator',
		category: 'design',
		supports: {
			align: ['wide', 'full'],
			color: { background: true },
			className: true,
		},
		defaultAttributes: {},
	},
	{
		name: 'cms/spacer',
		title: 'Spacer',
		category: 'design',
		supports: { className: true },
		defaultAttributes: { height: '100px' },
	},
	{
		name: 'cms/columns',
		title: 'Columns',
		category: 'design',
		supports: {
			align: ['wide', 'full'],
			color: { background: true },
			spacing: { margin: true, padding: true, blockGap: true },
			layout: true,
			className: true,
		},
		defaultAttributes: {},
	},
	{
		name: 'cms/column',
		title: 'Column',
		category: 'design',
		parent: ['cms/columns'],
		supports: {
			color: { background: true },
			spacing: { padding: true },
			border: { radius: true },
			className: true,
		},
		defaultAttributes: { width: '' },
	},
	{
		name: 'cms/group',
		title: 'Group',
		category: 'design',
		supports: {
			align: ['wide', 'full'],
			color: { background: true, text: true },
			spacing: { margin: true, padding: true, blockGap: true },
			border: { color: true, radius: true, style: true, width: true },
			layout: true,
			className: true,
		},
		defaultAttributes: {},
	},
	{
		name: 'cms/button',
		title: 'Button',
		category: 'design',
		supports: {
			color: { background: true, text: true },
			typography: { fontSize: true, fontFamily: true },
			border: { radius: true },
			shadow: true,
			spacing: { padding: true },
			className: true,
		},
		defaultAttributes: { text: '', url: '' },
	},
];
