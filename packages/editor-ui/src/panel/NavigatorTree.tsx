import { ChevronRight, ChevronDown, Box, Type, Image, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ElementNode } from '@newcms/editor';
import { useEditorStore } from '../store/editor-store';

function TreeItem({ node, depth }: { node: ElementNode; depth: number }) {
	const [expanded, setExpanded] = useState(true);
	const selectedId = useEditorStore((s) => s.selectedId);
	const selectElement = useEditorStore((s) => s.selectElement);
	const removeElement = useEditorStore((s) => s.removeElement);
	const isSelected = selectedId === node.id;
	const hasChildren = node.elements.length > 0;

	const label = node.widgetType ?? node.elType;

	return (
		<div>
			<div
				onClick={() => selectElement(node.id)}
				className={`group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] transition-colors ${
					isSelected
						? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
						: 'text-[var(--cm-text-muted)] hover:bg-[var(--cm-surface-elevated)] hover:text-[var(--cm-text)]'
				}`}
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				{hasChildren ? (
					<button
						onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
						className="shrink-0 p-0.5"
					>
						{expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
					</button>
				) : (
					<span className="w-4" />
				)}
				<span className="truncate font-medium">{label}</span>
				<span className="ml-auto text-[10px] font-mono text-[var(--cm-text-faint)] opacity-0 group-hover:opacity-100">
					{node.id.slice(0, 4)}
				</span>
				<button
					onClick={(e) => { e.stopPropagation(); removeElement(node.id); }}
					className="shrink-0 rounded p-0.5 text-[var(--cm-text-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
				>
					<Trash2 className="h-3 w-3" />
				</button>
			</div>
			{hasChildren && expanded && (
				<div>
					{node.elements.map((child) => (
						<TreeItem key={child.id} node={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
}

export function NavigatorTree() {
	const elements = useEditorStore((s) => s.elements);

	if (elements.length === 0) {
		return (
			<div className="flex flex-col items-center py-16 text-center">
				<p className="text-sm text-[var(--cm-text-muted)]">No elements yet</p>
				<p className="mt-1 text-[11px] text-[var(--cm-text-faint)]">Add widgets from the Widgets tab</p>
			</div>
		);
	}

	return (
		<div className="p-2">
			{elements.map((el) => (
				<TreeItem key={el.id} node={el} depth={0} />
			))}
		</div>
	);
}
