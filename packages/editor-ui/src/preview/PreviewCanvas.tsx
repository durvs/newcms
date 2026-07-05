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
	if (s.position && s.position !== 'static')
		css.position = String(s.position) as CSSProperties['position'];
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

function buildKitCSS(
	kit: {
		colors: { id: string; color: string }[];
		typography: Record<string, unknown>[];
		bodyFontFamily?: string;
	} | null,
): string {
	if (!kit) return '';
	const lines: string[] = [];
	for (const c of kit.colors) lines.push(`--e-global-color-${c.id}: ${c.color};`);
	for (const t of kit.typography) {
		const id = String((t as Record<string, unknown>).id ?? '');
		const ff = (t as Record<string, unknown>).fontFamily;
		if (ff) lines.push(`--e-global-typography-${id}-font-family: ${ff};`);
	}
	const rootVars = lines.length > 0 ? `:root{${lines.join('')}}` : '';
	const bodyFont =
		kit.bodyFontFamily ?? ((kit.typography[0] as Record<string, unknown>)?.fontFamily as string);
	const bodyRule = bodyFont ? `.preview-body{font-family:${bodyFont},system-ui,sans-serif}` : '';
	const fonts = new Set<string>();
	for (const t of kit.typography) {
		const ff = (t as Record<string, unknown>).fontFamily;
		if (ff && typeof ff === 'string') fonts.add(ff);
	}
	const fontImport =
		fonts.size > 0
			? `@import url('https://fonts.googleapis.com/css2?${[...fonts].map((f) => `family=${f.replace(/\s/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap');`
			: '';
	return [fontImport, rootVars, bodyRule].filter(Boolean).join('\n');
}

export function PreviewCanvas() {
	const elements = useEditorStore((s) => s.elements);
	const bp = useEditorStore((s) => s.activeBreakpoint);
	const designKit = useEditorStore((s) => s.designKit);
	const kitCSS = buildKitCSS(designKit);

	const widths: Record<string, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };
	const isDevice = bp !== 'desktop';

	if (elements.length === 0) {
		return <EmptyState />;
	}

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: isDevice ? 'flex-start' : undefined,
				padding: isDevice ? '24px 20px' : 0,
				minHeight: '100%',
			}}
			onClick={() => useEditorStore.getState().selectElement(null)}
		>
			<div
				style={{
					width: widths[bp] ?? '100%',
					maxWidth: '100%',
					minHeight: isDevice ? 600 : 400,
					background: '#fff',
					borderRadius: isDevice ? 16 : 0,
					boxShadow: isDevice
						? '0 0 0 8px #1e293b, 0 0 0 9px #334155, 0 20px 60px rgba(0,0,0,.15)'
						: 'none',
					transition: 'all .3s ease',
					overflow: 'hidden',
				}}
			>
				{kitCSS && <style>{kitCSS}</style>}
				<div className="preview-body" style={{ padding: 16 }}>
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
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				padding: 40,
			}}
			onDragOver={(e) => {
				e.preventDefault();
				setDragOver(true);
				setDropTarget(null, 0);
			}}
			onDragLeave={() => {
				setDragOver(false);
				clearDropTarget();
			}}
			onDrop={(e) => {
				e.preventDefault();
				setDragOver(false);
				executeDrop();
			}}
		>
			<div
				style={{
					textAlign: 'center',
					padding: '60px 40px',
					borderRadius: 12,
					border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--cm-border)'}`,
					background: dragOver ? 'rgba(245,158,11,.04)' : 'transparent',
					transition: 'all .2s',
					maxWidth: 400,
					width: '100%',
				}}
			>
				<div style={{ fontSize: 40, marginBottom: 16 }}>+</div>
				<p style={{ fontSize: 16, fontWeight: 600, color: 'var(--cm-text)', marginBottom: 8 }}>
					Drag a widget here
				</p>
				<p
					style={{ fontSize: 13, color: 'var(--cm-text-muted)', marginBottom: 20, lineHeight: 1.5 }}
				>
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
				padding: '6px 12px',
				borderRadius: 6,
				fontSize: 12,
				fontWeight: 500,
				border: '1px solid var(--cm-border)',
				background: h ? 'var(--cm-surface-elevated)' : 'var(--cm-surface)',
				color: h ? 'var(--color-accent)' : 'var(--cm-text-muted)',
				cursor: 'pointer',
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
			onDragOver={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(true);
				setDropTarget(parentId, index);
			}}
			onDragLeave={(e) => {
				e.stopPropagation();
				setOver(false);
			}}
			onDrop={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(false);
				executeDrop();
			}}
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
			onDragOver={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(true);
				setDropTarget(parentId, 0);
			}}
			onDragLeave={(e) => {
				e.stopPropagation();
				setOver(false);
			}}
			onDrop={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(false);
				executeDrop();
			}}
			onClick={(e) => {
				e.stopPropagation();
				addElement('paragraph', parentId);
			}}
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

	const outlineColor = isSelected
		? 'var(--color-accent)'
		: isHovered
			? 'rgba(245,158,11,.4)'
			: 'transparent';

	function onDragStartExisting(e: DragEvent<HTMLDivElement>) {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = 'move';
		startDrag(node.widgetType ?? node.elType, node.id);
	}

	// Container
	if (node.elType === 'container') {
		const displayMode = String(node.settings.display ?? 'flex');
		const dir = String(node.settings.direction ?? 'column');
		const justify = String(node.settings.justifyContent ?? 'flex-start');
		const align = String(node.settings.alignItems ?? 'stretch');
		const flexWrap = String(node.settings.flexWrap ?? 'nowrap');
		const gridCols = Number(node.settings.gridColumns ?? 2);
		const gridRows = Number(node.settings.gridRows ?? 0);
		const userStyles = extractStyles(node.settings);

		const layoutStyle: CSSProperties =
			displayMode === 'grid'
				? {
						display: 'grid',
						gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
						...(gridRows > 0 ? { gridTemplateRows: `repeat(${gridRows}, auto)` } : {}),
					}
				: {
						display: 'flex',
						flexDirection: dir as CSSProperties['flexDirection'],
						flexWrap: flexWrap as CSSProperties['flexWrap'],
						justifyContent: justify,
						alignItems: align,
					};

		return (
			<div
				onClick={(e) => {
					e.stopPropagation();
					selectElement(node.id);
				}}
				onMouseEnter={(e) => {
					e.stopPropagation();
					hoverElement(node.id);
				}}
				onMouseLeave={(e) => {
					e.stopPropagation();
					hoverElement(null);
				}}
				style={{
					position: 'relative',
					...layoutStyle,
					padding: '16px',
					minHeight: 48,
					outline: `2px solid ${outlineColor}`,
					outlineOffset: -2,
					borderRadius: 4,
					transition: 'outline .12s',
					...userStyles,
				}}
			>
				{isSelected && (
					<ElementToolbar
						id={node.id}
						label="Container"
						onRemove={removeElement}
						onDuplicate={duplicateElement}
						onDragStart={onDragStartExisting}
					/>
				)}

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
			onClick={(e) => {
				e.stopPropagation();
				selectElement(node.id);
			}}
			onMouseEnter={(e) => {
				e.stopPropagation();
				hoverElement(node.id);
			}}
			onMouseLeave={(e) => {
				e.stopPropagation();
				hoverElement(null);
			}}
			style={{
				position: 'relative',
				outline: `2px solid ${outlineColor}`,
				outlineOffset: -2,
				borderRadius: 4,
				cursor: 'pointer',
				transition: 'outline .12s',
				...extractStyles(node.settings),
			}}
		>
			{isSelected && (
				<ElementToolbar
					id={node.id}
					label={node.widgetType ?? 'widget'}
					onRemove={removeElement}
					onDuplicate={duplicateElement}
					onDragStart={onDragStartExisting}
				/>
			)}
			<WidgetPreview node={node} />
		</div>
	);
}

