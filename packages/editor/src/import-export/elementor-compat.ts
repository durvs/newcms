/**
 * Elementor compatibility layer — converts Elementor JSON format to NewCMS format.
 *
 * This handles the import of Elementor template kits (ZIP with manifest.json,
 * site-settings.json, and template JSON files).
 */

import type { ElementNode } from '../element-tree/types';
import { generateElementId } from '../element-tree/types';
import type { ElementorNode } from './types';

/**
 * Widget type mapping from Elementor names to NewCMS names.
 */
const WIDGET_MAP: Record<string, string> = {
	// Text
	'heading': 'heading',
	'text-editor': 'paragraph',
	'animated-headline': 'heading-animated',
	'blockquote': 'quote',
	'code-highlight': 'code',
	'icon-list': 'icon-list',

	// Media
	'image': 'image',
	'video': 'video',
	'image-gallery': 'gallery',
	'image-carousel': 'carousel',
	'media-carousel': 'carousel',
	'testimonial-carousel': 'testimonial',
	'slides': 'slides',
	'lottie': 'lottie',
	'hotspot': 'hotspot',
	'google-maps': 'map',

	// Interactive
	'button': 'button',
	'tabs': 'tabs',
	'accordion': 'accordion',
	'toggle': 'toggle',
	'divider': 'separator',
	'spacer': 'spacer',
	'html': 'html',
	'shortcode': 'shortcode',
	'icon': 'icon',
	'icon-box': 'icon-box',
	'social-icons': 'social-icons',
	'star-rating': 'rating',
	'counter': 'counter',
	'progress': 'progress-bar',
	'alert': 'alert',
	'menu-anchor': 'anchor',

	// Marketing
	'price-table': 'pricing-table',
	'price-list': 'price-list',
	'call-to-action': 'cta',
	'countdown': 'countdown',
	'progress-tracker': 'progress-tracker',
	'flip-box': 'flip-box',
	'link-in-bio': 'link-in-bio',

	// Navigation
	'nav-menu': 'nav-menu',
	'mega-menu': 'mega-menu',
	'search-form': 'search',
	'table-of-contents': 'toc',
	'breadcrumbs': 'breadcrumb',

	// Social
	'share-buttons': 'share-buttons',

	// Forms
	'form': 'form',
	'login': 'login-form',

	// Theme
	'theme-site-logo': 'site-logo',
	'theme-site-title': 'site-title',
	'theme-page-title': 'page-title',
	'theme-post-title': 'post-title',
	'theme-post-content': 'post-content',
	'theme-post-excerpt': 'post-excerpt',
	'theme-post-featured-image': 'featured-image',
	'theme-archive-title': 'archive-title',
	'theme-archive-posts': 'archive-posts',

	// Loop
	'loop-grid': 'loop-grid',
	'loop-carousel': 'loop-carousel',

	// E-commerce (WooCommerce)
	'woocommerce-product-title': 'product-title',
	'woocommerce-product-price': 'product-price',
	'woocommerce-product-images': 'product-gallery',
	'woocommerce-product-add-to-cart': 'add-to-cart',
	'woocommerce-products': 'product-grid',
	'woocommerce-cart': 'cart',
	'woocommerce-checkout-page': 'checkout',
};

/**
 * Convert an Elementor element tree to NewCMS format.
 * Recursively processes all nodes, remapping widget types and generating new IDs.
 */
export function convertElementorTree(elements: ElementorNode[]): ElementNode[] {
	return elements.map(convertNode);
}

function convertNode(node: ElementorNode): ElementNode {
	const newId = generateElementId();

	// Map element type
	let elType = node.elType;
	if (elType === 'column') {
		// Elementor columns become containers in NewCMS
		elType = 'container';
	}

	// Map widget type
	let widgetType = node.widgetType;
	if (widgetType && WIDGET_MAP[widgetType]) {
		widgetType = WIDGET_MAP[widgetType];
	}

	// Convert settings — handle Elementor-specific keys
	const settings = convertSettings(node.settings, widgetType);

	return {
		id: newId,
		elType: elType as ElementNode['elType'],
		widgetType: elType === 'widget' ? widgetType : undefined,
		settings,
		elements: node.elements ? convertElementorTree(node.elements) : [],
	};
}

function convertSettings(
	settings: Record<string, unknown>,
	_widgetType?: string,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(settings)) {
		// Skip internal Elementor keys
		if (key.startsWith('__') && key !== '__dynamic__') continue;
		if (key === '_element_id') continue;

		// Preserve dynamic tags
		if (key === '__dynamic__') {
			result.__dynamic__ = convertDynamicTags(value as Record<string, string>);
			continue;
		}

		// Map the key
		mapSettingKey(key, value, result);
	}

	return result;
}

