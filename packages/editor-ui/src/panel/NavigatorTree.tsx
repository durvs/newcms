import {
	ChevronRight,
	ChevronDown,
	Trash2,
	Box,
	Heading,
	AlignLeft,
	Image,
	Square,
	Minus,
	Code2,
	Quote,
	ChevronsUpDown,
	List,
} from 'lucide-react';
import { useState } from 'react';
import type { ElementNode } from '@newcms/editor';
import { useEditorStore } from '../store/editor-store';

const widgetIcons: Record<string, typeof Heading> = {
	heading: Heading,
	paragraph: AlignLeft,
	image: Image,
	button: Square,
	separator: Minus,
	code: Code2,
	quote: Quote,
	spacer: ChevronsUpDown,
	list: List,
	html: Code2,
};

export function NavigatorTree() {
	const elements = useEditorStore((s) => s.elements);

	if (elements.length === 0) {
		return (
			<div style={{ padding: '60px 20px', textAlign: 'center' }}>
				<div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🗂</div>
				<p style={{ fontSize: 13, color: 'var(--cm-text-muted)', fontWeight: 500 }}>
					No elements yet
				</p>
				<p style={{ fontSize: 11, color: 'var(--cm-text-faint)', marginTop: 4 }}>
					Add widgets from the Widgets tab
				</p>
			</div>
		);
	}

	return (
		<div style={{ padding: 8 }}>
			<div
				style={{
					fontSize: 10,
					fontWeight: 700,
					textTransform: 'uppercase',
					letterSpacing: '0.08em',
					color: 'var(--cm-text-faint)',
					padding: '8px 8px 6px',
					marginBottom: 2,
				}}
			>
				Element Tree
			</div>
			{elements.map((el) => (
				<TreeNode key={el.id} node={el} depth={0} />
			))}
		</div>
	);
}

function TreeNode({ node, depth }: { node: ElementNode; depth: number }) {
	const [expanded, setExpanded] = useState(true);
	const [hovered, setHovered] = useState(false);
	const selectedId = useEditorStore((s) => s.selectedId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const removeElement = useEditorStore((s) => s.removeElement);
	const isSelected = selectedId === node.id;
	const hasChildren = node.elements.length > 0;

	const label = node.widgetType ?? node.elType;
	const Icon = node.elType === 'container' ? Box : (widgetIcons[node.widgetType ?? ''] ?? Box);

	return (
		<div>
			<div
				onClick={(e) => {
					e.stopPropagation();
					selectElement(node.id);
				}}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 4,
					padding: '5px 8px',
					paddingLeft: depth * 16 + 8,
					borderRadius: 6,
					cursor: 'pointer',
					fontSize: 12,
					fontWeight: isSelected ? 600 : 400,
					color: isSelected ? 'var(--color-accent)' : 'var(--cm-text-muted)',
					background: isSelected
						? 'rgba(245,158,11,.08)'
						: hovered
							? 'var(--cm-surface-elevated)'
							: 'transparent',
					transition: 'all .1s',
					userSelect: 'none',
				}}
			>
				{hasChildren ? (
					<button
						onClick={(e) => {
							e.stopPropagation();
							setExpanded(!expanded);
						}}
						style={{
							display: 'flex',
							padding: 0,
							border: 'none',
							background: 'none',
							color: 'inherit',
							cursor: 'pointer',
							flexShrink: 0,
						}}
					>
						{expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
					</button>
				) : (
					<span style={{ width: 12, flexShrink: 0 }} />
				)}

				<Icon size={13} strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.7 }} />

				<span
					style={{
						flex: 1,
						textTransform: 'capitalize',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{label}
				</span>

				<span
					style={{
						fontSize: 9,
						fontFamily: 'monospace',
						color: 'var(--cm-text-faint)',
						opacity: 0.5,
						flexShrink: 0,
					}}
				>
					{node.id.slice(0, 4)}
				</span>

				{hovered && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							removeElement(node.id);
						}}
						style={{
							display: 'flex',
							padding: 2,
							border: 'none',
							background: 'none',
							color: '#ef4444',
							cursor: 'pointer',
							flexShrink: 0,
						}}
					>
						<Trash2 size={11} />
					</button>
				)}
			</div>

			{hasChildren && expanded && (
				<div
					style={{
						borderLeft: `1px solid var(--cm-border-subtle, var(--cm-border))`,
						marginLeft: depth * 16 + 14,
					}}
				>
					{node.elements.map((child) => (
						<TreeNode key={child.id} node={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
}
