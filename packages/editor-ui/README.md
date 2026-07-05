# @newcms/editor-ui

React UI for the NewCMS visual editor — a drag-and-drop page builder with a widget panel, control sidebar, live preview canvas, and responsive device preview. Part of the [NewCMS](https://github.com/durvs/newcms) monorepo, built on top of the headless document model from `@newcms/editor`.

## Features

- **`EditorShell`** — full-screen editor layout: toolbar, side panel, and preview canvas wired together
- **Drag-and-drop** — drag widgets from the panel into the canvas, or move existing elements between containers
- **Widget picker** — 25+ widgets organized by category (text, media, interactive, and more)
- **Control panel** — content / style / advanced tabs with color, slider, select, and dimensions controls
- **Navigator tree** — hierarchical outline of the document with selection
- **Device preview** — desktop (100%), tablet (768px), and mobile (375px) viewport frames
- **Design Kit aware** — applies global colors and typography imported from template kits
- **Undo / redo** — 50-step history built into the store
- **Keyboard shortcuts** — `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` redo, `Cmd/Ctrl+S` save, `Cmd/Ctrl+D` duplicate, `Delete`/`Backspace` remove

## Installation

```bash
npm install @newcms/editor-ui
```

**Peer dependencies:** `react` >= 18, `react-dom` >= 18, and `zustand` >= 4. The package also depends on `@newcms/editor` for the `ElementNode` document model and tree operations.

## Usage

### EditorShell

`EditorShell` is the only component you need to mount. You provide the document, an `onSave` callback, and an `onBack` callback — persistence and routing stay in your app:

```tsx
'use client';

import { EditorShell } from '@newcms/editor-ui';
import type { ElementNode } from '@newcms/editor';

export default function VisualEditorPage({ post, builderData, designKit }) {
	async function handleSave(elements: ElementNode[]) {
		await api.put(`/posts/${post.id}/meta/_builder_data`, { value: elements });
	}

	return (
		<EditorShell
			documentId={post.id}
			documentType="post"
			initialElements={builderData ?? []}
			designKit={designKit}
			title={post.postTitle}
			onSave={handleSave}
			onBack={() => router.push('/posts')}
		/>
	);
}
```

The shell initializes its internal store from `initialElements` on first mount (or when `documentId` changes). Later changes to `initialElements` — such as a query refetch after saving — do **not** reset the editing state.

#### Props

| Prop              | Type                                         | Default  | Description                                                         |
| ----------------- | -------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `documentId`      | `number`                                     | —        | ID of the document being edited (required)                          |
| `documentType`    | `string`                                     | `'page'` | Document type (e.g. `'post'`, `'page'`)                             |
| `initialElements` | `ElementNode[]`                              | `[]`     | Initial element tree for the canvas                                 |
| `designKit`       | `object \| null`                             | —        | Global colors/typography: `{ colors, typography, bodyFontFamily? }` |
| `title`           | `string`                                     | —        | Document title shown in the toolbar                                 |
| `onSave`          | `(elements: ElementNode[]) => Promise<void>` | —        | Called on the Save button or `Cmd/Ctrl+S` (required)                |
| `onBack`          | `() => void`                                 | —        | Called when the user exits the editor (required)                    |

### Editor Store

The zustand store behind the shell is exported as `useEditorStore`, so you can read or drive editor state from your own components:

```tsx
import { useEditorStore } from '@newcms/editor-ui';

function DirtyIndicator() {
	const dirty = useEditorStore((s) => s.dirty);
	return dirty ? <span>Unsaved changes</span> : null;
}

// Actions can also be called imperatively
useEditorStore.getState().addElement('heading', null);
useEditorStore.getState().setBreakpoint('mobile');
```

#### Key state

| Field                      | Type             | Description                                                          |
| -------------------------- | ---------------- | -------------------------------------------------------------------- |
| `elements`                 | `ElementNode[]`  | Current element tree                                                 |
| `dirty`                    | `boolean`        | Whether there are unsaved changes                                    |
| `selectedId` / `hoveredId` | `string \| null` | Current selection / hover                                            |
| `panelView`                | `PanelView`      | Active panel: `'widgets' \| 'controls' \| 'navigator' \| 'settings'` |
| `controlTab`               | `ControlTab`     | Active control tab: `'content' \| 'style' \| 'advanced'`             |
| `activeBreakpoint`         | `string`         | Device preview: `'desktop'`, `'tablet'`, or `'mobile'`               |
| `designKit`                | `object \| null` | Global colors and typography                                         |

#### Key actions

| Action                                                                | Description                                 |
| --------------------------------------------------------------------- | ------------------------------------------- |
| `setDocument(id, type, elements)`                                     | Load a document and reset history/selection |
| `addElement(widgetType, parentId, index?)`                            | Insert a new widget and select it           |
| `addContainer(parentId, index?)`                                      | Insert a new container                      |
| `removeElement(id)`                                                   | Remove an element                           |
| `moveElement(id, newParentId, newIndex)`                              | Move an element within the tree             |
| `duplicateElement(id)`                                                | Clone an element next to the original       |
| `updateSetting(id, key, value)`                                       | Update a single element setting             |
| `updateSettingsBatch(id, updates)`                                    | Update multiple settings at once            |
| `selectElement(id)` / `hoverElement(id)`                              | Change selection / hover                    |
| `setPanelView(view)` / `setControlTab(tab)`                           | Switch panel view / control tab             |
| `setBreakpoint(bp)`                                                   | Switch device preview                       |
| `startDrag(type, sourceId?)` / `setDropTarget(...)` / `executeDrop()` | Drag-and-drop lifecycle                     |
| `undo()` / `redo()`                                                   | Step through history                        |
| `getSelectedElement()`                                                | Get the currently selected `ElementNode`    |

Every mutating action pushes to a 50-entry undo history and marks the document dirty.

### Types

```ts
import type { PanelView, ControlTab, EditorState } from '@newcms/editor-ui';
```

`EditorState` is the full store interface — useful for typing custom selectors or wrapper hooks.

## License

GPL-2.0-or-later
