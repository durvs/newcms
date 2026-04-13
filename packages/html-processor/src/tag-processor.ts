/**
 * Lightweight HTML tag processor — linear scan without building a full DOM tree.
 *
 * Finds tags by name, reads/modifies attributes and classes,
 * then serializes back to HTML. Operates on a mutable cursor
 * that advances through tags sequentially.
 *
 * Zero external dependencies.
 */
export class TagProcessor {
	private html: string;
	private cursor: number = 0;
	private currentTag: ParsedTag | null = null;
	private modifications: Map<number, TagModification> = new Map();

	constructor(html: string) {
		this.html = html;
	}

	/**
	 * Advance to the next tag matching the given name.
	 * Returns true if found, false if no more matches.
	 */
	nextTag(tagName?: string): boolean {
		const target = tagName?.toLowerCase();

		while (this.cursor < this.html.length) {
			const openIdx = this.html.indexOf('<', this.cursor);
			if (openIdx === -1) return false;

			// Skip comments, doctypes
			if (this.html[openIdx + 1] === '!' || this.html[openIdx + 1] === '?') {
				this.cursor = this.html.indexOf('>', openIdx) + 1;
				if (this.cursor === 0) return false;
				continue;
			}

			const isClosing = this.html[openIdx + 1] === '/';
			const nameStart = isClosing ? openIdx + 2 : openIdx + 1;
			const nameEnd = this.findTagNameEnd(nameStart);
			const name = this.html.slice(nameStart, nameEnd).toLowerCase();

			if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
				this.cursor = openIdx + 1;
				continue;
			}

			const closeIdx = this.html.indexOf('>', openIdx);
			if (closeIdx === -1) return false;

			const isSelfClosing = this.html[closeIdx - 1] === '/';
			const fullTag = this.html.slice(openIdx, closeIdx + 1);
			const attrString = this.html.slice(nameEnd, isSelfClosing ? closeIdx - 1 : closeIdx).trim();

			if (isClosing) {
				this.cursor = closeIdx + 1;
				continue;
			}

			if (!target || name === target) {
				this.currentTag = {
					name,
					fullTag,
					attrString,
					start: openIdx,
					end: closeIdx + 1,
					isClosing,
					isSelfClosing,
					attributes: this.parseAttributes(attrString),
				};
				this.cursor = closeIdx + 1;
				return true;
			}

			this.cursor = closeIdx + 1;
		}

		return false;
	}

	/**
	 * Get the name of the current tag.
	 */
	getTag(): string | null {
		return this.currentTag?.name ?? null;
	}

	/**
	 * Get an attribute value from the current tag.
	 */
	getAttribute(name: string): string | null {
		if (!this.currentTag) return null;
		return this.currentTag.attributes.get(name.toLowerCase()) ?? null;
	}

	/**
	 * Set an attribute on the current tag.
	 */
	setAttribute(name: string, value: string): void {
		if (!this.currentTag) return;
		const mod = this.getOrCreateModification();
		mod.setAttributes.set(name.toLowerCase(), value);
	}

	/**
	 * Remove an attribute from the current tag.
	 */
	removeAttribute(name: string): void {
		if (!this.currentTag) return;
		const mod = this.getOrCreateModification();
		mod.removeAttributes.add(name.toLowerCase());
	}

	/**
	 * Add a CSS class to the current tag.
	 */
	addClass(className: string): void {
		if (!this.currentTag) return;
		const mod = this.getOrCreateModification();
		mod.addClasses.add(className);
	}

	/**
	 * Remove a CSS class from the current tag.
	 */
	removeClass(className: string): void {
		if (!this.currentTag) return;
		const mod = this.getOrCreateModification();
		mod.removeClasses.add(className);
	}

	/**
	 * Check if the current tag has a CSS class.
	 */
	hasClass(className: string): boolean {
		if (!this.currentTag) return false;
		const classAttr = this.currentTag.attributes.get('class') ?? '';
		return classAttr.split(/\s+/).includes(className);
	}

	/**
	 * Get the final HTML with all modifications applied.
	 */
	getUpdatedHtml(): string {
		if (this.modifications.size === 0) return this.html;

		// Apply modifications from end to start to preserve offsets
		const sorted = [...this.modifications.entries()].sort((a, b) => b[0] - a[0]);
		let result = this.html;

		for (const [_start, mod] of sorted) {
			const tag = mod.tag;
			const newTag = this.rebuildTag(tag, mod);
			result = result.slice(0, tag.start) + newTag + result.slice(tag.end);
		}

		return result;
	}

	/**
	 * Reset the cursor to the beginning.
	 */
	reset(): void {
		this.cursor = 0;
		this.currentTag = null;
	}

	// ─── Private ─────────────────────────────────────────────

	private findTagNameEnd(start: number): number {
		let i = start;
		while (i < this.html.length && /[a-zA-Z0-9-]/.test(this.html[i])) i++;
		return i;
	}

	private parseAttributes(attrString: string): Map<string, string> {
		const attrs = new Map<string, string>();
		const regex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
		let match;

		while ((match = regex.exec(attrString)) !== null) {
			const name = match[1].toLowerCase();
			const value = match[2] ?? match[3] ?? match[4] ?? '';
			attrs.set(name, value);
		}

		return attrs;
	}

	private getOrCreateModification(): TagModification {
		if (!this.currentTag) throw new Error('No current tag');
		const start = this.currentTag.start;

		if (!this.modifications.has(start)) {
			this.modifications.set(start, {
				tag: this.currentTag,
				setAttributes: new Map(),
				removeAttributes: new Set(),
				addClasses: new Set(),
				removeClasses: new Set(),
			});
		}

		return this.modifications.get(start)!;
	}

	private rebuildTag(tag: ParsedTag, mod: TagModification): string {
		if (tag.isClosing) return tag.fullTag;

		const finalAttrs = new Map(tag.attributes);

		for (const name of mod.removeAttributes) {
			finalAttrs.delete(name);
		}

		for (const [name, value] of mod.setAttributes) {
			finalAttrs.set(name, value);
		}

		// Handle class modifications
		let classes = (finalAttrs.get('class') ?? '').split(/\s+/).filter(Boolean);
		for (const cls of mod.removeClasses) {
			classes = classes.filter((c) => c !== cls);
		}
		for (const cls of mod.addClasses) {
			if (!classes.includes(cls)) classes.push(cls);
		}
		if (classes.length > 0) {
			finalAttrs.set('class', classes.join(' '));
		} else {
			finalAttrs.delete('class');
		}

		let result = `<${tag.name}`;
		for (const [name, value] of finalAttrs) {
			result += ` ${name}="${escapeAttr(value)}"`;
		}
		if (tag.isSelfClosing) result += ' /';
		result += '>';

		return result;
	}
}

function escapeAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

interface ParsedTag {
	name: string;
	fullTag: string;
	attrString: string;
	start: number;
	end: number;
	isClosing: boolean;
	isSelfClosing: boolean;
	attributes: Map<string, string>;
}

interface TagModification {
	tag: ParsedTag;
	setAttributes: Map<string, string>;
	removeAttributes: Set<string>;
	addClasses: Set<string>;
	removeClasses: Set<string>;
}
