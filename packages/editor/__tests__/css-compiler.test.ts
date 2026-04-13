import { describe, it, expect } from 'vitest';
import { compileCSS, minifyCSS } from '../src/css/compiler';
import { resolveValue, generateRule } from '../src/css/selectors';
import type { ElementNode } from '../src/element-tree/types';
import type { WidgetControlSchema } from '../src/controls/types';

function makeSchema(): Map<string, WidgetControlSchema> {
	const map = new Map<string, WidgetControlSchema>();
	map.set('heading', {
		widgetType: 'heading',
		title: 'Heading',
		sections: [
			{
				id: 'style_section',
				label: 'Style',
				tab: 'style',
				controls: [
					{
						id: 'title_color',
						type: 'color',
						label: 'Text Color',
						selectors: {
							'{{WRAPPER}} .heading-title': 'color: {{VALUE}}',
						},
					},
					{
						id: 'title_font_size',
						type: 'slider',
						label: 'Font Size',
						responsive: true,
						selectors: {
							'{{WRAPPER}} .heading-title': 'font-size: {{VALUE}}',
						},
					},
					{
						id: 'typography_title',
						type: 'group',
						groupType: 'typography',
						label: 'Typography',
						selector: '{{WRAPPER}} .heading-title',
						responsive: true,
					},
				],
			},
		],
	});
	return map;
}

function makeTree(): ElementNode[] {
	return [{
		id: 'abc123',
		elType: 'container',
		settings: {},
		elements: [{
			id: 'h1node',
			elType: 'widget',
			widgetType: 'heading',
			settings: {
				title_color: '#ff0000',
				title_font_size: { size: 48, unit: 'px' },
				title_font_size_tablet: { size: 32, unit: 'px' },
				title_font_size_mobile: { size: 24, unit: 'px' },
				typography_title_font_family: 'Inter',
				typography_title_font_weight: '700',
			},
			elements: [],
		}],
	}];
}

describe('resolveValue', () => {
	it('should resolve simple string value', () => {
		expect(resolveValue('color: {{VALUE}}', '#ff0000')).toBe('color: #ff0000');
	});

	it('should resolve slider value', () => {
		expect(resolveValue('font-size: {{VALUE}}', { size: 24, unit: 'px' })).toBe('font-size: 24px');
	});

	it('should resolve SIZE and UNIT separately', () => {
		expect(resolveValue('font-size: {{SIZE}}{{UNIT}}', { size: 16, unit: 'em' })).toBe('font-size: 16em');
	});

	it('should return null for empty value', () => {
		expect(resolveValue('color: {{VALUE}}', '')).toBeNull();
		expect(resolveValue('color: {{VALUE}}', undefined)).toBeNull();
		expect(resolveValue('color: {{VALUE}}', null)).toBeNull();
	});
});

describe('generateRule', () => {
	it('should generate a complete CSS rule', () => {
		const rule = generateRule('{{WRAPPER}} .title', 'color: {{VALUE}}', 'abc', '#00f');
		expect(rule).toBe('.builder-el-abc .title { color: #00f }');
	});

	it('should return null for empty value', () => {
		expect(generateRule('{{WRAPPER}} .title', 'color: {{VALUE}}', 'abc', '')).toBeNull();
	});
});

describe('compileCSS', () => {
	it('should compile CSS from simple controls', () => {
		const css = compileCSS(makeTree(), makeSchema());
		expect(css).toContain('.builder-el-h1node .heading-title { color: #ff0000 }');
		expect(css).toContain('font-size: 48px');
	});

	it('should generate responsive media queries', () => {
		const css = compileCSS(makeTree(), makeSchema());
		expect(css).toContain('@media (max-width: 768px)');
		expect(css).toContain('font-size: 32px');
	});

	it('should expand typography group controls', () => {
		const css = compileCSS(makeTree(), makeSchema());
		expect(css).toContain('font-family: Inter');
		expect(css).toContain('font-weight: 700');
	});

	it('should handle empty tree', () => {
		expect(compileCSS([], makeSchema())).toBe('');
	});

	it('should handle unknown widget type', () => {
		const tree: ElementNode[] = [{
			id: 'x',
			elType: 'widget',
			widgetType: 'unknown',
			settings: {},
			elements: [],
		}];
		expect(compileCSS(tree, makeSchema())).toBe('');
	});
});

describe('minifyCSS', () => {
	it('should minify CSS', () => {
		const input = '.test {\n  color: red;\n  font-size: 16px;\n}';
		const output = minifyCSS(input);
		expect(output).toBe('.test{color:red;font-size:16px}');
	});

	it('should strip comments', () => {
		expect(minifyCSS('/* comment */ .a { color: red; }')).toBe('.a{color:red}');
	});
});
