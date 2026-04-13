import { describe, it, expect, beforeEach } from 'vitest';
import { UrlRewriter } from '../src/url-rewrite';

describe('UrlRewriter', () => {
	let rewriter: UrlRewriter;

	beforeEach(() => {
		rewriter = new UrlRewriter();
	});

	describe('permalink structure', () => {
		it('should resolve /%year%/%monthnum%/%postname%/', () => {
			rewriter.addPermalinkStructure('/%year%/%monthnum%/%postname%/');
			const result = rewriter.resolve('/2026/04/hello-world/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.year).toBe('2026');
			expect(result.queryVars.monthnum).toBe('04');
			expect(result.queryVars.name).toBe('hello-world');
		});

		it('should resolve /%postname%/', () => {
			rewriter.addPermalinkStructure('/%postname%/');
			const result = rewriter.resolve('/my-post/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.name).toBe('my-post');
		});

		it('should resolve /%post_id%/', () => {
			rewriter.addPermalinkStructure('/%post_id%/');
			const result = rewriter.resolve('/42/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.p).toBe('42');
		});

		it('should not match wrong format', () => {
			rewriter.addPermalinkStructure('/%year%/%monthnum%/%postname%/');
			const result = rewriter.resolve('/not/a/valid/pattern/extra/');
			expect(result.matched).toBe(false);
		});
	});

	describe('default rules', () => {
		beforeEach(() => {
			rewriter.addDefaultRules();
		});

		it('should resolve category URLs', () => {
			const result = rewriter.resolve('/category/news/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.category_name).toBe('news');
		});

		it('should resolve tag URLs', () => {
			const result = rewriter.resolve('/tag/javascript/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.tag).toBe('javascript');
		});

		it('should resolve author URLs', () => {
			const result = rewriter.resolve('/author/admin/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.author_name).toBe('admin');
		});

		it('should resolve search URLs', () => {
			const result = rewriter.resolve('/search/hello world/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.s).toBe('hello world');
		});

		it('should resolve page pagination', () => {
			const result = rewriter.resolve('/page/3/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.paged).toBe('3');
		});

		it('should resolve page slugs (catch-all)', () => {
			const result = rewriter.resolve('/about/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.pagename).toBe('about');
		});
	});

	describe('buildPermalink', () => {
		it('should build a permalink from structure and values', () => {
			const url = UrlRewriter.buildPermalink('/%year%/%monthnum%/%postname%/', {
				year: '2026',
				monthnum: '04',
				name: 'hello-world',
			});
			expect(url).toBe('/2026/04/hello-world/');
		});
	});

	describe('custom rules', () => {
		it('should respect rule priority', () => {
			rewriter.addRule(/^(?<slug>[^/]+)\/?$/, ['pagename'], 'page', 99);
			rewriter.addRule(/^api\/(?<api_version>v\d+)\/?$/, ['api_version'], 'api', 1);

			const result = rewriter.resolve('/api/v2/');
			expect(result.matched).toBe(true);
			expect(result.queryVars.api_version).toBe('v2');
			expect(result.rule?.source).toBe('api');
		});
	});
});
