export interface EditorBlock {
	id: string;
	type: string;
	attrs: Record<string, unknown>;
}

export interface BlockDefinition {
	type: string;
	label: string;
	icon: string;
	category: 'text' | 'media' | 'design';
	defaultAttrs: Record<string, unknown>;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
	{ type: 'paragraph', label: 'Paragraph', icon: 'T', category: 'text', defaultAttrs: { content: '' } },
	{ type: 'heading', label: 'Heading', icon: 'H', category: 'text', defaultAttrs: { content: '', level: 2 } },
	{ type: 'image', label: 'Image', icon: '🖼', category: 'media', defaultAttrs: { url: '', alt: '', caption: '' } },
	{ type: 'list', label: 'List', icon: '≡', category: 'text', defaultAttrs: { items: [''], ordered: false } },
	{ type: 'quote', label: 'Quote', icon: '"', category: 'text', defaultAttrs: { content: '', citation: '' } },
	{ type: 'code', label: 'Code', icon: '<>', category: 'text', defaultAttrs: { content: '', language: '' } },
	{ type: 'separator', label: 'Separator', icon: '—', category: 'design', defaultAttrs: {} },
	{ type: 'spacer', label: 'Spacer', icon: '↕', category: 'design', defaultAttrs: { height: '40px' } },
	{ type: 'button', label: 'Button', icon: '▢', category: 'design', defaultAttrs: { text: 'Click me', url: '' } },
	{ type: 'html', label: 'HTML', icon: '{}', category: 'design', defaultAttrs: { content: '' } },
];

export function generateId(): string {
	return Math.random().toString(36).slice(2, 10);
}
