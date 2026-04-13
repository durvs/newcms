import { useState, type DragEvent, type CSSProperties } from 'react';
import type { ElementNode } from '@newcms/editor';
import { useEditorStore } from '../store/editor-store';
import { GripVertical, Trash2, Copy } from 'lucide-react';

/**
 * Extract CSS inline styles from element settings.
 * Maps setting keys to CSS properties.
 */
function extractStyles(settings: Record<string, unknown>): CSSProperties {
	const css: CSSProperties = {};
	const s = settings;

	// Direct string values
	if (s.padding) css.padding = String(s.padding);
	if (s.margin) css.margin = String(s.margin);
	if (s.backgroundColor) css.backgroundColor = String(s.backgroundColor);
	if (s.color) css.color = String(s.color);
	if (s.textAlign) css.textAlign = String(s.textAlign) as CSSProperties['textAlign'];
	if (s.fontWeight) css.fontWeight = String(s.fontWeight);
	if (s.position && s.position !== 'static') css.position = String(s.position) as CSSProperties['position'];
	if (s.overflow) css.overflow = String(s.overflow) as CSSProperties['overflow'];

	// Border
	if (s.borderStyle && s.borderStyle !== 'none') {
		css.borderStyle = String(s.borderStyle);
		if (s.borderColor) css.borderColor = String(s.borderColor);
		const bw = s.borderWidth;
		if (bw && typeof bw === 'object' && 'size' in (bw as Record<string, unknown>)) {
			const v = bw as { size: number; unit: string };
			css.borderWidth = `${v.size}${v.unit}`;
		}
	}

	// Border radius
	const br = s.borderRadius;
	if (br && typeof br === 'object' && 'top' in (br as Record<string, unknown>)) {
		const v = br as { top: number; right: number; bottom: number; left: number; unit: string };
		css.borderRadius = `${v.top}${v.unit} ${v.right}${v.unit} ${v.bottom}${v.unit} ${v.left}${v.unit}`;
	}

	// Slider values: { size, unit }
	const sliderProps: [string, keyof CSSProperties][] = [
		['fontSize', 'fontSize'],
		['lineHeight', 'lineHeight'],
		['width', 'width'],
		['minHeight', 'minHeight'],
		['gap', 'gap'],
	];
	for (const [key, cssProp] of sliderProps) {
		const v = s[key];
		if (v && typeof v === 'object' && 'size' in (v as Record<string, unknown>)) {
			const sv = v as { size: number; unit: string };
			(css as Record<string, unknown>)[cssProp] = `${sv.size}${sv.unit}`;
		} else if (typeof v === 'string' && v) {
			(css as Record<string, unknown>)[cssProp] = v;
		}
	}

	// Z-index
	if (typeof s.zIndex === 'number') css.zIndex = s.zIndex;

	return css;
}