function ElementToolbar({
	id,
	label,
	onRemove,
	onDuplicate,
	onDragStart,
}: {
	id: string;
	label: string;
	onRemove: (id: string) => void;
	onDuplicate: (id: string) => void;
	onDragStart: (e: DragEvent<HTMLDivElement>) => void;
}) {
	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				right: 0,
				display: 'flex',
				alignItems: 'center',
				gap: 2,
				background: 'var(--color-accent)',
				borderRadius: '0 0 0 6px',
				padding: '3px 6px',
				zIndex: 10,
			}}
		>
			<div
				draggable
				onDragStart={onDragStart}
				style={{ cursor: 'grab', display: 'flex', padding: '0 2px', color: 'rgba(255,255,255,.7)' }}
			>
				<GripVertical size={12} />
			</div>
			<span
				style={{
					fontSize: 10,
					fontWeight: 600,
					color: '#fff',
					padding: '0 4px',
					textTransform: 'capitalize',
				}}
			>
				{label}
			</span>
			<MiniBtn onClick={() => onDuplicate(id)} title="Duplicate">
				<Copy size={10} />
			</MiniBtn>
			<MiniBtn onClick={() => onRemove(id)} title="Delete" danger>
				<Trash2 size={10} />
			</MiniBtn>
		</div>
	);
}

