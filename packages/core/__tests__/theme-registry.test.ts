import { describe, it, expect, beforeEach } from 'vitest';
import {
	ThemeRegistry,
	resolveTemplateHierarchy,
	type ThemeManifest,
} from '../src/theme-registry.js';

describe('ThemeRegistry', () => {
	let registry: ThemeRegistry;

	beforeEach(() => {
		registry = new ThemeRegistry();
	});

	it('should register and activate a theme', () => {
		const manifest: ThemeManifest = { slug: 'default', name: 'Default', version: '1.0.0' };
		registry.register(manifest, '/themes/default');
		registry.activate('default');
		expect(registry.getActive()?.manifest.slug).toBe('default');
	});

	it('should resolve parent for child themes', () => {
		registry.register({ slug: 'parent', name: 'Parent', version: '1.0.0' }, '/themes/parent');
		registry.register(
			{ slug: 'child', name: 'Child', version: '1.0.0', parent: 'parent' },
			'/themes/child',
		);
		registry.activate('child');
		expect(registry.getActive()?.parentTheme?.manifest.slug).toBe('parent');
	});

	it('should throw if parent theme not found', () => {
		registry.register(
			{ slug: 'orphan', name: 'Orphan', version: '1.0.0', parent: 'missing' },
			'/themes/orphan',
		);
		expect(() => registry.activate('orphan')).toThrow('Parent theme "missing" not found');
	});

	it('should check theme supports', () => {
		registry.register(
			{
				slug: 'modern',
				name: 'Modern',
				version: '1.0.0',
				supports: { thumbnails: true, customLogo: { width: 200, height: 100 } },
			},
			'/themes/modern',
		);
		registry.activate('modern');
		expect(registry.supports('thumbnails')).toBe(true);
		expect(registry.supports('customBackground')).toBe(false);
		expect(registry.supports('customLogo')).toBe(true);
	});
});

describe('resolveTemplateHierarchy', () => {
	it('should resolve single post template hierarchy', () => {
		const templates = resolveTemplateHierarchy({
			type: 'single',
			postType: 'post',
			slug: 'hello-world',
		});
		expect(templates).toEqual(['post-hello-world', 'post', 'singular', 'index']);
	});

	it('should resolve page with custom template', () => {
		const templates = resolveTemplateHierarchy({
			type: 'page',
			slug: 'about',
			id: 42,
			customTemplate: 'full-width',
		});
		expect(templates).toEqual(['full-width', 'page-about', 'page-42', 'page', 'singular', 'index']);
	});

	it('should resolve category archive', () => {
		const templates = resolveTemplateHierarchy({
			type: 'category',
			slug: 'news',
			id: 5,
		});
		expect(templates).toEqual(['category-news', 'category-5', 'category', 'archive', 'index']);
	});

	it('should resolve tag archive', () => {
		const templates = resolveTemplateHierarchy({ type: 'tag', slug: 'javascript' });
		expect(templates).toEqual(['tag-javascript', 'tag', 'archive', 'index']);
	});

	it('should resolve custom taxonomy', () => {
		const templates = resolveTemplateHierarchy({
			type: 'taxonomy',
			taxonomy: 'genre',
			term: 'sci-fi',
			id: 10,
		});
		expect(templates).toEqual([
			'taxonomy-genre-sci-fi',
			'taxonomy-genre-10',
			'taxonomy-genre',
			'taxonomy',
			'archive',
			'index',
		]);
	});

	it('should resolve author archive', () => {
		const templates = resolveTemplateHierarchy({
			type: 'author',
			nicename: 'admin',
			id: 1,
		});
		expect(templates).toEqual(['author-admin', 'author-1', 'author', 'archive', 'index']);
	});

	it('should resolve date archive', () => {
		expect(resolveTemplateHierarchy({ type: 'date' })).toEqual(['date', 'archive', 'index']);
	});

	it('should resolve search', () => {
		expect(resolveTemplateHierarchy({ type: 'search' })).toEqual(['search', 'index']);
	});

	it('should resolve 404', () => {
		expect(resolveTemplateHierarchy({ type: '404' })).toEqual(['404', 'index']);
	});

	it('should resolve home', () => {
		expect(resolveTemplateHierarchy({ type: 'home' })).toEqual([
			'front-page',
			'home',
			'index',
		]);
	});

	it('should resolve attachment with mime type', () => {
		const templates = resolveTemplateHierarchy({
			type: 'attachment',
			mimeType: 'image',
			mimeSubtype: 'jpeg',
		});
		expect(templates).toEqual(['image-jpeg', 'jpeg', 'image', 'attachment', 'single', 'index']);
	});
});
