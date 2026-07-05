/**
 * Template kit importer — handles both NewCMS native and Elementor formats.
 *
 * Import flow:
 * 1. Parse manifest.json
 * 2. Parse site-settings.json → apply to Design Kit
 * 3. For each template: parse JSON, convert format, regenerate IDs
 * 4. For each content: parse JSON, convert format
 * 5. Return structured import result (caller handles persistence)
 */

import type { ElementNode } from '../element-tree/types';
import type { KitManifest, KitSiteSettings, ImportSession } from './types';
import { convertElementorTree, convertSiteSettings } from './elementor-compat';
import { generateElementId } from '../element-tree/types';

export interface ImportedTemplate {
	title: string;
	docType: string;
	location?: string;
	conditions?: string[][];
	elements: ElementNode[];
	settings?: Record<string, unknown>;
}

export interface ImportedContent {
	title: string;
	postType: string;
	elements: ElementNode[];
	settings?: Record<string, unknown>;
	excerpt?: string;
	terms?: { taxonomy: string; slug: string }[];
}

export interface ImportResult {
	manifest: KitManifest;
	siteSettings?: Record<string, unknown>;
	templates: ImportedTemplate[];
	content: ImportedContent[];
	/** Media URLs that need to be downloaded and re-attached */
	mediaUrls: string[];
}

/**
 * Import a template kit from parsed files.
 *
 * @param manifest - Parsed manifest.json
 * @param siteSettings - Parsed site-settings.json (optional)
 * @param templateFiles - Map of template ID → parsed JSON content
 * @param contentFiles - Map of "postType/postId" → parsed JSON content
 */
export function importKit(
	manifest: KitManifest,
	siteSettings?: KitSiteSettings,
	templateFiles?: Map<string, Record<string, unknown>>,
	contentFiles?: Map<string, Record<string, unknown>>,
): ImportResult {
	const result: ImportResult = {
		manifest,
		templates: [],
		content: [],
		mediaUrls: [],
	};

	// Determine if this is an Elementor kit (has elementor_version)
	const isElementor = !!manifest.elementor_version;

	// Convert site settings
	if (siteSettings) {
		result.siteSettings = isElementor
			? convertSiteSettings(siteSettings.settings)
			: siteSettings.settings;
	}

	// Process templates
	if (manifest.templates && templateFiles) {
		for (const [id, entry] of Object.entries(manifest.templates)) {
			const file = templateFiles.get(id);
			if (!file) continue;

			const content = (file.content ?? file) as Record<string, unknown>[];
			const elements = Array.isArray(content)
				? isElementor
					? convertElementorTree(content as unknown as import('./types').ElementorNode[])
					: (content as unknown as ElementNode[])
				: [];

			// Collect media URLs from the tree
			collectMediaUrls(elements, result.mediaUrls);

			result.templates.push({
				title: entry.title,
				docType: entry.doc_type,
				location: entry.location,
				conditions: entry.conditions,
				elements,
				settings: file.settings as Record<string, unknown>,
			});
		}
	}

	// Process content (pages, posts)
	if (manifest.content && contentFiles) {
		for (const [postType, posts] of Object.entries(manifest.content)) {
			for (const [postId, entry] of Object.entries(posts)) {
				const file = contentFiles.get(`${postType}/${postId}`);
				if (!file) continue;

				const content = (file.content ?? file) as Record<string, unknown>[];
				const elements = Array.isArray(content)
					? isElementor
						? convertElementorTree(content as unknown as import('./types').ElementorNode[])
						: (content as unknown as ElementNode[])
					: [];

				collectMediaUrls(elements, result.mediaUrls);

				result.content.push({
					title: entry.title,
					postType,
					elements,
					settings: file.settings as Record<string, unknown>,
					excerpt: entry.excerpt,
					terms: entry.terms?.map((t) => ({ taxonomy: t.taxonomy, slug: t.slug })),
				});
			}
		}
	}

	// Deduplicate media URLs
	result.mediaUrls = [...new Set(result.mediaUrls)];

	return result;
}

/**
 * Walk element tree and collect all media URLs (images, videos, etc.).
 */
function collectMediaUrls(elements: ElementNode[], urls: string[]): void {
	for (const el of elements) {
		const s = el.settings;

		// Check common media settings
		for (const key of ['url', 'image', 'background_image', 'video_url']) {
			const val = s[key];
			if (typeof val === 'string' && val.startsWith('http')) {
				urls.push(val);
			}
			if (val && typeof val === 'object' && 'url' in (val as Record<string, unknown>)) {
				const u = (val as { url: string }).url;
				if (u && u.startsWith('http')) urls.push(u);
			}
		}

		// Check background in settings
		if (s.background_image && typeof s.background_image === 'object') {
			const bg = s.background_image as { url?: string };
			if (bg.url) urls.push(bg.url);
		}

		// Recurse
		if (el.elements.length > 0) {
			collectMediaUrls(el.elements, urls);
		}
	}
}

/**
 * Create an import session for rollback tracking.
 */
export function createImportSession(
	kitTitle: string,
	userId: number,
	source: 'local' | 'cloud' = 'local',
): ImportSession {
	return {
		sessionId: generateElementId() + generateElementId(),
		kitTitle,
		kitSource: source,
		userId,
		startTimestamp: Date.now(),
		importedAttachments: [],
		importedPosts: [],
		importedTemplates: [],
	};
}
