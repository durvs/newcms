import type { Block } from './types';

/**
 * Serialize a Block tree back to HTML with block comment delimiters.
 *
 * Output format:
 *   <!-- cms:paragraph {"align":"center"} -->
 *   <p class="has-text-align-center">Hello World</p>
 *   <!-- /cms:paragraph -->
 */
export function serializeBlocks(blocks: Block[]): string {
	return blocks.map((block) => serializeBlock(block)).join('\n\n');
}

function serializeBlock(block: Block): string {
	const shortName = block.name.replace(/^cms\//, '');

	// Freeform blocks are just raw HTML
	if (block.name === 'cms/freeform') {
		return block.innerHTML;
	}

	const attrsStr = Object.keys(block.attributes).length > 0
		? ` ${JSON.stringify(block.attributes)}`
		: '';

	// Self-closing (no inner content or blocks)
	if (!block.innerHTML && block.innerBlocks.length === 0) {
		return `<!-- cms:${shortName}${attrsStr} /-->`;
	}

	const inner = block.innerBlocks.length > 0
		? `\n${serializeBlocks(block.innerBlocks)}\n`
		: `\n${block.innerHTML}\n`;

	return `<!-- cms:${shortName}${attrsStr} -->${inner}<!-- /cms:${shortName} -->`;
}
