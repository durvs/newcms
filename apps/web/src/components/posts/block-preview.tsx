'use client';

/**
 * Client-side block preview — parses block comment syntax
 * and renders a visual representation of each block.
 */

interface ParsedBlock {
	name: string;
	attrs: Record<string, unknown>;
	innerHTML: string;
}

function parseBlocksClient(content: string): ParsedBlock[] {
	const blocks: ParsedBlock[] = [];
	const openRe = /<!--\s+cms:([a-z][a-z0-9/-]*)\s*(\{[^}]*\})?\s*(\/)?-->/g;

	let pos = 0;
	let match;

	while ((match = openRe.exec(content)) !== null) {
		const textBefore = content.slice(pos, match.index).trim();
		if (textBefore) {
			blocks.push({ name: 'freeform', attrs: {}, innerHTML: textBefore });
		}

		const name = match[1];
		let attrs: Record<string, unknown> = {};
		try {
			if (match[2]) attrs = JSON.parse(match[2]);
		} catch {
			/* skip */
		}

		if (match[3]) {
			blocks.push({ name, attrs, innerHTML: '' });
			pos = match.index + match[0].length;
			continue;
		}

		const closeTag = `<!-- /cms:${name} -->`;
		const closeIdx = content.indexOf(closeTag, match.index + match[0].length);
		if (closeIdx === -1) {
			blocks.push({ name, attrs, innerHTML: content.slice(match.index + match[0].length).trim() });
			pos = content.length;
			break;
		}

		blocks.push({
			name,
			attrs,
			innerHTML: content.slice(match.index + match[0].length, closeIdx).trim(),
		});
		pos = closeIdx + closeTag.length;
		openRe.lastIndex = pos;
	}

	const remaining = content.slice(pos).trim();
	if (remaining) blocks.push({ name: 'freeform', attrs: {}, innerHTML: remaining });

	return blocks;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, '');
}

const blockColors: Record<string, string> = {
	paragraph: 'bg-blue-500/10 text-blue-400',
	heading: 'bg-purple-500/10 text-purple-400',
	image: 'bg-emerald-500/10 text-emerald-400',
	list: 'bg-amber-500/10 text-amber-400',
	quote: 'bg-pink-500/10 text-pink-400',
	code: 'bg-gray-500/10 text-gray-400',
	separator: 'bg-gray-500/10 text-gray-400',
	spacer: 'bg-gray-500/10 text-gray-400',
	columns: 'bg-indigo-500/10 text-indigo-400',
	group: 'bg-indigo-500/10 text-indigo-400',
	button: 'bg-accent/10 text-accent',
	freeform: 'bg-orange-500/10 text-orange-400',
};

function BlockItem({ block }: { block: ParsedBlock }) {
	const label = block.name === 'freeform' ? 'HTML' : block.name;
	const color = blockColors[block.name] ?? 'bg-text-faint/10 text-text-faint';
	const preview = stripHtml(block.innerHTML).slice(0, 120);

	return (
		<div className="group flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-elevated px-4 py-3 transition-colors hover:border-border">
			<span
				className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
			>
				{label}
			</span>
			<div className="min-w-0 flex-1">
				{block.name === 'separator' ? (
					<hr className="my-1 border-border" />
				) : block.name === 'spacer' ? (
					<div className="text-[11px] text-text-faint">
						Spacer ({String(block.attrs.height ?? '100px')})
					</div>
				) : block.name === 'image' ? (
					<div className="text-[11px] text-text-muted">
						{String(block.attrs.alt ?? block.attrs.url ?? 'Image')}
					</div>
				) : preview ? (
					<p className="text-[13px] leading-relaxed text-text-muted">
						{preview}
						{preview.length >= 120 ? '...' : ''}
					</p>
				) : (
					<p className="text-[11px] italic text-text-faint">Empty block</p>
				)}
			</div>
		</div>
	);
}

export function BlockPreview({ content }: { content: string }) {
	if (!content.trim()) {
		return (
			<div className="rounded-xl border border-border-subtle bg-surface-elevated py-12 text-center">
				<p className="text-sm text-text-faint">No content to preview</p>
			</div>
		);
	}

	const blocks = parseBlocksClient(content);

	if (blocks.length === 0) {
		return (
			<div className="rounded-xl border border-border-subtle bg-surface-elevated py-12 text-center">
				<p className="text-sm text-text-faint">No blocks found</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{blocks.map((block, i) => (
				<BlockItem key={i} block={block} />
			))}
		</div>
	);
}
