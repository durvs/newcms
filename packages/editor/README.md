# @newcms/editor

Block parser/serializer, block type registry, visual builder element tree, control system, and CSS compiler for [NewCMS](https://github.com/durvs/newcms) — part of the newcms monorepo.

## Installation

```bash
npm install @newcms/editor
```

## Blocks: Parse & Serialize

Content is stored as HTML annotated with `<!-- cms:* -->` comment delimiters. `parseBlocks` turns it into a `Block` tree; `serializeBlocks` is the exact inverse.

```typescript
import { parseBlocks, serializeBlocks } from '@newcms/editor';

const blocks = parseBlocks(
	'<!-- cms:paragraph {"align":"center"} -->\n<p>Hello</p>\n<!-- /cms:paragraph -->\n\n<!-- cms:separator /-->',
);
// blocks[0] = { name: 'cms/paragraph', attributes: { align: 'center' }, innerBlocks: [], innerHTML: '<p>Hello</p>' }
// blocks[1] = { name: 'cms/separator', attributes: {}, innerBlocks: [], innerHTML: '' }

const html = serializeBlocks(blocks); // round-trips to the original format
```

The parser handles nested blocks of the same type (depth-matched), self-closing blocks (`/-->`), malformed attribute JSON (falls back to `{}`), and wraps stray HTML between blocks in `cms/freeform` blocks.

## Block Registry

`BlockRegistry` stores `BlockTypeDefinition`s and `BlockPattern`s. `BUILTIN_BLOCK_TYPES` ships 13 default types (`cms/paragraph`, `cms/heading`, `cms/image`, `cms/list`, `cms/quote`, `cms/code`, `cms/html`, `cms/separator`, `cms/spacer`, `cms/columns`, `cms/column`, `cms/group`, `cms/button`).

```typescript
import { BlockRegistry, BUILTIN_BLOCK_TYPES } from '@newcms/editor';

const registry = new BlockRegistry();
BUILTIN_BLOCK_TYPES.forEach((bt) => registry.registerBlockType(bt));

registry.registerBlockType({
	name: 'cms/testimonial',
	title: 'Testimonial',
	category: 'widgets',
	supports: { color: { text: true }, className: true },
	defaultAttributes: { quote: '', author: '' },
});

registry.getBlockType('cms/heading'); // BlockTypeDefinition | undefined
registry.getBlockTypesByCategory('text'); // paragraph, heading, list, quote, code
```

| Method                                                 | Description                                      |
| ------------------------------------------------------ | ------------------------------------------------ |
| `registerBlockType(definition)`                        | Register a block type (throws on duplicate name) |
| `getBlockType(name)` / `getAllBlockTypes()`            | Look up one / all block types                    |
| `getBlockTypesByCategory(category)`                    | Filter by category                               |
| `unregisterBlockType(name)`                            | Remove a block type                              |
| `registerPattern(pattern)` / `getPattern(name)`        | Register / look up a block pattern               |
| `getAllPatterns()` / `getPatternsByCategory(category)` | List patterns                                    |
| `reset()`                                              | Clear all block types and patterns               |

## Element Tree

The visual builder's data model. A document is a tree of `ElementNode`s (`container` | `section` | `column` | `widget`), stored as JSON. All mutating operations are **immutable** — they return a new tree.

```typescript
import {
	createElement,
	insertNode,
	updateSettings,
	moveNode,
	removeNode,
	cloneNode,
	findById,
	findParent,
	getPath,
	countNodes,
} from '@newcms/editor';

let tree = insertNode([], createElement('section'), null); // root level
const heading = createElement('widget', 'heading', { title: 'Hi' });
tree = insertNode(tree, heading, tree[0].id); // into the section

tree = updateSettings(tree, heading.id, 'title_color', '#ff0000');
tree = moveNode(tree, heading.id, null, 0); // reparent to root, index 0
const copy = cloneNode(heading); // deep clone, fresh IDs

findById(tree, heading.id); // ElementNode | undefined
findParent(tree, heading.id); // { parent: ElementNode | null, index: number } | undefined
getPath(tree, heading.id); // string[] of IDs from root, or null
countNodes(tree); // total node count
```

Traversal helpers: `walkTree(elements, visitor)` (depth-first; visitor gets `(node, depth, path)` and can return `false` to skip children), `flattenTree`, `getAncestors`, `getDescendants`, `findAll(elements, predicate)`, `findWidgetsByType(elements, widgetType)`, `getMaxDepth`.

A full document is a `BuilderDocument` — `{ elements: ElementNode[], settings: DocumentSettings }` — where settings carry `pageTitle`, `customCss`, `templateType`, `editMode`, etc.

## Controls

Widgets describe their editable options with a `WidgetControlSchema`: sections (grouped under `content` / `style` / `advanced` tabs) containing `ControlDefinition`s. There are 12 control types (`text`, `textarea`, `number`, `select`, `switcher`, `color`, `slider`, `dimensions`, `media`, `icon-choose`, `repeater`, `code`) plus `group` controls that expand into multiple sub-controls via `CONTROL_GROUPS` (`typography`, `background`, `border`, `shadow`).

```typescript
import type { WidgetControlSchema } from '@newcms/editor';

const headingSchema: WidgetControlSchema = {
	widgetType: 'heading',
	title: 'Heading',
	sections: [
		{
			id: 'style',
			label: 'Style',
			tab: 'style',
			controls: [
				{
					id: 'title_color',
					type: 'color',
					label: 'Color',
					selectors: { '{{WRAPPER}} .heading': 'color: {{VALUE}}' },
					responsive: true,
				},
				{
					id: 'typo',
					type: 'group',
					groupType: 'typography',
					label: 'Typography',
					selector: '{{WRAPPER}} .heading',
				},
			],
		},
	],
};
```

`expandGroup(controlId, groupType, selector)` returns the expanded sub-control IDs (e.g. `typo_font_size`, `typo_font_weight`, ...) — the CSS compiler uses it internally.

## CSS Compiler

`compileCSS` walks the element tree, matches widget settings against control schemas, and emits a stylesheet. Selector templates resolve `{{WRAPPER}}` to `.builder-el-{id}`; value templates resolve `{{VALUE}}`, `{{SIZE}}`, and `{{UNIT}}` (for `{ size, unit }` slider values).

```typescript
import { compileCSS, minifyCSS } from '@newcms/editor';

const schemas = new Map([[headingSchema.widgetType, headingSchema]]);
const css = compileCSS(tree, schemas);
// .builder-el-abc12345 .heading { color: #ff0000 }
// @media (max-width: 768px) { ... }

const min = minifyCSS(css);
```

Lower-level helpers are exported too: `resolveSelector(template, elementId)`, `resolveValue(template, value)`, and `generateRule(selectorTemplate, valueTemplate, elementId, value)`.

### Responsive Breakpoints

`DEFAULT_BREAKPOINTS` defines 7 breakpoints (`widescreen`, `desktop` (base, no media query), `laptop`, `tablet_extra`, `tablet`, `mobile_extra`, `mobile`). Controls with `responsive: true` read per-breakpoint values from settings via a `{controlId}_{breakpoint}` suffix (e.g. `title_color_tablet`); missing values inherit from desktop.

```typescript
import { DEFAULT_BREAKPOINTS, getMediaQuery, getResponsiveValue } from '@newcms/editor';

getMediaQuery(DEFAULT_BREAKPOINTS[4]); // '@media (max-width: 768px)'
getResponsiveValue({ size: 10, size_tablet: 5 }, 'size', 'tablet'); // 5
```

## Also Included

The package also exports the Design Kit system (`kit/`), Dynamic Tags registry (`dynamic-tags/`), template import/export with Elementor compatibility (`import-export/`), and type definitions for the Theme, Loop, Popup, and Form builders and Motion Effects.

## License

GPL-2.0-or-later
