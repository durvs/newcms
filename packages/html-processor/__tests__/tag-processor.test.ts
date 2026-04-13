import { describe, it, expect } from 'vitest';
import { TagProcessor } from '../src/tag-processor';

describe('TagProcessor', () => {
	describe('nextTag', () => {
		it('should find tags by name', () => {
			const p = new TagProcessor('<div><p>Hello</p></div>');
			expect(p.nextTag('p')).toBe(true);
			expect(p.getTag()).toBe('p');
		});

		it('should iterate all opening tags when no name given', () => {
			const p = new TagProcessor('<div><span>x</span></div>');
			const tags: string[] = [];
			while (p.nextTag()) tags.push(p.getTag()!);
			expect(tags).toEqual(['div', 'span']);
		});

		it('should return false when no more tags', () => {
			const p = new TagProcessor('<p>Hi</p>');
			p.nextTag('p');
			expect(p.nextTag('p')).toBe(false);
		});

		it('should handle self-closing tags', () => {
			const p = new TagProcessor('<img src="a.jpg" />');
			expect(p.nextTag('img')).toBe(true);
			expect(p.getAttribute('src')).toBe('a.jpg');
		});
	});

	describe('getAttribute / setAttribute', () => {
		it('should read attributes', () => {
			const p = new TagProcessor('<a href="/link" title="Go">Click</a>');
			p.nextTag('a');
			expect(p.getAttribute('href')).toBe('/link');
			expect(p.getAttribute('title')).toBe('Go');
			expect(p.getAttribute('missing')).toBeNull();
		});

		it('should set attributes and get updated HTML', () => {
			const p = new TagProcessor('<div id="old">content</div>');
			p.nextTag('div');
			p.setAttribute('id', 'new');
			p.setAttribute('data-x', '1');
			const html = p.getUpdatedHtml();
			expect(html).toContain('id="new"');
			expect(html).toContain('data-x="1"');
		});

		it('should remove attributes', () => {
			const p = new TagProcessor('<div id="x" class="y">hi</div>');
			p.nextTag('div');
			p.removeAttribute('id');
			expect(p.getUpdatedHtml()).not.toContain('id=');
			expect(p.getUpdatedHtml()).toContain('class="y"');
		});
	});

	describe('addClass / removeClass / hasClass', () => {
		it('should add a class', () => {
			const p = new TagProcessor('<div class="a">x</div>');
			p.nextTag('div');
			p.addClass('b');
			expect(p.getUpdatedHtml()).toContain('class="a b"');
		});

		it('should not duplicate classes', () => {
			const p = new TagProcessor('<div class="a b">x</div>');
			p.nextTag('div');
			p.addClass('a');
			expect(p.getUpdatedHtml()).toContain('class="a b"');
		});

		it('should remove a class', () => {
			const p = new TagProcessor('<div class="a b c">x</div>');
			p.nextTag('div');
			p.removeClass('b');
			expect(p.getUpdatedHtml()).toContain('class="a c"');
		});

		it('should check class existence', () => {
			const p = new TagProcessor('<div class="foo bar">x</div>');
			p.nextTag('div');
			expect(p.hasClass('foo')).toBe(true);
			expect(p.hasClass('baz')).toBe(false);
		});

		it('should add class to element without class attribute', () => {
			const p = new TagProcessor('<div>x</div>');
			p.nextTag('div');
			p.addClass('new');
			expect(p.getUpdatedHtml()).toContain('class="new"');
		});
	});

	describe('multiple modifications', () => {
		it('should modify multiple tags independently', () => {
			const p = new TagProcessor('<p class="a">1</p><p class="b">2</p>');
			p.nextTag('p');
			p.addClass('x');
			p.nextTag('p');
			p.addClass('y');
			const html = p.getUpdatedHtml();
			expect(html).toContain('class="a x"');
			expect(html).toContain('class="b y"');
		});
	});

	describe('edge cases', () => {
		it('should handle empty HTML', () => {
			const p = new TagProcessor('');
			expect(p.nextTag()).toBe(false);
		});

		it('should handle text-only HTML', () => {
			const p = new TagProcessor('just text');
			expect(p.nextTag()).toBe(false);
		});

		it('should skip comments', () => {
			const p = new TagProcessor('<!-- comment --><div>x</div>');
			expect(p.nextTag('div')).toBe(true);
		});

		it('should escape attribute values', () => {
			const p = new TagProcessor('<div>x</div>');
			p.nextTag('div');
			p.setAttribute('data-val', 'a"b<c');
			expect(p.getUpdatedHtml()).toContain('data-val="a&quot;b&lt;c"');
		});
	});
});
