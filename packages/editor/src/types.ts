import { z } from 'zod';

/**
 * A parsed block node in the content tree.
 */
export interface Block {
	/** Block type name (e.g., "paragraph", "heading", "image") */
	name: string;
	/** Block attributes/settings */
	attributes: Record<string, unknown>;
	/** Inner blocks (children) */
	innerBlocks: Block[];
	/** Raw inner HTML content (between opening and closing comments) */
	innerHTML: string;
}

/**
 * Block type definition — registered in the BlockRegistry.
 */
export interface BlockTypeDefinition {
	/** Unique name (e.g., "cms/paragraph", "cms/heading") */
	name: string;
	/** Display title */
	title: string;
	/** Category for the block inserter */
	category?: string;
	/** Icon name */
	icon?: string;
	/** Description */
	description?: string;
	/** Zod schema for validating attributes */
	attributeSchema?: z.ZodType;
	/** Supported features */
	supports?: BlockSupports;
	/** Default attributes */
	defaultAttributes?: Record<string, unknown>;
	/** Parent blocks that can contain this block */
	parent?: string[];
}

/**
 * Block supports — features a block can opt into.
 * Maps to CSS generation for alignment, colors, typography, etc.
 */
export interface BlockSupports {
	align?: boolean | string[];
	anchor?: boolean;
	color?: {
		background?: boolean;
		text?: boolean;
		gradient?: boolean;
		link?: boolean;
	};
	typography?: {
		fontSize?: boolean;
		lineHeight?: boolean;
		fontFamily?: boolean;
		fontWeight?: boolean;
		letterSpacing?: boolean;
		textTransform?: boolean;
		textDecoration?: boolean;
	};
	spacing?: {
		margin?: boolean | string[];
		padding?: boolean | string[];
		blockGap?: boolean;
	};
	border?: {
		color?: boolean;
		radius?: boolean;
		style?: boolean;
		width?: boolean;
	};
	shadow?: boolean;
	layout?: boolean;
	html?: boolean;
	className?: boolean;
	customClassName?: boolean;
}

/**
 * A block pattern — predefined block arrangement.
 */
export interface BlockPattern {
	name: string;
	title: string;
	description?: string;
	categories?: string[];
	content: string;
	keywords?: string[];
}