export function PreviewCanvas() {
	const elements = useEditorStore((s) => s.elements);
	const bp = useEditorStore((s) => s.activeBreakpoint);

	const widths: Record<string, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };

	if (elements.length === 0) {
		return <EmptyState />;
	}

	return (
		<div
			style={{ display: 'flex', justifyContent: 'center', padding: 20, minHeight: '100%', overflow: 'auto' }}
			onClick={() => useEditorStore.getState().selectElement(null)}
		>
			<div style={{
				width: widths[bp] ?? '100%', maxWidth: '100%', minHeight: 400,
				background: '#fff', borderRadius: 10,
				boxShadow: '0 0 0 1px rgba(0,0,0,.05), 0 4px 24px rgba(0,0,0,.06)',
				transition: 'width .3s ease',
				overflow: 'hidden',
			}}>
				<div style={{ padding: 0 }}>
					<DropZone parentId={null} index={0} />
					{elements.map((el, i) => (
						<div key={el.id}>
							<ElementBlock node={el} />
							<DropZone parentId={null} index={i + 1} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	const addElement = useEditorStore((s) => s.addElement);
	const addContainer = useEditorStore((s) => s.addContainer);
	const [dragOver, setDragOver] = useState(false);
	const executeDrop = useEditorStore((s) => s.executeDrop);
	const setDropTarget = useEditorStore((s) => s.setDropTarget);
	const clearDropTarget = useEditorStore((s) => s.clearDropTarget);

	return (
		<div
			style={{
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				height: '100%', padding: 40,
			}}
			onDragOver={(e) => { e.preventDefault(); setDragOver(true); setDropTarget(null, 0); }}
			onDragLeave={() => { setDragOver(false); clearDropTarget(); }}
			onDrop={(e) => { e.preventDefault(); setDragOver(false); executeDrop(); }}
		>
			<div style={{
				textAlign: 'center', padding: '60px 40px', borderRadius: 12,
				border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--cm-border)'}`,
				background: dragOver ? 'rgba(245,158,11,.04)' : 'transparent',
				transition: 'all .2s', maxWidth: 400, width: '100%',
			}}>
				<div style={{ fontSize: 40, marginBottom: 16 }}>+</div>
				<p style={{ fontSize: 16, fontWeight: 600, color: 'var(--cm-text)', marginBottom: 8 }}>
					Drag a widget here
				</p>
				<p style={{ fontSize: 13, color: 'var(--cm-text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
					Or click a widget in the panel to add it
				</p>
				<div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
					<SmallBtn onClick={() => addContainer(null)}>+ Container</SmallBtn>
					<SmallBtn onClick={() => addElement('heading', null)}>+ Heading</SmallBtn>
					<SmallBtn onClick={() => addElement('paragraph', null)}>+ Text</SmallBtn>
				</div>
			</div>
		</div>
	);
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
	const [h, setH] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setH(true)}
			onMouseLeave={() => setH(false)}
			style={{
				padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
				border: '1px solid var(--cm-border)', background: h ? 'var(--cm-surface-elevated)' : 'var(--cm-surface)',
				color: h ? 'var(--color-accent)' : 'var(--cm-text-muted)', cursor: 'pointer',
				transition: 'all .12s',
			}}
		>
			{children}
		</button>
	);
}

function DropZone({ parentId, index }: { parentId: string | null; index: number }) {
	const [over, setOver] = useState(false);
	const setDropTarget = useEditorStore((s) => s.setDropTarget);
	const executeDrop = useEditorStore((s) => s.executeDrop);

	return (
		<div
			onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); setDropTarget(parentId, index); }}
			onDragLeave={(e) => { e.stopPropagation(); setOver(false); }}
			onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); executeDrop(); }}
			style={{
				height: over ? 4 : 8,
				margin: over ? '4px 8px' : '0 8px',
				borderRadius: 3,
				background: over ? 'var(--color-accent, #f59e0b)' : 'transparent',
				transition: 'all .15s ease',
			}}
		/>
	);
}

function ContainerEmptyState({ parentId }: { parentId: string }) {
	const [over, setOver] = useState(false);
	const setDropTarget = useEditorStore((s) => s.setDropTarget);
	const executeDrop = useEditorStore((s) => s.executeDrop);
	const addElement = useEditorStore((s) => s.addElement);

	return (
		<div
			onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); setDropTarget(parentId, 0); }}
			onDragLeave={(e) => { e.stopPropagation(); setOver(false); }}
			onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); executeDrop(); }}
			onClick={(e) => { e.stopPropagation(); addElement('paragraph', parentId); }}
			style={{
				padding: '32px 16px',
				textAlign: 'center',
				border: `2px dashed ${over ? 'var(--color-accent, #f59e0b)' : '#e5e7eb'}`,
				borderRadius: 8,
				background: over ? 'rgba(245,158,11,.04)' : 'transparent',
				color: '#adb5bd',
				fontSize: 12,
				cursor: 'pointer',
				transition: 'all .15s',
				width: '100%',
			}}
		>
			{over ? 'Drop here' : '+ Add widget or drag here'}
		</div>
	);
}

