import { useEffect, useCallback, useRef } from 'react';
import { Toolbar } from './Toolbar';
import { Panel } from '../panel/Panel';
import { PreviewCanvas } from '../preview/PreviewCanvas';
import { useEditorStore } from '../store/editor-store';
import type { ElementNode } from '@newcms/editor';

interface DesignKitData {
	colors: { id: string; title: string; color: string }[];
	typography: Record<string, unknown>[];
	bodyFontFamily?: string;
}

interface EditorShellProps {
	documentId: number;
	documentType?: string;
	designKit?: DesignKitData | null;
	initialElements?: ElementNode[];
	title?: string;
	onSave: (elements: ElementNode[]) => Promise<void>;
	onBack: () => void;
}

export function EditorShell({
	documentId,
	documentType = 'page',
	initialElements,
	designKit: designKitProp,
	title,
	onSave,
	onBack,
}: EditorShellProps) {
	const setDocument = useEditorStore((s) => s.setDocument);
	const elements = useEditorStore((s) => s.elements);
	const undo = useEditorStore((s) => s.undo);
	const redo = useEditorStore((s) => s.redo);
	const removeElement = useEditorStore((s) => s.removeElement);
	const duplicateElement = useEditorStore((s) => s.duplicateElement);
	const selectedId = useEditorStore((s) => s.selectedId);
	const setDesignKit = useEditorStore((s) => s.setDesignKit);

	// Initialize document — only on first load or when documentId changes.
	// Do NOT re-run when initialElements changes (query refetch after save
	// would reset the store and lose the current editing state).
	const initialized = useRef(false);
	useEffect(() => {
		if (!initialized.current || useEditorStore.getState().documentId !== documentId) {
			setDocument(documentId, documentType, initialElements ?? []);
			initialized.current = true;
		}
		if (designKitProp) setDesignKit(designKitProp);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [documentId]);

	// Keyboard shortcuts
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			const mod = e.metaKey || e.ctrlKey;

			if (mod && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				undo();
			}
			if (mod && e.key === 'z' && e.shiftKey) {
				e.preventDefault();
				redo();
			}
			if (mod && e.key === 's') {
				e.preventDefault();
				onSave(elements);
			}
			if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !isInputFocused()) {
				e.preventDefault();
				removeElement(selectedId);
			}
			if (mod && e.key === 'd' && selectedId) {
				e.preventDefault();
				duplicateElement(selectedId);
			}
		},
		[undo, redo, elements, onSave, removeElement, duplicateElement, selectedId],
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);

	return (
		<div className="flex h-screen flex-col" style={{ background: 'var(--cm-surface)' }}>
			<Toolbar onSave={() => onSave(elements)} onBack={onBack} title={title} />
			<div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
				<Panel />
				<div
					style={{
						flex: 1,
						position: 'relative',
						overflow: 'hidden',
						background: 'var(--cm-surface-elevated)',
					}}
				>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							overflow: 'auto',
						}}
					>
						<PreviewCanvas />
					</div>
				</div>
			</div>
		</div>
	);
}

function isInputFocused(): boolean {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName.toLowerCase();
	return (
		tag === 'input' ||
		tag === 'textarea' ||
		tag === 'select' ||
		(el as HTMLElement).isContentEditable
	);
}
