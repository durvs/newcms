/**
 * Template kit exporter — generates Elementor-compatible kit format.
 */

import type { ElementNode } from '../element-tree/types';
import type { KitManifest } from './types';
import type { DesignKit } from '../kit/types';

export interface ExportTemplate {
	id: string;
	title: string;
	docType: string;
	location?: string;
	conditions?: string[][];
	elements: ElementNode[];
	settings?: Record<string, unknown>;
}

export interface ExportContent {
	id: string;
	title: string;
	postType: string;
	elements: ElementNode[];
	excerpt?: string;
}

export interface ExportResult {
	manifest: KitManifest;
	siteSettings: Record<string, unknown>;
	templates: Map<string, { content: ElementNode[]; settings?: Record<string, unknown> }>;
	content: Map<string, { content: ElementNode[]; settings?: Record<string, unknown> }>;
}

/**
 * Export a template kit.
 */
export function exportKit(
	kitName: string,
	kitTitle: string,
	designKit: DesignKit,
	templates: ExportTemplate[],
	content: ExportContent[],
): ExportResult {
	// Build manifest
	const manifest: KitManifest = {
		name: kitName,
		title: kitTitle,
		version: '1.0',
		builderVersion: '0.2.0',
		created: new Date().toISOString(),
		'site-settings': ['global-colors', 'global-typography'],
		templates: {},
		content: {},
	};

	const templateFiles = new Map<string, { content: ElementNode[]; settings?: Record<string, unknown> }>();
	const contentFiles = new Map<string, { content: ElementNode[]; settings?: Record<string, unknown> }>();

	// Templates
	for (const tmpl of templates) {
		manifest.templates![tmpl.id] = {
			title: tmpl.title,
			doc_type: tmpl.docType,
			location: tmpl.location,
			conditions: tmpl.conditions,
		};
		templateFiles.set(tmpl.id, { content: tmpl.elements, settings: tmpl.settings });
	}

	// Content
	for (const item of content) {
		if (!manifest.content![item.postType]) {
			manifest.content![item.postType] = {};
		}
		manifest.content![item.postType][item.id] = {
			title: item.title,
			doc_type: item.postType,
			excerpt: item.excerpt,
		};
		contentFiles.set(`${item.postType}/${item.id}`, { content: item.elements });
	}

	// Site settings from Design Kit
	const siteSettings: Record<string, unknown> = {
		custom_colors: designKit.colors.map((c) => ({
			_id: c.id,
			title: c.title,
			color: c.color,
		})),
		custom_typography: designKit.typography.map((t) => ({
			_id: t.id,
			title: t.title,
			typography_font_family: t.fontFamily,
			typography_font_size: t.fontSize,
			typography_font_weight: t.fontWeight,
			typography_line_height: t.lineHeight,
			typography_letter_spacing: t.letterSpacing,
		})),
		body_typography_font_family: designKit.bodyFontFamily,
		body_typography_font_size: designKit.bodyFontSize,
	};

	return { manifest, siteSettings, templates: templateFiles, content: contentFiles };
}
