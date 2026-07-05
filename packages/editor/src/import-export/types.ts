/**
 * Template Kit Import/Export format.
 * Compatible with Elementor template kits for import.
 */

import type { ElementNode } from '../element-tree/types';

export interface KitManifest {
	name: string;
	title: string;
	description?: string;
	author?: string;
	version: string;
	/** Original builder version */
	builderVersion?: string;
	/** For Elementor compat */
	elementor_version?: string;
	created?: string;
	thumbnail?: string;

	/** Which site-settings sections are included */
	'site-settings'?: string[];

	/** Template entries */
	templates?: Record<string, KitTemplateEntry>;

	/** Content entries (pages, posts) */
	content?: Record<string, Record<string, KitContentEntry>>;

	/** Taxonomy terms to create */
	taxonomies?: Record<
		string,
		Record<string, { name: string; slug: string; parent: number; description?: string }>
	>;

	/** Required plugins */
	plugins?: { name: string; plugin: string; version: string }[];

	/** Experiment/feature flags */
	experiments?: Record<
		string,
		{ name: string; title: string; state: string; default: string; release_status: string }
	>;
}

export interface KitTemplateEntry {
	title: string;
	doc_type: string;
	thumbnail?: string;
	conditions?: string[][];
	location?: string;
}

export interface KitContentEntry {
	title: string;
	excerpt?: string;
	doc_type: string;
	thumbnail?: string;
	url?: string;
	terms?: { term_id: string; taxonomy: string; slug: string }[];
	show_on_front?: boolean;
}

export interface KitSiteSettings {
	settings: Record<string, unknown>;
}

export interface KitTemplate {
	content: ElementNode[];
	settings?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

/**
 * Elementor-specific node format (for import compatibility).
 */
export interface ElementorNode {
	id: string;
	elType: 'container' | 'section' | 'column' | 'widget';
	widgetType?: string;
	settings: Record<string, unknown>;
	elements: ElementorNode[];
}

/**
 * Import session for rollback support.
 */
export interface ImportSession {
	sessionId: string;
	kitTitle: string;
	kitSource: 'local' | 'cloud';
	userId: number;
	startTimestamp: number;
	endTimestamp?: number;
	importedAttachments: number[];
	importedPosts: number[];
	importedTemplates: number[];
	previousKitId?: number;
}
