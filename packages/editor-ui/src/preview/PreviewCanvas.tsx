import type { ElementNode } from '@newcms/editor';
import { useEditorStore } from '../store/editor-store';

/**
 * Inline preview renderer (Phase 2).
 * Renders the element tree directly as React components.
 * In Phase 3 this will move to an iframe for proper style isolation.
 */
export function PreviewCanvas() {
	const elements = useEditorStore((s) => s.elements);
	const selectedId = useEditorStore((s) => s.selectedId);
	const hoveredId = useEditorStore((s) => s.hoveredId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const hoverElement = useEditorStore((s) => s.hoverElement);
	const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);

	const previewWidths: Record<string, string> = {
		desktop: '100%',
		tablet: '768px',
		mobile: '375px',
	};

	if (elements.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<p className="text-lg font-medium text-[var(--cm-text-muted)]">Start building</p>
					<p className="mt-1 text-sm text-[var(--cm-text-faint)]">
						Add widgets from the panel or drag them here
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full items-start justify-center overflow-auto p-6">
			<div
				className="min-h-[400px] rounded-lg bg-white shadow-lg transition-all duration-300"
				style={{ width: previewWidths[activeBreakpoint] ?? '100%', maxWidth: '100%' }}
			>
				<div className="p-6">
					{elements.map((el) => (
						<ElementRenderer
							key={el.id}
							node={el}
							selectedId={selectedId}
							hoveredId={hoveredId}
							onSelect={selectElement}
							onHover={hoverElement}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function ElementRenderer({
	node,
	selectedId,
	hoveredId,
	onSelect,
	onHover,
}: {
	node: ElementNode;
	selectedId: string | null;
	hoveredId: string | null;
	onSelect: (id: string | null) => void;
	onHover: (id: string | null) => void;
}) {
	const isSelected = selectedId === node.id;
	const isHovered = hoveredId === node.id;

	const outlineStyle = isSelected
		? '2px solid var(--color-accent, #f59e0b)'
		: isHovered
			? '1px solid rgba(245,158,11,0.4)'
			: '1px solid transparent';

	// Container
	if (node.elType === 'container') {
		const direction = String(node.settings.direction ?? 'column');
		const gap = String(node.settings.gap ?? '16px');

		return (
			<div
				data-builder-id={node.id}
				data-el-type="container"
				onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
				onMouseEnter={() => onHover(node.id)}
				onMouseLeave={() => onHover(null)}
				style={{
					display: 'flex',
					flexDirection: direction as 'row' | 'column',
					gap,
					outline: outlineStyle,
					outlineOffset: '2px',
					borderRadius: '4px',
					padding: String(node.settings.padding ?? '16px'),
					backgroundColor: String(node.settings.backgroundColor ?? 'transparent'),
					color: String(node.settings.color ?? 'inherit'),
					margin: String(node.settings.margin ?? ''),
					minHeight: '40px',
					transition: 'outline 0.15s ease',
				}}
			>
				{node.elements.length === 0 && (
					<div style={{ padding: '20px', textAlign: 'center', color: '#aaa', fontSize: '13px', border: '1px dashed #ddd', borderRadius: '4px', width: '100%' }}>
						Empty container — add widgets here
					</div>
				)}
				{node.elements.map((child) => (
					<ElementRenderer
						key={child.id}
						node={child}
						selectedId={selectedId}
						hoveredId={hoveredId}
						onSelect={onSelect}
						onHover={onHover}
					/>
				))}
			</div>
		);
	}

	// Widget
	return (
		<div
			data-builder-id={node.id}
			data-el-type="widget"
			data-widget-type={node.widgetType}
			onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
			onMouseEnter={() => onHover(node.id)}
			onMouseLeave={() => onHover(null)}
			style={{
				outline: outlineStyle,
				outlineOffset: '2px',
				borderRadius: '4px',
				padding: String(node.settings.padding ?? ''),
				backgroundColor: String(node.settings.backgroundColor ?? ''),
				color: String(node.settings.color ?? 'inherit'),
				margin: String(node.settings.margin ?? ''),
				transition: 'outline 0.15s ease',
			}}
		>
			<WidgetRenderer node={node} />
		</div>
	);
}

function WidgetRenderer({ node }: { node: ElementNode }) {
	switch (node.widgetType) {
		case 'heading': {
			const Tag = `h${node.settings.level ?? 2}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
			return <Tag style={{ margin: 0 }}>{String(node.settings.content ?? 'Heading')}</Tag>;
		}
		case 'paragraph':
			return <p style={{ margin: 0 }}>{String(node.settings.content ?? 'Type your text here...')}</p>;
		case 'image': {
			const url = String(node.settings.url ?? '');
			if (!url) return <div style={{ padding: '30px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', color: '#999' }}>Image placeholder</div>;
			return <img src={url} alt={String(node.settings.alt ?? '')} style={{ maxWidth: '100%', borderRadius: '4px' }} />;
		}
		case 'button':
			return (
				<div>
					<a
						href={String(node.settings.url ?? '#')}
						style={{
							display: 'inline-block',
							padding: '10px 24px',
							backgroundColor: 'var(--color-accent, #f59e0b)',
							color: '#fff',
							borderRadius: '6px',
							textDecoration: 'none',
							fontSize: '14px',
							fontWeight: 600,
						}}
					>
						{String(node.settings.text ?? 'Button')}
					</a>
				</div>
			);
		case 'separator':
			return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />;
		case 'spacer':
			return <div style={{ height: String(node.settings.height ?? '40px') }} />;
		case 'code':
			return (
				<pre style={{ padding: '12px', background: '#1e1e2e', color: '#cdd6f4', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', overflow: 'auto', margin: 0 }}>
					<code>{String(node.settings.content ?? '// Code')}</code>
				</pre>
			);
		case 'quote':
			return (
				<blockquote style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '16px', margin: '0', fontStyle: 'italic', color: '#666' }}>
					<p>{String(node.settings.content ?? 'Quote text')}</p>
					{node.settings.citation && (
						<cite style={{ display: 'block', fontSize: '13px', marginTop: '4px' }}>
							— {String(node.settings.citation)}
						</cite>
					)}
				</blockquote>
			);
		case 'html':
			return <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>{String(node.settings.content ?? '<div>HTML</div>')}</div>;
		case 'list':
			return (
				<ul style={{ margin: 0, paddingLeft: '20px' }}>
					{(Array.isArray(node.settings.items) ? node.settings.items : ['Item 1', 'Item 2']).map((item: unknown, i: number) => (
						<li key={i}>{String(item)}</li>
					))}
				</ul>
			);
		default:
			return <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px', color: '#999', fontSize: '13px' }}>Unknown widget: {node.widgetType}</div>;
	}
}