function ElementBlock({ node }: { node: ElementNode }) {
	const selectedId = useEditorStore((s) => s.selectedId);
	const hoveredId = useEditorStore((s) => s.hoveredId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const hoverElement = useEditorStore((s) => s.hoverElement);
	const removeElement = useEditorStore((s) => s.removeElement);
	const duplicateElement = useEditorStore((s) => s.duplicateElement);
	const startDrag = useEditorStore((s) => s.startDrag);
	const clearDropTarget = useEditorStore((s) => s.clearDropTarget);

	const isSelected = selectedId === node.id;
	const isHovered = hoveredId === node.id && !isSelected;

	const outlineColor = isSelected ? 'var(--color-accent)' : isHovered ? 'rgba(245,158,11,.4)' : 'transparent';

	function onDragStartExisting(e: DragEvent<HTMLDivElement>) {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = 'move';
		startDrag(node.widgetType ?? node.elType, node.id);
	}

	// Container
	if (node.elType === 'container') {
		const dir = String(node.settings.direction ?? 'column');
		const justify = String(node.settings.justifyContent ?? 'flex-start');
		const align = String(node.settings.alignItems ?? 'stretch');
		const userStyles = extractStyles(node.settings);

		return (
			<div
				onClick={(e) => { e.stopPropagation(); selectElement(node.id); }}
				onMouseEnter={(e) => { e.stopPropagation(); hoverElement(node.id); }}
				onMouseLeave={(e) => { e.stopPropagation(); hoverElement(null); }}
				style={{
					position: 'relative',
					display: 'flex',
					flexDirection: dir as CSSProperties['flexDirection'],
					justifyContent: justify,
					alignItems: align,
					padding: '16px',
					minHeight: 48,
					outline: `2px solid ${outlineColor}`,
					outlineOffset: 2,
					borderRadius: 4,
					transition: 'outline .12s',
					...userStyles,
				}}
			>
				{isSelected && <ElementToolbar id={node.id} label="Container" onRemove={removeElement} onDuplicate={duplicateElement} onDragStart={onDragStartExisting} />}

				{node.elements.length === 0 ? (
					<ContainerEmptyState parentId={node.id} />
				) : (
					<>
						<DropZone parentId={node.id} index={0} />
						{node.elements.map((child, i) => (
							<div key={child.id}>
								<ElementBlock node={child} />
								<DropZone parentId={node.id} index={i + 1} />
							</div>
						))}
					</>
				)}
			</div>
		);
	}

	// Widget
	return (
		<div
			draggable
			onDragStart={onDragStartExisting}
			onDragEnd={() => clearDropTarget()}
			onClick={(e) => { e.stopPropagation(); selectElement(node.id); }}
			onMouseEnter={(e) => { e.stopPropagation(); hoverElement(node.id); }}
			onMouseLeave={(e) => { e.stopPropagation(); hoverElement(null); }}
			style={{
				position: 'relative',
				outline: `2px solid ${outlineColor}`,
				outlineOffset: 2,
				borderRadius: 4,
				cursor: 'pointer',
				transition: 'outline .12s',
				...extractStyles(node.settings),
			}}
		>
			{isSelected && <ElementToolbar id={node.id} label={node.widgetType ?? 'widget'} onRemove={removeElement} onDuplicate={duplicateElement} onDragStart={onDragStartExisting} />}
			<WidgetPreview node={node} />
		</div>
	);
}

function ElementToolbar({ id, label, onRemove, onDuplicate, onDragStart }: {
	id: string;
	label: string;
	onRemove: (id: string) => void;
	onDuplicate: (id: string) => void;
	onDragStart: (e: DragEvent<HTMLDivElement>) => void;
}) {
	return (
		<div
			style={{
				position: 'absolute', top: -28, left: -2,
				display: 'flex', alignItems: 'center', gap: 2,
				background: 'var(--color-accent)', borderRadius: '6px 6px 0 0',
				padding: '3px 4px', zIndex: 10,
			}}
		>
			<div
				draggable
				onDragStart={onDragStart}
				style={{ cursor: 'grab', display: 'flex', padding: '0 2px', color: 'rgba(255,255,255,.7)' }}
			>
				<GripVertical size={12} />
			</div>
			<span style={{ fontSize: 10, fontWeight: 600, color: '#fff', padding: '0 4px', textTransform: 'capitalize' }}>
				{label}
			</span>
			<MiniBtn onClick={() => onDuplicate(id)} title="Duplicate"><Copy size={10} /></MiniBtn>
			<MiniBtn onClick={() => onRemove(id)} title="Delete" danger><Trash2 size={10} /></MiniBtn>
		</div>
	);
}

function MiniBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
	return (
		<button
			onClick={(e) => { e.stopPropagation(); onClick(); }}
			title={title}
			style={{
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				width: 18, height: 18, borderRadius: 3, border: 'none',
				background: 'rgba(255,255,255,.15)', color: danger ? '#fca5a5' : 'rgba(255,255,255,.8)',
				cursor: 'pointer', transition: 'all .1s',
			}}
		>
			{children}
		</button>
	);
}

