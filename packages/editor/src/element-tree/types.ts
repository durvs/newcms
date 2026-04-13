/**
 * Core data types for the visual builder element tree.
 *
 * Every document (page, template, popup) is a tree of ElementNodes.
 * The tree is stored as JSON in postmeta (_builder_data).
 */

export type ElementType = 'container' | 'section' | 'column' | 'widget';

export interface ElementNode {
	/** Unique identifier (8-char random string) */
	id: string;
	/** Structural type */
	elType: ElementType;
	/** Widget type name (only when elType === 'widget') */
	widgetType?: string;
	/** Control values set by the user */
	settings: Record<string, unknown>;
	/** Child elements (recursive) */
	elements: ElementNode[];
}

/**
 * Document-level settings (page settings, not element settings).
 */
export interface DocumentSettings {
	/** Page title override */
	pageTitle?: string;
	/** Custom CSS for this document */
	customCss?: string;
	/** Template type (page, header, footer, single, archive, popup, etc.) */
	templateType?: string;
	/** Builder version that last edited this document */
	builderVersion?: string;
	/** Whether the builder is active for this document */
	editMode?: 'builder' | 'default';
}

/**
 * Complete builder data for a document.
 */
export interface BuilderDocument {
	elements: ElementNode[];
	settings: DocumentSettings;
}

/**
 * Generate a random 8-character element ID.
 */
export function generateElementId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';
	for (let i = 0; i < 8; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

/**
 * Create a new element node with defaults.
 */
export function createElement(
	elType: ElementType,
	widgetType?: string,
	settings?: Record<string, unknown>,
): ElementNode {
	return {
		id: generateElementId(),
		elType,
		widgetType: elType === 'widget' ? widgetType : undefined,
		settings: settings ?? {},
		elements: [],
	};
}