/**
 * Elementor size value: { size: number, unit: string } or { size: number, unit: string, sizes: {} }
 */
function convertSize(val: unknown): { size: number; unit: string } | null {
	if (!val || typeof val !== 'object') return null;
	const v = val as Record<string, unknown>;
	if (typeof v.size === 'number' && typeof v.unit === 'string') {
		return { size: v.size, unit: v.unit || 'px' };
	}
	return null;
}

/**
 * Elementor dimensions: { top: string, right: string, bottom: string, left: string, unit: string, isLinked: boolean }
 */
function convertDimensions(val: unknown): { top: number; right: number; bottom: number; left: number; unit: string; linked: boolean } | null {
	if (!val || typeof val !== 'object') return null;
	const v = val as Record<string, unknown>;
	return {
		top: parseInt(String(v.top ?? '0'), 10) || 0,
		right: parseInt(String(v.right ?? '0'), 10) || 0,
		bottom: parseInt(String(v.bottom ?? '0'), 10) || 0,
		left: parseInt(String(v.left ?? '0'), 10) || 0,
		unit: String(v.unit ?? 'px'),
		linked: v.isLinked === true || v.isLinked === 'true',
	};
}

function dimToCSS(d: { top: number; right: number; bottom: number; left: number; unit: string }): string {
	return `${d.top}${d.unit} ${d.right}${d.unit} ${d.bottom}${d.unit} ${d.left}${d.unit}`;
}

function mapSettingKey(key: string, value: unknown, result: Record<string, unknown>): void {
	// ─── Content ─────────────────────────────────────────
	const directMap: Record<string, string> = {
		'title': 'content',
		'editor': 'content',
		'header_size': 'level',
		'space': 'height',
		'html': 'content',
		'shortcode': 'content',
		'selected_icon': 'icon',
		'link': 'url',
		'button_text': 'text',
	};

	if (directMap[key]) {
		// For link, extract url from object
		if (key === 'link' && typeof value === 'object' && value !== null) {
			result.url = (value as Record<string, unknown>).url ?? '';
		} else {
			result[directMap[key]] = value;
		}
		return;
	}

	// ─── Alignment ──────────────────────────────────────
	if (key === 'align' || key === 'text_align') {
		result.textAlign = value;
		return;
	}
	if (key === 'content_width') {
		if (value === 'full') result.width = '100%';
		return;
	}

	// ─── Typography ─────────────────────────────────────
	if (key === 'title_color' || key === 'text_color' || key === 'color') {
		result.color = value;
		return;
	}
	if (key === 'typography_font_family' || key === 'title_typography_font_family') {
		result.fontFamily = value;
		return;
	}
	if (key === 'typography_font_size' || key === 'title_typography_font_size') {
		const s = convertSize(value);
		if (s) result.fontSize = s;
		return;
	}
	if (key === 'typography_font_weight' || key === 'title_typography_font_weight') {
		result.fontWeight = String(value);
		return;
	}
	if (key === 'typography_line_height' || key === 'title_typography_line_height') {
		const s = convertSize(value);
		if (s) result.lineHeight = s;
		return;
	}
	if (key === 'typography_letter_spacing') {
		const s = convertSize(value);
		if (s) result.letterSpacing = s;
		return;
	}
	if (key === 'typography_text_transform') {
		result.textTransform = value;
		return;
	}
	if (key === 'typography_font_style') {
		result.fontStyle = value;
		return;
	}
	if (key === 'typography_text_decoration') {
		result.textDecoration = value;
		return;
	}

	// ─── Background ─────────────────────────────────────
	if (key === 'background_color' || key === 'background_background_color') {
		result.backgroundColor = value;
		return;
	}
	if (key === 'background_image') {
		if (typeof value === 'object' && value !== null) {
			const img = value as Record<string, unknown>;
			if (img.url) result.backgroundImage = `url(${img.url})`;
		}
		return;
	}

	// ─── Spacing ────────────────────────────────────────
	if (key === 'padding') {
		const d = convertDimensions(value);
		if (d) {
			result._padding = d;
			result.padding = dimToCSS(d);
		}
		return;
	}
	if (key === 'margin') {
		const d = convertDimensions(value);
		if (d) {
			result._margin = d;
			result.margin = dimToCSS(d);
		}
		return;
	}

	// ─── Border ─────────────────────────────────────────
	if (key === 'border_border') {
		result.borderStyle = value || 'none';
		return;
	}
	if (key === 'border_width') {
		const d = convertDimensions(value);
		if (d) result.borderWidth = { size: d.top, unit: d.unit };
		return;
	}
	if (key === 'border_color') {
		result.borderColor = value;
		return;
	}
	if (key === 'border_radius') {
		const d = convertDimensions(value);
		if (d) result.borderRadius = d;
		return;
	}

	// ─── Shadow ─────────────────────────────────────────
	if (key === 'box_shadow_box_shadow') {
		if (typeof value === 'object' && value !== null) {
			const s = value as Record<string, unknown>;
			result.shadowColor = s.color ?? '';
			result.shadowBlur = { size: Number(s.blur ?? 0), unit: 'px' };
		}
		return;
	}

	// ─── Layout (containers) ────────────────────────────
	if (key === 'flex_direction' || key === 'container_type') {
		if (value === 'row' || value === 'column' || value === 'row-reverse' || value === 'column-reverse') {
			result.direction = value;
		}
		return;
	}
	if (key === 'flex_justify_content' || key === 'justify_content') {
		result.justifyContent = value;
		return;
	}
	if (key === 'flex_align_items' || key === 'align_items') {
		result.alignItems = value;
		return;
	}
	if (key === 'flex_gap' || key === 'gap') {
		const s = convertSize(value);
		if (s) result.gap = s;
		return;
	}
	if (key === 'flex_wrap') {
		result.flexWrap = value;
		return;
	}

	// ─── Width / Height ─────────────────────────────────
	if (key === 'width' || key === 'custom_width') {
		const s = convertSize(value);
		if (s) result.width = s;
		return;
	}
	if (key === 'min_height') {
		const s = convertSize(value);
		if (s) result.minHeight = s;
		return;
	}
	if (key === 'height') {
		const s = convertSize(value);
		if (s) result.height = `${s.size}${s.unit}`;
		else if (typeof value === 'string') result.height = value;
		return;
	}

	// ─── Position ───────────────────────────────────────
	if (key === 'position') {
		result.position = value;
		return;
	}
	if (key === '_z_index') {
		result.zIndex = Number(value) || 0;
		return;
	}

	// ─── Overflow ───────────────────────────────────────
	if (key === 'overflow') {
		result.overflow = value;
		return;
	}

	// ─── Image widget ───────────────────────────────────
	if (key === 'image') {
		if (typeof value === 'object' && value !== null) {
			const img = value as Record<string, unknown>;
			result.url = img.url ?? '';
			if (img.alt) result.alt = img.alt;
		}
		return;
	}
	if (key === 'caption') {
		result.caption = value;
		return;
	}

	// ─── Button ─────────────────────────────────────────
	if (key === 'text' || key === 'button_type') {
		result[key] = value;
		return;
	}

	// ─── CSS classes ────────────────────────────────────
	if (key === '_css_classes' || key === 'css_classes') {
		result.cssClasses = value;
		return;
	}

	// ─── Custom CSS ─────────────────────────────────────
	if (key === 'custom_css') {
		result.customCss = value;
		return;
	}

	// Preserve anything not explicitly mapped
	result[key] = value;
}

