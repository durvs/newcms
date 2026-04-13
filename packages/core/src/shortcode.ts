/**
 * Shortcode system — register named patterns with callbacks,
 * then process content to replace shortcodes with rendered output.
 *
 * Syntax: [name attr="value"]content[/name] or [name attr="value" /]
 */

export type ShortcodeCallback = (
	attributes: Record<string, string>,
	content: string,
	tag: string,
) => string;

export class ShortcodeRegistry {
	private handlers: Map<string, ShortcodeCallback> = new Map();

	register(tag: string, callback: ShortcodeCallback): void {
		this.handlers.set(tag, callback);
	}

	unregister(tag: string): boolean {
		return this.handlers.delete(tag);
	}

	has(tag: string): boolean {
		return this.handlers.has(tag);
	}

	/**
	 * Process a string, replacing all registered shortcodes with their output.
	 * Supports nesting: inner shortcodes are processed first.
	 */
	process(content: string): string {
		if (this.handlers.size === 0) return content;

		const tagPattern = [...this.handlers.keys()].map(escRegex).join('|');

		// Self-closing: [tag attr="val" /]
		const selfClosingRe = new RegExp(
			`\\[(${tagPattern})(\\s[^\\]]*?)?\\s*\\/\\]`,
			'g',
		);

		// Enclosing: [tag attr="val"]content[/tag]
		const enclosingRe = new RegExp(
			`\\[(${tagPattern})(\\s[^\\]]*?)?\\]([\\s\\S]*?)\\[\\/\\1\\]`,
			'g',
		);

		let result = content;

		// Process enclosing first (inner to outer via iteration)
		let prevResult = '';
		let iterations = 0;
		while (result !== prevResult && iterations < 10) {
			prevResult = result;
			result = result.replace(enclosingRe, (full, tag: string, attrStr: string, inner: string) => {
				const handler = this.handlers.get(tag);
				if (!handler) return full;
				const attrs = parseShortcodeAttributes(attrStr?.trim() ?? '');
				return handler(attrs, inner, tag);
			});
			iterations++;
		}

		// Process self-closing
		result = result.replace(selfClosingRe, (full, tag: string, attrStr: string) => {
			const handler = this.handlers.get(tag);
			if (!handler) return full;
			const attrs = parseShortcodeAttributes(attrStr?.trim() ?? '');
			return handler(attrs, '', tag);
		});

		return result;
	}

	/**
	 * Strip all shortcodes from content (remove tags, keep content).
	 */
	strip(content: string): string {
		const tagPattern = [...this.handlers.keys()].map(escRegex).join('|');
		if (!tagPattern) return content;

		let result = content;
		result = result.replace(
			new RegExp(`\\[(${tagPattern})(\\s[^\\]]*?)?\\]([\\s\\S]*?)\\[\\/\\1\\]`, 'g'),
			'$3',
		);
		result = result.replace(
			new RegExp(`\\[(${tagPattern})(\\s[^\\]]*?)?\\s*\\/\\]`, 'g'),
			'',
		);
		return result;
	}

	getAll(): string[] {
		return [...this.handlers.keys()];
	}

	reset(): void {
		this.handlers.clear();
	}
}

function parseShortcodeAttributes(attrStr: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	if (!attrStr) return attrs;

	const re = /([a-zA-Z_][-a-zA-Z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))|([a-zA-Z_][-a-zA-Z0-9_]*)/g;
	let match;
	while ((match = re.exec(attrStr)) !== null) {
		if (match[1]) {
			attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
		} else if (match[5]) {
			attrs[match[5]] = '';
		}
	}
	return attrs;
}

function escRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
