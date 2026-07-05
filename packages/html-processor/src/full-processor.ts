/**
 * Full HTML5 processor — builds an element tree with proper nesting,
 * implicit closing, and breadcrumb tracking.
 *
 * Zero external dependencies.
 */

export interface HtmlNode {
	type: 'element' | 'text' | 'comment';
	tag?: string;
	attributes?: Map<string, string>;
	children: HtmlNode[];
	parent?: HtmlNode;
	text?: string;
	selfClosing?: boolean;
}

const VOID_ELEMENTS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
]);

const AUTO_CLOSE_MAP: Record<string, Set<string>> = {
	p: new Set(['p']),
	li: new Set(['li']),
	dt: new Set(['dt', 'dd']),
	dd: new Set(['dt', 'dd']),
	tr: new Set(['tr']),
	td: new Set(['td', 'th']),
	th: new Set(['td', 'th']),
	option: new Set(['option']),
	optgroup: new Set(['optgroup']),
};

export class FullProcessor {
	private root: HtmlNode;
	private current: HtmlNode;

	constructor(html: string) {
		this.root = { type: 'element', tag: '#document', children: [] };
		this.current = this.root;
		this.parse(html);
	}

	getRoot(): HtmlNode {
		return this.root;
	}

	getBreadcrumbs(node: HtmlNode): string[] {
		const path: string[] = [];
		let cur: HtmlNode | undefined = node;
		while (cur && cur !== this.root) {
			if (cur.tag) path.unshift(cur.tag);
			cur = cur.parent;
		}
		return path;
	}

	findAll(tagName: string): HtmlNode[] {
		const target = tagName.toLowerCase();
		const results: HtmlNode[] = [];
		this.walk(this.root, (node) => {
			if (node.type === 'element' && node.tag === target) results.push(node);
		});
		return results;
	}

	findFirst(tagName: string): HtmlNode | undefined {
		const target = tagName.toLowerCase();
		let result: HtmlNode | undefined;
		this.walk(this.root, (node) => {
			if (!result && node.type === 'element' && node.tag === target) result = node;
		});
		return result;
	}

	findByClass(className: string): HtmlNode[] {
		const results: HtmlNode[] = [];
		this.walk(this.root, (node) => {
			if (node.type === 'element') {
				const cls = node.attributes?.get('class') ?? '';
				if (cls.split(/\s+/).includes(className)) results.push(node);
			}
		});
		return results;
	}

	findById(id: string): HtmlNode | undefined {
		let result: HtmlNode | undefined;
		this.walk(this.root, (node) => {
			if (!result && node.type === 'element' && node.attributes?.get('id') === id) result = node;
		});
		return result;
	}

	getTextContent(node: HtmlNode): string {
		if (node.type === 'text') return node.text ?? '';
		return node.children.map((child) => this.getTextContent(child)).join('');
	}

	serialize(node?: HtmlNode): string {
		const target = node ?? this.root;
		if (target.type === 'text') return target.text ?? '';
		if (target.type === 'comment') return `<!--${target.text ?? ''}-->`;
		if (target === this.root) {
			return target.children.map((child) => this.serialize(child)).join('');
		}
		const tag = target.tag ?? 'div';
		let result = `<${tag}`;
		if (target.attributes) {
			for (const [name, value] of target.attributes) {
				result += ` ${name}="${escapeAttr(value)}"`;
			}
		}
		if (target.selfClosing || VOID_ELEMENTS.has(tag)) return result + ' />';
		result += '>';
		result += target.children.map((child) => this.serialize(child)).join('');
		result += `</${tag}>`;
		return result;
	}

	walk(node: HtmlNode, visitor: (node: HtmlNode) => void): void {
		visitor(node);
		for (const child of node.children) this.walk(child, visitor);
	}

	// ─── Parser ──────────────────────────────────────────────

	private parse(html: string): void {
		let i = 0;
		while (i < html.length) {
			const openIdx = html.indexOf('<', i);
			if (openIdx === -1) {
				this.addText(html.slice(i));
				break;
			}
			if (openIdx > i) this.addText(html.slice(i, openIdx));

			if (html.startsWith('<!--', openIdx)) {
				const endIdx = html.indexOf('-->', openIdx + 4);
				if (endIdx === -1) {
					this.addText(html.slice(openIdx));
					break;
				}
				this.addComment(html.slice(openIdx + 4, endIdx));
				i = endIdx + 3;
				continue;
			}

			if (html[openIdx + 1] === '!' || html[openIdx + 1] === '?') {
				const endIdx = html.indexOf('>', openIdx);
				if (endIdx === -1) break;
				i = endIdx + 1;
				continue;
			}

			if (html[openIdx + 1] === '/') {
				const endIdx = html.indexOf('>', openIdx);
				if (endIdx === -1) break;
				this.closeTag(
					html
						.slice(openIdx + 2, endIdx)
						.trim()
						.toLowerCase(),
				);
				i = endIdx + 1;
				continue;
			}

			const endIdx = html.indexOf('>', openIdx);
			if (endIdx === -1) break;
			const tagContent = html.slice(openIdx + 1, endIdx);
			const isSelfClosing = tagContent.endsWith('/');
			const clean = isSelfClosing ? tagContent.slice(0, -1) : tagContent;
			const spIdx = clean.search(/\s/);
			const tagName = (spIdx === -1 ? clean : clean.slice(0, spIdx)).toLowerCase();
			const attrStr = spIdx === -1 ? '' : clean.slice(spIdx).trim();

			if (tagName && /^[a-z][a-z0-9-]*$/.test(tagName)) {
				this.openTag(tagName, attrStr, isSelfClosing || VOID_ELEMENTS.has(tagName));
			}
			i = endIdx + 1;
		}
	}

	private openTag(name: string, attrStr: string, selfClosing: boolean): void {
		const autoSet = AUTO_CLOSE_MAP[name];
		if (autoSet && this.current.tag && autoSet.has(this.current.tag)) {
			this.current = this.current.parent ?? this.root;
		}
		const node: HtmlNode = {
			type: 'element',
			tag: name,
			attributes: this.parseAttrs(attrStr),
			children: [],
			parent: this.current,
			selfClosing,
		};
		this.current.children.push(node);
		if (!selfClosing) this.current = node;
	}

	private closeTag(name: string): void {
		let node: HtmlNode | undefined = this.current;
		while (node && node !== this.root) {
			if (node.tag === name) {
				this.current = node.parent ?? this.root;
				return;
			}
			node = node.parent;
		}
	}

	private addText(text: string): void {
		if (!text) return;
		this.current.children.push({ type: 'text', text, children: [], parent: this.current });
	}

	private addComment(text: string): void {
		this.current.children.push({ type: 'comment', text, children: [], parent: this.current });
	}

	private parseAttrs(s: string): Map<string, string> {
		const attrs = new Map<string, string>();
		if (!s) return attrs;
		const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
		let m;
		while ((m = re.exec(s)) !== null) attrs.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '');
		return attrs;
	}
}

function escapeAttr(v: string): string {
	return v
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