function MiniBtn({
	children,
	onClick,
	title,
	danger,
}: {
	children: React.ReactNode;
	onClick: () => void;
	title: string;
	danger?: boolean;
}) {
	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			title={title}
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 18,
				height: 18,
				borderRadius: 3,
				border: 'none',
				background: 'rgba(255,255,255,.15)',
				color: danger ? '#fca5a5' : 'rgba(255,255,255,.8)',
				cursor: 'pointer',
				transition: 'all .1s',
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
			const rawLevel = parseInt(String(s.level ?? s.header_size ?? '2').replace(/\D/g, ''), 10);
			const level = rawLevel >= 1 && rawLevel <= 6 ? rawLevel : 2;
			const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
			const headingSizes: Record<
				number,
				{ fontSize: string; fontWeight: number; lineHeight: number }
			> = {
				1: { fontSize: '2.5em', fontWeight: 700, lineHeight: 1.2 },
				2: { fontSize: '2em', fontWeight: 700, lineHeight: 1.25 },
				3: { fontSize: '1.5em', fontWeight: 600, lineHeight: 1.3 },
				4: { fontSize: '1.25em', fontWeight: 600, lineHeight: 1.35 },
				5: { fontSize: '1.1em', fontWeight: 600, lineHeight: 1.4 },
				6: { fontSize: '1em', fontWeight: 600, lineHeight: 1.45 },
			};
			const defaults = headingSizes[level] ?? headingSizes[2];
			// User overrides from Style tab take priority over tag defaults
			const userFontSize =
				s.fontSize &&
				typeof s.fontSize === 'object' &&
				'size' in (s.fontSize as Record<string, unknown>)
					? `${(s.fontSize as { size: number; unit: string }).size}${(s.fontSize as { size: number; unit: string }).unit}`
					: undefined;
			const userFontWeight = s.fontWeight ? String(s.fontWeight) : undefined;
			const userLineHeight =
				s.lineHeight &&
				typeof s.lineHeight === 'object' &&
				'size' in (s.lineHeight as Record<string, unknown>)
					? `${(s.lineHeight as { size: number; unit: string }).size}${(s.lineHeight as { size: number; unit: string }).unit}`
					: undefined;

			return (
				<Tag
					style={{
						margin: 0,
						color: 'inherit',
						fontSize: userFontSize ?? defaults.fontSize,
						fontWeight: userFontWeight ? Number(userFontWeight) : defaults.fontWeight,
						lineHeight: userLineHeight ?? defaults.lineHeight,
						textAlign: (s.textAlign as CSSProperties['textAlign']) || undefined,
					}}
				>
					{String(s.content || 'Add Your Heading Text Here')}
				</Tag>
			);
		}
		case 'paragraph': {
			const textContent = String(
				s.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			);
			const hasHtml = /<[a-z][\s\S]*>/i.test(textContent);
			// Content comes from CMS builder data (trusted, admin-authored)
			if (hasHtml) {
				return (
					<div
						style={{
							margin: 0,
							lineHeight: 1.6,
							textAlign: (s.textAlign as CSSProperties['textAlign']) || undefined,
						}}
						dangerouslySetInnerHTML={{ __html: textContent }}
					/>
				); // nosemgrep: react-dangerouslysetinnerhtml
			}
			return (
				<p
					style={{
						margin: 0,
						lineHeight: 1.6,
						textAlign: (s.textAlign as CSSProperties['textAlign']) || undefined,
					}}
				>
					{textContent}
				</p>
			);
		}
		case 'image': {
			const url = String(s.url ?? '');
			if (!url)
				return (
					<div
						style={{
							padding: '40px 20px',
							textAlign: 'center',
							background: '#f8f9fa',
							borderRadius: 8,
							color: '#adb5bd',
							fontSize: 13,
							border: '1px dashed #dee2e6',
						}}
					>
						Click to set image URL
					</div>
				);
			return (
				<img
					src={url}
					alt={String(s.alt ?? '')}
					style={{ maxWidth: '100%', display: 'block', borderRadius: 4 }}
				/>
			);
		}
		case 'button':
			return (
				<div>
					<span
						style={{
							display: 'inline-block',
							padding: '12px 28px',
							background: 'var(--color-accent, #f59e0b)',
							color: '#fff',
							borderRadius: 6,
							fontSize: 14,
							fontWeight: 600,
						}}
					>
						{String(s.text || 'Click Here')}
					</span>
				</div>
			);
		case 'separator':
			return <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '4px 0' }} />;
		case 'spacer':
			return (
				<div
					style={{
						height: String(s.height ?? '40px'),
						background:
							'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,.02) 5px, rgba(0,0,0,.02) 10px)',
					}}
				/>
			);
		case 'code':
			return (
				<pre
					style={{
						padding: 16,
						background: '#1e1e2e',
						color: '#cdd6f4',
						borderRadius: 8,
						fontSize: 13,
						fontFamily: 'monospace',
						overflow: 'auto',
						margin: 0,
					}}
				>
					<code>{String(s.content || '// Your code here')}</code>
				</pre>
			);
		case 'quote':
			return (
				<blockquote
					style={{
						borderLeft: '4px solid var(--color-accent, #f59e0b)',
						paddingLeft: 16,
						margin: 0,
						fontStyle: 'italic',
						color: '#555',
					}}
				>
					<p style={{ margin: 0 }}>{String(s.content || '"Add your quote text here"')}</p>
					{s.citation ? (
						<cite
							style={{
								display: 'block',
								fontSize: 13,
								marginTop: 8,
								fontStyle: 'normal',
								color: '#888',
							}}
						>
							— {String(s.citation)}
						</cite>
					) : null}
				</blockquote>
			);
		case 'list':
			return (
				<ul style={{ margin: 0, paddingLeft: 20 }}>
					{(Array.isArray(s.items) ? s.items : ['Item 1', 'Item 2', 'Item 3']).map(
						(item: unknown, i: number) => (
							<li key={i} style={{ marginBottom: 4 }}>
								{String(item)}
							</li>
						),
					)}
				</ul>
			);
		case 'html':
		case 'shortcode':
			return (
				<div
					style={{
						padding: 12,
						background: '#f8f9fa',
						borderRadius: 4,
						fontFamily: 'monospace',
						fontSize: 12,
						color: '#6c757d',
					}}
				>
					{String(
						s.content || node.widgetType === 'shortcode' ? '[shortcode]' : '<div>Custom HTML</div>',
					)}
				</div>
			);
		case 'video':
			return (
				<div
					style={{
						background: '#000',
						borderRadius: 8,
						padding: '40px 20px',
						textAlign: 'center',
						color: '#fff',
						fontSize: 13,
					}}
				>
					<div style={{ fontSize: 32, marginBottom: 8 }}>▶</div>Video
					{s.url ? `: ${String(s.url).slice(0, 40)}...` : ' Player'}
				</div>
			);
		case 'gallery':
			return (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: 4,
						borderRadius: 4,
						overflow: 'hidden',
					}}
				>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div
							key={i}
							style={{
								background: '#e9ecef',
								aspectRatio: '1',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#adb5bd',
								fontSize: 11,
							}}
						>
							📷
						</div>
					))}
				</div>
			);
		case 'carousel':
		case 'testimonial':
		case 'slides':
			return (
				<div
					style={{
						background: '#f8f9fa',
						borderRadius: 8,
						padding: 24,
						textAlign: 'center',
						border: '1px dashed #dee2e6',
					}}
				>
					<div style={{ fontSize: 24, marginBottom: 8 }}>⟵ ⟶</div>
					<span style={{ color: '#868e96', fontSize: 13 }}>
						{node.widgetType === 'testimonial'
							? 'Testimonial Carousel'
							: node.widgetType === 'slides'
								? 'Custom Slides'
								: 'Media Carousel'}
					</span>
				</div>
			);
		case 'tabs':
			return (
				<div>
					<div style={{ display: 'flex', borderBottom: '2px solid #e9ecef', gap: 0 }}>
						{['Tab 1', 'Tab 2', 'Tab 3'].map((t, i) => (
							<div
								key={t}
								style={{
									padding: '8px 16px',
									fontSize: 13,
									fontWeight: 500,
									color: i === 0 ? 'var(--color-accent)' : '#868e96',
									borderBottom: i === 0 ? '2px solid var(--color-accent)' : 'none',
									marginBottom: -2,
									cursor: 'pointer',
								}}
							>
								{t}
							</div>
						))}
					</div>
					<div style={{ padding: 16, color: '#495057', fontSize: 13 }}>Tab content goes here.</div>
				</div>
			);
		case 'accordion':
		case 'toggle': {
			if (node.elements && node.elements.length > 0) {
				return (
					<div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
						{node.elements.map((child, i) => {
							const title = String(
								child.settings?.title ?? child.settings?.tab_title ?? `Item ${i + 1}`,
							);
							return (
								<div
									key={child.id}
									style={{
										borderBottom: i < node.elements.length - 1 ? '1px solid #e9ecef' : 'none',
									}}
								>
									<div
										style={{
											padding: '14px 16px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											fontSize: 15,
											fontWeight: 600,
											color: '#1e293b',
											cursor: 'pointer',
											background: i === 0 ? '#f8fafc' : 'transparent',
										}}
									>
										{title}
										<span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 300 }}>
											{i === 0 ? '−' : '+'}
										</span>
									</div>
									{i === 0 && (
										<div style={{ padding: '0 16px 16px' }}>
											{child.elements && child.elements.length > 0 ? (
												child.elements.map((inner) => (
													<div key={inner.id} style={{ marginBottom: 8 }}>
														{inner.elType === 'container' ? (
															inner.elements.map((deep) => (
																<div key={deep.id} style={{ marginBottom: 4 }}>
																	<WidgetPreview node={deep} />
																</div>
															))
														) : (
															<WidgetPreview node={inner} />
														)}
													</div>
												))
											) : (
												<p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
													Accordion content
												</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				);
			}
			return (
				<div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
					{['Accordion Item 1', 'Accordion Item 2', 'Accordion Item 3'].map((t, i) => (
						<div key={t} style={{ borderBottom: i < 2 ? '1px solid #e9ecef' : 'none' }}>
							<div
								style={{
									padding: '14px 16px',
									display: 'flex',
									justifyContent: 'space-between',
									fontSize: 15,
									fontWeight: 600,
									color: '#1e293b',
									cursor: 'pointer',
									background: i === 0 ? '#f8fafc' : 'transparent',
								}}
							>
								{t}
								<span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 300 }}>
									{i === 0 ? '−' : '+'}
								</span>
							</div>
							{i === 0 && (
								<div
									style={{
										padding: '0 16px 16px',
										fontSize: 14,
										color: '#64748b',
										lineHeight: 1.7,
									}}
								>
									Content for this item goes here.
								</div>
							)}
						</div>
					))}
				</div>
			);
		}
		case 'icon':
			return <div style={{ textAlign: 'center', fontSize: 40 }}>⭐</div>;
		case 'icon-box':
			return (
				<div style={{ textAlign: 'center', padding: 16 }}>
					<div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
					<div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Icon Box Title</div>
					<div style={{ fontSize: 13, color: '#6c757d' }}>Description text goes here.</div>
				</div>
			);
		case 'counter':
			return (
				<div style={{ textAlign: 'center', padding: 16 }}>
					<div style={{ fontSize: 48, fontWeight: 700, color: 'var(--color-accent)' }}>
						{String(s.endValue ?? '100')}
					</div>
					<div style={{ fontSize: 13, color: '#6c757d', marginTop: 4 }}>
						{String(s.title ?? 'Counter')}
					</div>
				</div>
			);
		case 'progress-bar':
			return (
				<div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							marginBottom: 4,
							fontSize: 13,
						}}
					>
						<span>{String(s.title ?? 'Progress')}</span>
						<span>{String(s.percent ?? '70')}%</span>
					</div>
					<div style={{ height: 8, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
						<div
							style={{
								width: `${Number(s.percent ?? 70)}%`,
								height: '100%',
								background: 'var(--color-accent)',
								borderRadius: 4,
								transition: 'width .3s',
							}}
						/>
					</div>
				</div>
			);
		case 'alert':
			return (
				<div
					style={{
						padding: '12px 16px',
						borderRadius: 6,
						background: '#fff3cd',
						color: '#856404',
						fontSize: 13,
						border: '1px solid #ffc107',
						display: 'flex',
						justifyContent: 'space-between',
					}}
				>
					<span>{String(s.content ?? 'This is an alert message.')}</span>
					<span style={{ cursor: 'pointer' }}>×</span>
				</div>
			);
		case 'pricing-table':
			return (
				<div
					style={{
						border: '1px solid #e9ecef',
						borderRadius: 8,
						textAlign: 'center',
						overflow: 'hidden',
					}}
				>
					<div style={{ padding: 16, background: '#f8f9fa' }}>
						<div style={{ fontSize: 18, fontWeight: 700 }}>Pro Plan</div>
					</div>
					<div style={{ padding: '16px', fontSize: 32, fontWeight: 700 }}>
						$29<span style={{ fontSize: 14, fontWeight: 400, color: '#868e96' }}>/mo</span>
					</div>
					<div style={{ padding: '0 16px 16px', fontSize: 13, color: '#6c757d' }}>
						• Feature 1<br />• Feature 2<br />• Feature 3
					</div>
					<div style={{ padding: 16 }}>
						<span
							style={{
								display: 'inline-block',
								padding: '10px 24px',
								background: 'var(--color-accent)',
								color: '#fff',
								borderRadius: 6,
								fontSize: 14,
								fontWeight: 600,
							}}
						>
							Get Started
						</span>
					</div>
				</div>
			);
		case 'cta':
			return (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: 24,
						background: '#f8f9fa',
						borderRadius: 8,
						border: '1px solid #e9ecef',
					}}
				>
					<div>
						<div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Call to Action</div>
						<div style={{ fontSize: 13, color: '#6c757d' }}>Click the button to take action.</div>
					</div>
					<span
						style={{
							padding: '10px 24px',
							background: 'var(--color-accent)',
							color: '#fff',
							borderRadius: 6,
							fontSize: 14,
							fontWeight: 600,
							whiteSpace: 'nowrap',
						}}
					>
						Click Here
					</span>
				</div>
			);
		case 'countdown':
			return (
				<div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: 16 }}>
					{['Days', 'Hours', 'Min', 'Sec'].map((u, i) => (
						<div key={u} style={{ textAlign: 'center' }}>
							<div style={{ fontSize: 32, fontWeight: 700 }}>{[12, 8, 45, 30][i]}</div>
							<div style={{ fontSize: 11, color: '#868e96', marginTop: 2 }}>{u}</div>
						</div>
					))}
				</div>
			);
		case 'flip-box':
			return (
				<div
					style={{
						padding: 24,
						textAlign: 'center',
						background: '#f8f9fa',
						borderRadius: 8,
						border: '1px solid #e9ecef',
					}}
				>
					<div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
					<div style={{ fontSize: 16, fontWeight: 600 }}>Flip Box</div>
					<div style={{ fontSize: 12, color: '#868e96', marginTop: 4 }}>Hover to see the back</div>
				</div>
			);
		case 'nav-menu':
		case 'mega-menu':
			return (
				<div
					style={{ display: 'flex', gap: 20, padding: '10px 0', borderBottom: '1px solid #e9ecef' }}
				>
					{['Home', 'About', 'Services', 'Contact'].map((t) => (
						<span key={t} style={{ fontSize: 14, color: '#495057', cursor: 'pointer' }}>
							{t}
						</span>
					))}
				</div>
			);
		case 'breadcrumb':
			return (
				<div style={{ fontSize: 13, color: '#868e96' }}>
					Home &rsaquo; Category &rsaquo; <span style={{ color: '#212529' }}>Current Page</span>
				</div>
			);
		case 'search':
			return (
				<div style={{ display: 'flex', gap: 8 }}>
					<input
						type="text"
						placeholder="Search..."
						readOnly
						style={{
							flex: 1,
							height: 36,
							borderRadius: 6,
							border: '1px solid #dee2e6',
							padding: '0 10px',
							fontSize: 13,
						}}
					/>
					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 36,
							height: 36,
							background: 'var(--color-accent)',
							color: '#fff',
							borderRadius: 6,
						}}
					>
						🔍
					</span>
				</div>
			);
		case 'form':
		case 'login-form':
			return (
				<div style={{ padding: 16, border: '1px solid #e9ecef', borderRadius: 8 }}>
					<div style={{ marginBottom: 8 }}>
						<div style={{ fontSize: 11, fontWeight: 500, color: '#6c757d', marginBottom: 4 }}>
							Name
						</div>
						<div
							style={{
								height: 32,
								borderRadius: 6,
								border: '1px solid #dee2e6',
								background: '#fff',
							}}
						/>
					</div>
					<div style={{ marginBottom: 8 }}>
						<div style={{ fontSize: 11, fontWeight: 500, color: '#6c757d', marginBottom: 4 }}>
							Email
						</div>
						<div
							style={{
								height: 32,
								borderRadius: 6,
								border: '1px solid #dee2e6',
								background: '#fff',
							}}
						/>
					</div>
					<div
						style={{
							height: 36,
							borderRadius: 6,
							background: 'var(--color-accent)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#fff',
							fontSize: 14,
							fontWeight: 600,
						}}
					>
						Submit
					</div>
				</div>
			);
		case 'share-buttons':
		case 'social-icons':
			return (
				<div style={{ display: 'flex', gap: 8 }}>
					{['📘', '🐦', '📸', '💼', '📌'].map((e, i) => (
						<div
							key={i}
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: '#e9ecef',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 16,
							}}
						>
							{e}
						</div>
					))}
				</div>
			);
		case 'toc':
			return (
				<div style={{ padding: 16, border: '1px solid #e9ecef', borderRadius: 8 }}>
					<div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Table of Contents</div>
					{['Section 1', '  Subsection 1.1', 'Section 2', 'Section 3'].map((t, i) => (
						<div
							key={i}
							style={{
								fontSize: 13,
								padding: '4px 0',
								paddingLeft: t.startsWith('  ') ? 16 : 0,
								color: '#4263eb',
							}}
						>
							{t.trim()}
						</div>
					))}
				</div>
			);
		case 'lottie':
			return (
				<div
					style={{
						padding: 24,
						textAlign: 'center',
						background: '#f8f9fa',
						borderRadius: 8,
						border: '1px dashed #dee2e6',
					}}
				>
					<div style={{ fontSize: 40, marginBottom: 8 }}>🎬</div>
					<span style={{ color: '#868e96', fontSize: 13 }}>Lottie Animation</span>
				</div>
			);
		case 'hotspot':
			return (
				<div
					style={{
						padding: 24,
						textAlign: 'center',
						background: '#f8f9fa',
						borderRadius: 8,
						border: '1px dashed #dee2e6',
						position: 'relative',
					}}
				>
					<div style={{ fontSize: 13, color: '#868e96' }}>Image with Hotspots</div>
					<div
						style={{
							position: 'absolute',
							top: 16,
							right: 24,
							width: 16,
							height: 16,
							borderRadius: '50%',
							background: 'var(--color-accent)',
							animation: 'pulse 1.5s infinite',
						}}
					/>
				</div>
			);
		case 'map':
			return (
				<div
					style={{
						height: 200,
						background: '#e9ecef',
						borderRadius: 8,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#adb5bd',
						fontSize: 13,
					}}
				>
					📍 Map
				</div>
			);
		case 'audio':
			return (
				<div
					style={{
						padding: 12,
						background: '#f8f9fa',
						borderRadius: 8,
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<span style={{ fontSize: 20 }}>🔊</span>
					<div style={{ flex: 1, height: 4, background: '#dee2e6', borderRadius: 2 }}>
						<div
							style={{
								width: '35%',
								height: '100%',
								background: 'var(--color-accent)',
								borderRadius: 2,
							}}
						/>
					</div>
					<span style={{ fontSize: 11, color: '#868e96' }}>1:23</span>
				</div>
			);
		case 'anchor':
			return (
				<div
					style={{
						padding: 8,
						textAlign: 'center',
						fontSize: 11,
						color: '#adb5bd',
						borderTop: '1px dashed #dee2e6',
						borderBottom: '1px dashed #dee2e6',
					}}
				>
					⚓ Anchor: #{String(s.anchorId ?? 'section')}
				</div>
			);
		case 'product-grid':
		case 'cart':
		case 'checkout':
			return (
				<div
					style={{
						padding: 24,
						textAlign: 'center',
						background: '#f8f9fa',
						borderRadius: 8,
						border: '1px dashed #dee2e6',
					}}
				>
					<div style={{ fontSize: 24, marginBottom: 8 }}>🛒</div>
					<span style={{ color: '#868e96', fontSize: 13 }}>
						{node.widgetType === 'cart'
							? 'Shopping Cart'
							: node.widgetType === 'checkout'
								? 'Checkout Form'
								: 'Product Grid'}
					</span>
				</div>
			);
		case 'rating':
			return <div style={{ fontSize: 24, letterSpacing: 4 }}>★★★★☆</div>;
		case 'heading-animated':
			return (
				<div style={{ fontSize: '1.5em', fontWeight: 700 }}>
					{String(s.beforeText ?? 'This is ')}{' '}
					<span
						style={{ color: 'var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }}
					>
						{String(s.animatedText ?? 'Amazing')}
					</span>{' '}
					{String(s.afterText ?? '')}
				</div>
			);
		case 'icon-list':
			return (
				<div>
					{['Feature one included', 'Feature two included', 'Feature three included'].map(
						(t, i) => (
							<div
								key={i}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '4px 0',
									fontSize: 13,
								}}
							>
								<span style={{ color: 'var(--color-accent)' }}>✓</span>
								{t}
							</div>
						),
					)}
				</div>
			);
		case 'price-list':
			return (
				<div>
					{[
						['Coffee', '$4'],
						['Sandwich', '$8'],
						['Dessert', '$6'],
					].map(([n, p], i) => (
						<div
							key={i}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								padding: '8px 0',
								borderBottom: '1px dotted #dee2e6',
								fontSize: 13,
							}}
						>
							<span>{n}</span>
							<span style={{ fontWeight: 600 }}>{p}</span>
						</div>
					))}
				</div>
			);
		case 'progress-tracker':
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
					{['Step 1', 'Step 2', 'Step 3'].map((t, i) => (
						<div key={i} style={{ flex: 1, textAlign: 'center' }}>
							<div
								style={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									background: i === 0 ? 'var(--color-accent)' : '#e9ecef',
									color: i === 0 ? '#fff' : '#868e96',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '0 auto',
									fontSize: 12,
									fontWeight: 600,
								}}
							>
								{i + 1}
							</div>
							<div style={{ fontSize: 11, marginTop: 4, color: i === 0 ? '#212529' : '#868e96' }}>
								{t}
							</div>
						</div>
					))}
				</div>
			);
		case 'link-in-bio':
			return (
				<div style={{ maxWidth: 280, margin: '0 auto', textAlign: 'center' }}>
					<div style={{ fontSize: 24, marginBottom: 8 }}>👤</div>
					{['My Website', 'Latest Post', 'Shop'].map((t, i) => (
						<div
							key={i}
							style={{
								padding: '10px',
								marginBottom: 6,
								borderRadius: 8,
								border: '1px solid #dee2e6',
								fontSize: 13,
								cursor: 'pointer',
							}}
						>
							{t}
						</div>
					))}
				</div>
			);
		default:
			return (
				<div
					style={{
						padding: 16,
						background: '#f8f9fa',
						borderRadius: 4,
						color: '#888',
						fontSize: 13,
						textAlign: 'center',
					}}
				>
					{node.widgetType ?? 'Unknown'}
				</div>
			);
	}
}
