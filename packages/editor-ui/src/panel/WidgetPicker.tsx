import { useState } from 'react';
import { Search, Plus, Box, Type, Image, Columns, Minus, Square, Code2, List, Quote, ChevronsUpDown } from 'lucide-react';
import { useEditorStore } from '../store/editor-store';

interface WidgetDef {
	type: string;
	label: string;
	icon: typeof Type;
	category: 'text' | 'media' | 'layout';
}

const WIDGETS: WidgetDef[] = [
	{ type: 'heading', label: 'Heading', icon: Type, category: 'text' },
	{ type: 'paragraph', label: 'Text', icon: Type, category: 'text' },
	{ type: 'list', label: 'List', icon: List, category: 'text' },
	{ type: 'quote', label: 'Quote', icon: Quote, category: 'text' },
	{ type: 'code', label: 'Code', icon: Code2, category: 'text' },
	{ type: 'image', label: 'Image', icon: Image, category: 'media' },
	{ type: 'button', label: 'Button', icon: Square, category: 'layout' },
	{ type: 'separator', label: 'Divider', icon: Minus, category: 'layout' },
	{ type: 'spacer', label: 'Spacer', icon: ChevronsUpDown, category: 'layout' },
	{ type: 'html', label: 'HTML', icon: Code2, category: 'layout' },
];

export function WidgetPicker() {
	const [search, setSearch] = useState('');
	const addElement = useEditorStore((s) => s.addElement);
	const addContainer = useEditorStore((s) => s.addContainer);

	const filtered = search
		? WIDGETS.filter((w) => w.label.toLowerCase().includes(search.toLowerCase()))
		: WIDGETS;

	const categories = ['text', 'media', 'layout'] as const;
	const categoryLabels = { text: 'Text', media: 'Media', layout: 'Layout' };

	return (
		<div className="p-3">
			{/* Search */}
			<div className="relative mb-3">
				<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--cm-text-faint)]" />
				<input
					type="text"
					placeholder="Search widgets..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="h-8 w-full rounded-lg border border-[var(--cm-border)] bg-[var(--cm-input-bg)] pl-8 pr-3 text-xs text-[var(--cm-text)] placeholder:text-[var(--cm-text-faint)] outline-none focus:border-[var(--color-accent)]/50"
				/>
			</div>

			{/* Add Container button */}
			<button
				onClick={() => addContainer(null)}
				className="mb-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--cm-border)] px-3 py-2 text-xs font-medium text-[var(--cm-text-muted)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
			>
				<Box className="h-4 w-4" />
				Add Container
			</button>

			{/* Widget grid by category */}
			{categories.map((cat) => {
				const items = filtered.filter((w) => w.category === cat);
				if (items.length === 0) return null;
				return (
					<div key={cat} className="mb-4">
						<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--cm-text-faint)]">
							{categoryLabels[cat]}
						</p>
						<div className="grid grid-cols-3 gap-1.5">
							{items.map((w) => (
								<button
									key={w.type}
									onClick={() => addElement(w.type, null)}
									className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-[var(--cm-text-muted)] transition-colors hover:bg-[var(--cm-surface-elevated)] hover:text-[var(--color-accent)]"
								>
									<w.icon className="h-5 w-5" />
									<span className="text-[10px] font-medium">{w.label}</span>
								</button>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
