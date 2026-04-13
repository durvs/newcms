import { create } from 'zustand';
import type { ElementNode } from '@newcms/editor';
import {
	insertNode,
	removeNode,
	moveNode,
	cloneNode,
	updateSettings,
	updateSettingsBatch,
	findById,
	createElement,
} from '@newcms/editor';

export type PanelView = 'widgets' | 'controls' | 'navigator' | 'settings';
export type ControlTab = 'content' | 'style' | 'advanced';

export interface EditorState {
	// Document
	documentId: number;
	documentType: string;
	elements: ElementNode[];
	dirty: boolean;

	// Selection
	selectedId: string | null;
	hoveredId: string | null;

	// Panel
	panelView: PanelView;
	controlTab: ControlTab;

	// Responsive
	activeBreakpoint: string;

	// Drag-and-drop
	dragging: { type: string; sourceId?: string } | null;
	dropTarget: { parentId: string | null; index: number } | null;

	// History
	past: ElementNode[][];
	future: ElementNode[][];

	// Actions — document
	setDocument: (id: number, type: string, elements: ElementNode[]) => void;
	setElements: (elements: ElementNode[]) => void;

	// Actions — elements
	addElement: (widgetType: string, parentId: string | null, index?: number) => void;
	removeElement: (id: string) => void;
	moveElement: (id: string, newParentId: string | null, newIndex: number) => void;
	duplicateElement: (id: string) => void;
	updateSetting: (id: string, key: string, value: unknown) => void;
	updateSettingsBatch: (id: string, updates: Record<string, unknown>) => void;
	addContainer: (parentId: string | null, index?: number) => void;

	// Actions — selection
	selectElement: (id: string | null) => void;
	hoverElement: (id: string | null) => void;

	// Actions — panel
	setPanelView: (view: PanelView) => void;
	setControlTab: (tab: ControlTab) => void;

	// Actions — responsive
	setBreakpoint: (bp: string) => void;

	// Actions — drag
	startDrag: (type: string, sourceId?: string) => void;
	setDropTarget: (parentId: string | null, index: number) => void;
	clearDropTarget: () => void;
	executeDrop: () => void;

	// Actions — history
	undo: () => void;
	redo: () => void;

	// Computed
	getSelectedElement: () => ElementNode | undefined;
}

function pushHistory(state: EditorState): Pick<EditorState, 'past' | 'future'> {
	return {
		past: [...state.past.slice(-49), state.elements],
		future: [],
	};
}

export const useEditorStore = create<EditorState>((set, get) => ({
	documentId: 0,
	documentType: 'page',
	elements: [],
	dirty: false,

	selectedId: null,
	hoveredId: null,

	panelView: 'widgets',
	controlTab: 'content',

	activeBreakpoint: 'desktop',

	dragging: null,
	dropTarget: null,

	past: [],
	future: [],

	setDocument: (id, type, elements) =>
		set({ documentId: id, documentType: type, elements, dirty: false, past: [], future: [], selectedId: null }),

	setElements: (elements) =>
		set((s) => ({ ...pushHistory(s), elements, dirty: true })),

	addElement: (widgetType, parentId, index) =>
		set((s) => {
			const node = createElement('widget', widgetType);
			return { ...pushHistory(s), elements: insertNode(s.elements, node, parentId, index), dirty: true, selectedId: node.id, panelView: 'controls' };
		}),

	removeElement: (id) =>
		set((s) => {
			const newSelected = s.selectedId === id ? null : s.selectedId;
			return { ...pushHistory(s), elements: removeNode(s.elements, id), dirty: true, selectedId: newSelected };
		}),

	moveElement: (id, newParentId, newIndex) =>
		set((s) => ({ ...pushHistory(s), elements: moveNode(s.elements, id, newParentId, newIndex), dirty: true })),

	duplicateElement: (id) =>
		set((s) => {
			const original = findById(s.elements, id);
			if (!original) return s;
			const clone = cloneNode(original);
			// Insert right after the original
			const parent = findParentInTree(s.elements, id);
			const parentId = parent?.id ?? null;
			const idx = parent
				? parent.elements.findIndex((e) => e.id === id) + 1
				: s.elements.findIndex((e) => e.id === id) + 1;
			return { ...pushHistory(s), elements: insertNode(s.elements, clone, parentId, idx), dirty: true, selectedId: clone.id };
		}),

	updateSetting: (id, key, value) =>
		set((s) => ({ ...pushHistory(s), elements: updateSettings(s.elements, id, key, value), dirty: true })),

	updateSettingsBatch: (id, updates) =>
		set((s) => ({ ...pushHistory(s), elements: updateSettingsBatch(s.elements, id, updates), dirty: true })),

	addContainer: (parentId, index) =>
		set((s) => {
			const node = createElement('container');
			return { ...pushHistory(s), elements: insertNode(s.elements, node, parentId, index), dirty: true, selectedId: node.id };
		}),

	selectElement: (id) =>
		set({ selectedId: id, panelView: id ? 'controls' : 'widgets' }),

	hoverElement: (id) =>
		set({ hoveredId: id }),

	setPanelView: (view) => set({ panelView: view }),
	setControlTab: (tab) => set({ controlTab: tab }),
	setBreakpoint: (bp) => set({ activeBreakpoint: bp }),

	startDrag: (type, sourceId) => set({ dragging: { type, sourceId } }),
	setDropTarget: (parentId, index) => set({ dropTarget: { parentId, index } }),
	clearDropTarget: () => set({ dropTarget: null, dragging: null }),
	executeDrop: () =>
		set((s) => {
			if (!s.dragging || !s.dropTarget) return { dragging: null, dropTarget: null };

			if (s.dragging.sourceId) {
				// Moving existing element
				return {
					...pushHistory(s),
					elements: moveNode(s.elements, s.dragging.sourceId, s.dropTarget.parentId, s.dropTarget.index),
					dirty: true,
					dragging: null,
					dropTarget: null,
				};
			} else {
				// Inserting new widget
				const node = createElement('widget', s.dragging.type);
				return {
					...pushHistory(s),
					elements: insertNode(s.elements, node, s.dropTarget.parentId, s.dropTarget.index),
					dirty: true,
					selectedId: node.id,
					panelView: 'controls' as PanelView,
					dragging: null,
					dropTarget: null,
				};
			}
		}),

	undo: () =>
		set((s) => {
			if (s.past.length === 0) return s;
			const previous = s.past[s.past.length - 1];
			return {
				elements: previous,
				past: s.past.slice(0, -1),
				future: [s.elements, ...s.future],
				dirty: true,
				selectedId: null,
			};
		}),

	redo: () =>
		set((s) => {
			if (s.future.length === 0) return s;
			const next = s.future[0];
			return {
				elements: next,
				past: [...s.past, s.elements],
				future: s.future.slice(1),
				dirty: true,
				selectedId: null,
			};
		}),

	getSelectedElement: () => {
		const s = get();
		if (!s.selectedId) return undefined;
		return findById(s.elements, s.selectedId);
	},
}));

/** Helper — find the parent node of an element in the tree */
function findParentInTree(elements: ElementNode[], childId: string): ElementNode | null {
	for (const el of elements) {
		if (el.elements.some((c) => c.id === childId)) return el;
		const found = findParentInTree(el.elements, childId);
		if (found) return found;
	}
	return null;
}
