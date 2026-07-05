import { describe, it, expect, beforeEach } from 'vitest';
import { parseBlocks } from '../src/parser';
import { serializeBlocks } from '../src/serializer';
import { BlockRegistry, BUILTIN_BLOCK_TYPES } from '../src/block-registry';

describe('Block Parser', () => {
	it('should parse a single block', () => {
		const content = '<!-- cms:paragraph -->\n<p>Hello World</p>\n<!-- /cms:paragraph -->';
		const blocks = parseBlocks(content);
		expect(blocks).toHaveLength(1);
		expect(blocks[0].name).toBe('cms/paragraph');
		expect(blocks[0].innerHTML).toContain('Hello World');
	});

	it('should parse block attributes', () => {
		const content =
			'<!-- cms:heading {"level":3,"align":"center"} -->\n<h3>Title</h3>\n<!-- /cms:heading -->';
		const blocks = parseBlocks(content);
		expect(blocks[0].attributes).toEqual({ level: 3, align: 'center' });
	});

	it('should parse self-closing blocks', () => {
		const content = '<!-- cms:separator /-->';
		const blocks = parseBlocks(content);
		expect(blocks).toHaveLength(1);
		expect(blocks[0].name).toBe('cms/separator');
		expect(blocks[0].innerHTML).toBe('');
		expect(blocks[0].innerBlocks).toHaveLength(0);
	});

	it('should parse multiple blocks', () => {
		const content = [
			'<!-- cms:paragraph -->',
			'<p>First</p>',
			'<!-- /cms:paragraph -->',
			'',
			'<!-- cms:paragraph -->',
			'<p>Second</p>',
			'<!-- /cms:paragraph -->',
		].join('\n');

		const blocks = parseBlocks(content);
		expect(blocks).toHaveLength(2);
		expect(blocks[0].innerHTML).toContain('First');
		expect(blocks[1].innerHTML).toContain('Second');
	});

	it('should parse nested blocks', () => {
		const content = [
			'<!-- cms:columns -->',
			'<!-- cms:column -->',
			'<!-- cms:paragraph -->',
			'<p>Left</p>',
			'<!-- /cms:paragraph -->',
			'<!-- /cms:column -->',
			'<!-- cms:column -->',
			'<!-- cms:paragraph -->',
			'<p>Right</p>',
			'<!-- /cms:paragraph -->',
			'<!-- /cms:column -->',
			'<!-- /cms:columns -->',
		].join('\n');

		const blocks = parseBlocks(content);
		expect(blocks).toHaveLength(1);
		expect(blocks[0].name).toBe('cms/columns');
		expect(blocks[0].innerBlocks).toHaveLength(2);
		expect(blocks[0].innerBlocks[0].name).toBe('cms/column');
		expect(blocks[0].innerBlocks[1].name).toBe('cms/column');
	});

	it('should handle freeform HTML before blocks', () => {
		const content =
			'<p>Legacy content</p>\n<!-- cms:paragraph -->\n<p>Block</p>\n<!-- /cms:paragraph -->';
		const blocks = parseBlocks(content);
		expect(blocks).toHaveLength(2);
		expect(blocks[0].name).toBe('cms/freeform');
		expect(blocks[0].innerHTML).toContain('Legacy');
		expect(blocks[1].name).toBe('cms/paragraph');
	});

	it('should handle empty content', () => {
		expect(parseBlocks('')).toHaveLength(0);
	});

	it('should handle content with no blocks', () => {
		const blocks = parseBlocks('<p>Just HTML</p>');
		expect(blocks).toHaveLength(1);
		expect(blocks[0].name).toBe('cms/freeform');
	});

	it('should handle malformed JSON attributes gracefully', () => {
		const content = '<!-- cms:paragraph {broken -->\n<p>Hi</p>\n<!-- /cms:paragraph -->';
		const blocks = parseBlocks(content);
		expect(blocks).toHaveLength(1);
		expect(blocks[0].attributes).toEqual({});
	});
});

