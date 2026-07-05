import { describe, it, expect } from 'vitest';
import { FullProcessor } from '../src/full-processor';

describe('FullProcessor', () => {
	describe('parsing', () => {
		it('should parse a simple element', () => {
			const p = new FullProcessor('<div>Hello</div>');
			const root = p.getRoot();
			expect(root.children).toHaveLength(1);
			expect(root.children[0].tag).toBe('div');
			expect(root.children[0].children).toHaveLength(1);
			expect(root.children[0].children[0].text).toBe('Hello');
		});

		it('should parse nested elements', () => {
			const p = new FullProcessor('<div><p>Text</p></div>');
			const div = p.findFirst('div')!;
			expect(div.children).toHaveLength(1);
			expect(div.children[0].tag).toBe('p');
		});

		it('should parse attributes', () => {
			const p = new FullProcessor('<a href="/link" class="btn">Go</a>');
			const a = p.findFirst('a')!;
			expect(a.attributes?.get('href')).toBe('/link');
			expect(a.attributes?.get('class')).toBe('btn');
		});

		it('should handle void elements', () => {
			const p = new FullProcessor('<div><br><img src="x.jpg"><hr></div>');
			const div = p.findFirst('div')!;
			expect(div.children).toHaveLength(3);
			expect(div.children[0].tag).toBe('br');
			expect(div.children[0].selfClosing).toBe(true);
		});

		it('should handle self-closing syntax', () => {
			const p = new FullProcessor('<input type="text" />');
			const input = p.findFirst('input')!;
			expect(input.attributes?.get('type')).toBe('text');
		});

		it('should handle comments', () => {
			const p = new FullProcessor('<div><!-- comment -->text</div>');
			const div = p.findFirst('div')!;
			expect(div.children).toHaveLength(2);
			expect(div.children[0].type).toBe('comment');
			expect(div.children[0].text).toBe(' comment ');
		});
	});

	describe('implicit closing', () => {
		it('should auto-close <p> tags', () => {
			const p = new FullProcessor('<p>One<p>Two');
			const root = p.getRoot();
			const paragraphs = p.findAll('p');
			expect(paragraphs).toHaveLength(2);
			expect(p.getTextContent(paragraphs[0])).toBe('One');
			expect(p.getTextContent(paragraphs[1])).toBe('Two');
		});

		it('should auto-close <li> tags', () => {
			const p = new FullProcessor('<ul><li>A<li>B<li>C</ul>');
			const items = p.findAll('li');
			expect(items).toHaveLength(3);
		});

		it('should auto-close <td> tags', () => {
			const p = new FullProcessor('<table><tr><td>1<td>2</tr></table>');
			const cells = p.findAll('td');
			expect(cells).toHaveLength(2);
		});
	});

	describe('findAll / findFirst', () => {
		it('should find all matching tags', () => {
			const p = new FullProcessor('<div><p>1</p><p>2</p><p>3</p></div>');
			expect(p.findAll('p')).toHaveLength(3);
		});

		it('should find first matching tag', () => {
			const p = new FullProcessor('<div><p>First</p><p>Second</p></div>');
			const first = p.findFirst('p')!;
			expect(p.getTextContent(first)).toBe('First');
		});

		it('should return empty for non-existent tag', () => {
			const p = new FullProcessor('<div>Hello</div>');
			expect(p.findAll('span')).toHaveLength(0);
			expect(p.findFirst('span')).toBeUndefined();
		});
	});

	describe('findByClass / findById', () => {
		it('should find by class', () => {
			const p = new FullProcessor(
				'<div class="a"><p class="a b">x</p><span class="c">y</span></div>',
			);
			expect(p.findByClass('a')).toHaveLength(2);
			expect(p.findByClass('b')).toHaveLength(1);
			expect(p.findByClass('z')).toHaveLength(0);
		});

		it('should find by ID', () => {
			const p = new FullProcessor('<div id="main"><p id="title">Hi</p></div>');
			const el = p.findById('title')!;
			expect(el.tag).toBe('p');
			expect(p.getTextContent(el)).toBe('Hi');
		});
	});

	describe('getBreadcrumbs', () => {
		it('should return path from root to node', () => {
			const p = new FullProcessor('<html><body><div><p>Hi</p></div></body></html>');
			const para = p.findFirst('p')!;
			expect(p.getBreadcrumbs(para)).toEqual(['html', 'body', 'div', 'p']);
		});
	});

	describe('getTextContent', () => {
		it('should concatenate all text nodes', () => {
			const p = new FullProcessor('<div>Hello <b>World</b>!</div>');
			const div = p.findFirst('div')!;
			expect(p.getTextContent(div)).toBe('Hello World!');
		});
	});

	describe('serialize', () => {
		it('should round-trip simple HTML', () => {
			const html = '<div class="x"><p>Hello</p></div>';
			const p = new FullProcessor(html);
			expect(p.serialize()).toBe(html);
		});

		it('should serialize void elements with self-closing', () => {
			const p = new FullProcessor('<div><br><hr></div>');
			expect(p.serialize()).toBe('<div><br /><hr /></div>');
		});
	});
});
