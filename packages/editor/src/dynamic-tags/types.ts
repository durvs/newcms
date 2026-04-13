/**
 * Dynamic Tags — replace static control values with CMS data at render time.
 *
 * Storage format in element settings:
 * {
 *   "title": "Static fallback",
 *   "__dynamic__": {
 *     "title": "[tag id=abc name=post-title settings={}]"
 *   }
 * }
 */

export interface DynamicTag {
	id: string;
	name: string;
	settings: Record<string, unknown>;
}

export type TagReturnType = 'text' | 'html' | 'url' | 'object' | 'repeater';

export interface TagDefinition {
	name: string;
	title: string;
	category: string;
	returnType: TagReturnType;
	/** The function that resolves the tag value given a context */
	resolve: (settings: Record<string, unknown>, context: TagContext) => unknown;
}

export interface TagContext {
	postId?: number;
	postTitle?: string;
	postContent?: string;
	postExcerpt?: string;
	postDate?: string;
	postAuthor?: string;
	postUrl?: string;
	featuredImage?: string;
	siteName?: string;
	siteUrl?: string;
	siteDescription?: string;
	authorName?: string;
	authorBio?: string;
	authorAvatar?: string;
	currentDate?: string;
	currentTime?: string;
	userId?: number;
	userName?: string;
	customFields?: Record<string, unknown>;
}

/**
 * Parse a dynamic tag string: [tag id=abc name=post-title settings={"key":"val"}]
 */
export function parseTagString(tagStr: string): DynamicTag | null {
	const match = tagStr.match(/\[tag\s+id=(\S+)\s+name=(\S+)\s+settings=(\{.*\})\]/);
	if (!match) {
		// Simpler format: [tag id=abc name=post-title]
		const simple = tagStr.match(/\[tag\s+id=(\S+)\s+name=(\S+)\]/);
		if (!simple) return null;
		return { id: simple[1], name: simple[2], settings: {} };
	}

	let settings: Record<string, unknown> = {};
	try { settings = JSON.parse(match[3]); } catch { /* empty */ }

	return { id: match[1], name: match[2], settings };
}

/**
 * Serialize a dynamic tag to string format.
 */
export function serializeTag(tag: DynamicTag): string {
	const settingsStr = JSON.stringify(tag.settings);
	return `[tag id=${tag.id} name=${tag.name} settings=${settingsStr}]`;
}