describe('Block Serializer', () => {
	it('should serialize a simple block', () => {
		const output = serializeBlocks([
			{ name: 'cms/paragraph', attributes: {}, innerBlocks: [], innerHTML: '<p>Hello</p>' },
		]);
		expect(output).toContain('<!-- cms:paragraph -->');
		expect(output).toContain('<p>Hello</p>');
		expect(output).toContain('<!-- /cms:paragraph -->');
	});

	it('should serialize block attributes', () => {
		const output = serializeBlocks([
			{
				name: 'cms/heading',
				attributes: { level: 2 },
				innerBlocks: [],
				innerHTML: '<h2>Title</h2>',
			},
		]);
		expect(output).toContain('cms:heading {"level":2}');
	});

	it('should serialize self-closing blocks', () => {
		const output = serializeBlocks([
			{ name: 'cms/separator', attributes: {}, innerBlocks: [], innerHTML: '' },
		]);
		expect(output).toBe('<!-- cms:separator /-->');
	});

	it('should serialize nested blocks', () => {
		const output = serializeBlocks([
			{
				name: 'cms/columns',
				attributes: {},
				innerBlocks: [
					{ name: 'cms/column', attributes: {}, innerBlocks: [], innerHTML: '<p>Col1</p>' },
					{ name: 'cms/column', attributes: {}, innerBlocks: [], innerHTML: '<p>Col2</p>' },
				],
				innerHTML: '',
			},
		]);
		expect(output).toContain('<!-- cms:columns -->');
		expect(output).toContain('<!-- cms:column -->');
		expect(output).toContain('<!-- /cms:column -->');
		expect(output).toContain('<!-- /cms:columns -->');
	});

	it('should serialize freeform blocks as raw HTML', () => {
		const output = serializeBlocks([
			{ name: 'cms/freeform', attributes: {}, innerBlocks: [], innerHTML: '<p>Raw</p>' },
		]);
		expect(output).toBe('<p>Raw</p>');
	});

	it('should round-trip: parse then serialize', () => {
		const original =
			'<!-- cms:paragraph {"align":"center"} -->\n<p>Hello</p>\n<!-- /cms:paragraph -->';
		const blocks = parseBlocks(original);
		const serialized = serializeBlocks(blocks);
		expect(serialized).toContain('cms:paragraph {"align":"center"}');
		expect(serialized).toContain('<p>Hello</p>');
	});
});

describe('BlockRegistry', () => {
	let registry: BlockRegistry;

	beforeEach(() => {
		registry = new BlockRegistry();
	});

	it('should register and retrieve block types', () => {
		registry.registerBlockType(BUILTIN_BLOCK_TYPES[0]);
		expect(registry.getBlockType('cms/paragraph')).toBeDefined();
		expect(registry.getBlockType('cms/paragraph')?.title).toBe('Paragraph');
	});

	it('should throw on duplicate registration', () => {
		registry.registerBlockType(BUILTIN_BLOCK_TYPES[0]);
		expect(() => registry.registerBlockType(BUILTIN_BLOCK_TYPES[0])).toThrow('already registered');
	});

	it('should register all built-in types', () => {
		for (const bt of BUILTIN_BLOCK_TYPES) registry.registerBlockType(bt);
		expect(registry.getAllBlockTypes()).toHaveLength(BUILTIN_BLOCK_TYPES.length);
	});

	it('should filter by category', () => {
		for (const bt of BUILTIN_BLOCK_TYPES) registry.registerBlockType(bt);
		const textBlocks = registry.getBlockTypesByCategory('text');
		expect(textBlocks.length).toBeGreaterThanOrEqual(3);
		expect(textBlocks.every((b) => b.category === 'text')).toBe(true);
	});

	it('should register and retrieve patterns', () => {
		registry.registerPattern({
			name: 'two-columns',
			title: 'Two Columns',
			categories: ['layout'],
			content: '<!-- cms:columns -->...<!-- /cms:columns -->',
		});
		expect(registry.getPattern('two-columns')).toBeDefined();
		expect(registry.getPatternsByCategory('layout')).toHaveLength(1);
	});

	it('should unregister block types', () => {
		registry.registerBlockType(BUILTIN_BLOCK_TYPES[0]);
		registry.unregisterBlockType('cms/paragraph');
		expect(registry.getBlockType('cms/paragraph')).toBeUndefined();
	});
});