/**
 * Convert Elementor dynamic tag format to NewCMS format.
 * Elementor: "[elementor-tag id=abc name=post-title settings={}]"
 * NewCMS: "[tag id=abc name=post-title settings={}]"
 */
function convertDynamicTags(tags: Record<string, string>): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(tags)) {
		result[key] = value.replace(/\[elementor-tag\s/g, '[tag ');
	}
	return result;
}

/**
 * Convert Elementor site-settings to NewCMS Design Kit format.
 */
export function convertSiteSettings(settings: Record<string, unknown>): Record<string, unknown> {
	const kit: Record<string, unknown> = {};

	// Colors
	if (Array.isArray(settings.custom_colors)) {
		kit.colors = settings.custom_colors.map((c: Record<string, unknown>) => ({
			id: String(c._id ?? ''),
			title: String(c.title ?? ''),
			color: String(c.color ?? ''),
		}));
	}

	// Typography
	if (Array.isArray(settings.custom_typography)) {
		kit.typography = settings.custom_typography.map((t: Record<string, unknown>) => ({
			id: String(t._id ?? ''),
			title: String(t.title ?? ''),
			fontFamily: String(t.typography_font_family ?? ''),
			fontSize: t.typography_font_size ?? { size: 16, unit: 'px' },
			fontWeight: String(t.typography_font_weight ?? '400'),
			lineHeight: t.typography_line_height ?? { size: 1.5, unit: 'em' },
			letterSpacing: t.typography_letter_spacing ?? { size: 0, unit: 'px' },
		}));
	}

	// Body typography
	if (settings.body_typography_font_family) kit.bodyFontFamily = settings.body_typography_font_family;
	if (settings.body_typography_font_size) kit.bodyFontSize = settings.body_typography_font_size;

	return kit;
}
