import type { Block } from './types';

/**
 * Parse block content (HTML with block comment delimiters) into a Block tree.
 *
 * Block format:
 *   <!-- cms:paragraph {"align":"center"} -->
 *   <p class="has-text-align-center">Hello World</p>
 *   <!-- /cms:paragraph -->
 *
 * Self-closing blocks:
 *   <!-- cms:separator /-->
 *
 * Nested blocks:
 *   <!-- cms:columns -->
 *   <!-- cms:column -->...<!-- /cms:column -->
 *   <!-- cms:column -->...<!-- /cms:column -->
 *   <!-- /cms:columns -->
 */
export function parseBlocks(content: string): Block[] {
	const blocks: Block[] = [];
	let pos = 0;

	while (pos < content.length) {
		const result = parseNextBlock(content, pos);

		if (!result) {
			const remaining = content.slice(pos).trim();
			if (remaining) {
				blocks.push({ name: 'cms/freeform', attributes: {}, innerBlocks: [], innerHTML: remaining });
			}
			break;
		}

		const textBefore = content.slice(pos, result.start).trim();
		if (textBefore) {
			blocks.push({ name: 'cms/freeform', attributes: {}, innerBlocks: [], innerHTML: textBefore });
		}

		blocks.push(result.block);
		pos = result.end;
	}

	return blocks;
}

interface ParseResult {
	block: Block;
	start: number;
	end: number;
}

const BLOCK_OPEN_RE = /<!--\s+cms:([a-z][a-z0-9/-]*)\s*(\{[^}]*\})?\s*(\/)?-->/g;

function parseNextBlock(content: string, startPos: number): ParseResult | null {
	BLOCK_OPEN_RE.lastIndex = startPos;
	const openMatch = BLOCK_OPEN_RE.exec(content);
	if (!openMatch) return null;

	const blockName = `cms/${openMatch[1]}`;
	const attrsJson = openMatch[2] ?? '{}';
	const isSelfClosing = !!openMatch[3];
	const openTagEnd = openMatch.index + openMatch[0].length;

	let attributes: Record<string, unknown> = {};
	try {
		attributes = JSON.parse(attrsJson);
	} catch { /* malformed JSON */ }

	if (isSelfClosing) {
		return {
			block: { name: blockName, attributes, innerBlocks: [], innerHTML: '' },
			start: openMatch.index,
			end: openTagEnd,
		};
	}

	const closingResult = findMatchingClose(content, openTagEnd, openMatch[1]);

	if (closingResult === null) {
		return {
			block: { name: blockName, attributes, innerBlocks: [], innerHTML: content.slice(openTagEnd).trim() },
			start: openMatch.index,
			end: content.length,
		};
	}

	const closeRe = new RegExp(`<!--\\s+/cms:${escapeRegex(openMatch[1])}\\s*-->`, 'g');
	closeRe.lastIndex = closingResult.commentStart;
	const closeMatch = closeRe.exec(content);
	const blockEnd = closeMatch ? closeMatch.index + closeMatch[0].length : content.length;

	const innerContent = content.slice(openTagEnd, closingResult.commentStart);
	const innerBlocks = parseBlocks(innerContent.trim());
	const hasRealBlocks = innerBlocks.some((b) => b.name !== 'cms/freeform');

	return {
		block: {
			name: blockName,
			attributes,
			innerBlocks: hasRealBlocks ? innerBlocks : [],
			innerHTML: hasRealBlocks ? '' : innerContent.trim(),
		},
		start: openMatch.index,
		end: blockEnd,
	};
}

function findMatchingClose(
	content: string,
	startPos: number,
	blockType: string,
): { commentStart: number } | null {
	let depth = 1;
	let pos = startPos;

	const openRe = new RegExp(`<!--\\s+cms:${escapeRegex(blockType)}[\\s{/]`, 'g');
	const closeRe = new RegExp(`<!--\\s+/cms:${escapeRegex(blockType)}\\s*-->`, 'g');

	while (depth > 0 && pos < content.length) {
		openRe.lastIndex = pos;
		closeRe.lastIndex = pos;

		const nextOpen = openRe.exec(content);
		const nextClose = closeRe.exec(content);

		if (!nextClose) return null;

		if (nextOpen && nextOpen.index < nextClose.index) {
			const endOfComment = content.indexOf('-->', nextOpen.index);
			const fullOpen = content.slice(nextOpen.index, endOfComment + 3);
			if (!fullOpen.includes('/-->')) depth++;
			pos = endOfComment + 3;
		} else {
			depth--;
			if (depth === 0) return { commentStart: nextClose.index };
			pos = nextClose.index + nextClose[0].length;
		}
	}

	return null;
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
