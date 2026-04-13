import { useState, type DragEvent } from 'react';
import { Search, Box, Image, Minus, Square, Code2, List, Quote, ChevronsUpDown, AlignLeft, Heading } from 'lucide-react';
import { useEditorStore } from '../store/editor-store';

interface WidgetDef {
	type: string;
	label: string;
	icon: typeof Heading;
	category: 'text' | 'media' | 'layout';
}

const WIDGETS: WidgetDef[] = [
	{ type: 'heading', label: 'Heading', icon: Heading, category: 'text' },
	{ type: 'paragraph', label: 'Text', icon: AlignLeft, category: 'text' },
	{ type: 'list', label: 'List', icon: List, category: 'text' },
	{ type: 'quote', label: 'Quote', icon: Quote, category: 'text' },
	{ type: 'code', label: 'Code', icon: Code2, category: 'text' },
	{ type: 'image', label: 'Image', icon: Image, category: 'media' },
	{ type: 'button', label: 'Button', icon: Square, category: 'layout' },
	{ type: 'separator', label: 'Divider', icon: Minus, category: 'layout' },
	{ type: 'spacer', label: 'Spacer', icon: ChevronsUpDown, category: 'layout' },
	{ type: 'html', label: 'HTML', icon: Code2, category: 'layout' },
];

const catLabels = { text: 'Text', media: 'Media', layout: 'Layout' };

export function WidgetPicker() {
	const [search, setSearch] = useState('');
	const addContainer = useEditorStore((s) => s.addContainer);
	const startDrag = useEditorStore((s) => s.startDrag);

	const filtered = search
		? WIDGETS.filter((w) => w.label.toLowerCase().includes(search.toLowerCase()))
		: WIDGETS;

	function onDragStart(e: DragEvent, type: string) {
		e.dataTransfer.setData('widget-type', type);
		e.dataTransfer.effectAllowed = 'copy';
		startDrag(type);
	}

	return (
		<div style={{ padding: 12 }}>
			<div style={{ position: 'relative', marginBottom: 12 }}>
				<Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cm-text-faint)' }} />
				<input
					type="text"
					placeholder="Search widgets..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						width: '100%', height: 32, borderRadius: 8, boxSizing: 'border-box',
						border: '1px solid var(--cm-border)', background: 'var(--cm-input-bg)',
						paddingLeft: 32, paddingRight: 10, fontSize: 12,
						color: 'var(--cm-text)', outline: 'none',
					}}
				/>
			</div>

			<button
				onClick={() => addContainer(null)}
				draggable
				onDragStart={(e) => { e.dataTransfer.setData('widget-type', '__container'); startDrag('__container'); }}
				style={{
					width: '100%', display: 'flex', alignItems: 'center', gap: 8,
					padding: '8px 12px', borderRadius: 8, marginBottom: 16,
					border: '1.5px dashed var(--cm-border)', background: 'transparent',
					color: 'var(--cm-text-muted)', fontSize: 12, fontWeight: 500,
					cursor: 'grab', boxSizing: 'border-box',
				}}
			>
				<Box size={16} /> Container
			</button>

			{(['text', 'media', 'layout'] as const).map((cat) => {
				const items = filtered.filter((w) => w.category === cat);
				if (items.length === 0) return null;
				return (
					<div key={cat} style={{ marginBottom: 16 }}>
						<div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cm-text-faint)', marginBottom: 8 }}>
							{catLabels[cat]}
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
							{items.map((w) => (
								<WidgetCard key={w.type} widget={w} onDragStart={onDragStart} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function WidgetCard({ widget, onDragStart }: { widget: WidgetDef; onDragStart: (e: DragEvent, type: string) => void }) {
	const [hover, setHover] = useState(false);
	const addElement = useEditorStore((s) => s.addElement);
	const Icon = widget.icon;

	return (
		<button
			draggable
			onDragStart={(e) => onDragStart(e, widget.type)}
			onClick={() => addElement(widget.type, null)}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
				padding: '12px 4px', borderRadius: 8, border: 'none',
				background: hover ? 'var(--cm-surface-elevated)' : 'transparent',
				color: hover ? 'var(--color-accent)' : 'var(--cm-text-muted)',
				fontSize: 10, fontWeight: 500, cursor: 'grab',
				transition: 'all .12s',
			}}
		>
			<Icon size={20} strokeWidth={1.5} />
			{widget.label}
		</button>
	);
}
