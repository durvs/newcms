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

		// Map common setting keys
		const mapped = mapSettingKey(key, value);
		if (mapped) {
			result[mapped.key] = mapped.value;
		} else {
			// Preserve unknown settings as-is
			result[key] = value;
		}
	}

	return result;
}

function mapSettingKey(key: string, value: unknown): { key: string; value: unknown } | null {
	// Direct mappings
	const directMap: Record<string, string> = {
		'title': 'content',
		'editor': 'content',
		'title_color': 'color',
		'header_size': 'level',
		'align': 'textAlign',
		'text_align': 'textAlign',
		'space': 'height',
	};

	if (directMap[key]) {
		return { key: directMap[key], value };
	}

	return null;
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