function WidgetPreview({ node }: { node: ElementNode }) {
	const s = node.settings;
	switch (node.widgetType) {
		case 'heading': {
			const Tag = `h${s.level ?? 2}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
			return <Tag style={{ margin: 0, color: 'inherit', textAlign: (s.textAlign as string) || undefined }}>{String(s.content || 'Add Your Heading Text Here')}</Tag>;
		}
		case 'paragraph':
			return <p style={{ margin: 0, lineHeight: 1.6, textAlign: (s.textAlign as string) || undefined }}>{String(s.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.')}</p>;
		case 'image': {
			const url = String(s.url ?? '');
			if (!url) return <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8f9fa', borderRadius: 8, color: '#adb5bd', fontSize: 13, border: '1px dashed #dee2e6' }}>Click to set image URL</div>;
			return <img src={url} alt={String(s.alt ?? '')} style={{ maxWidth: '100%', display: 'block', borderRadius: 4 }} />;
		}
		case 'button':
			return (
				<div><span style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--color-accent, #f59e0b)', color: '#fff', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>
					{String(s.text || 'Click Here')}
				</span></div>
			);
		case 'separator':
			return <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '4px 0' }} />;
		case 'spacer':
			return <div style={{ height: String(s.height ?? '40px'), background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,.02) 5px, rgba(0,0,0,.02) 10px)' }} />;
		case 'code':
			return <pre style={{ padding: 16, background: '#1e1e2e', color: '#cdd6f4', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', overflow: 'auto', margin: 0 }}><code>{String(s.content || '// Your code here')}</code></pre>;
		case 'quote':
			return (
				<blockquote style={{ borderLeft: '4px solid var(--color-accent, #f59e0b)', paddingLeft: 16, margin: 0, fontStyle: 'italic', color: '#555' }}>
					<p style={{ margin: 0 }}>{String(s.content || '"Add your quote text here"')}</p>
					{s.citation && <cite style={{ display: 'block', fontSize: 13, marginTop: 8, fontStyle: 'normal', color: '#888' }}>— {String(s.citation)}</cite>}
				</blockquote>
			);
		case 'list':
			return <ul style={{ margin: 0, paddingLeft: 20 }}>{(Array.isArray(s.items) ? s.items : ['Item 1', 'Item 2', 'Item 3']).map((item: unknown, i: number) => <li key={i} style={{ marginBottom: 4 }}>{String(item)}</li>)}</ul>;
		case 'html':
			return <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#6c757d' }}>{String(s.content || '<div>Custom HTML</div>')}</div>;
		default:
			return <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 4, color: '#888', fontSize: 13 }}>Widget: {node.widgetType}</div>;
	}
}
