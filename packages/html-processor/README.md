# @newcms/html-processor

HTML tag processor and full HTML5 processor for [NewCMS](https://github.com/durvs/newcms) — inspired by the WordPress HTML API, with **zero external dependencies**.

Two complementary tools:

- **`TagProcessor`** — a streaming tag visitor that scans HTML linearly without building a DOM tree. Ideal for fast, targeted attribute and class modifications on large documents.
- **`FullProcessor`** — a full HTML5 parser that builds an element tree with proper nesting, implicit closing (`<p>`, `<li>`, `<td>`, …), and breadcrumb tracking. Ideal for querying and traversing document structure.

## Features

- **Zero dependencies** — pure TypeScript, nothing else in `node_modules`
- **Streaming tag visitor** — advance a cursor tag by tag; no tree allocation
- **Read/modify attributes** — get, set, and remove attributes on the current tag
- **Class helpers** — `addClass`, `removeClass`, `hasClass`
- **Offset-safe serialization** — modifications are applied end-to-start, preserving the rest of the document byte-for-byte
- **HTML5-aware tree building** — void elements (`<img>`, `<br>`, …) and implicit auto-closing handled correctly
- **Tree queries** — find by tag, class, or id; extract text content; walk with a visitor
- **Dual ESM/CJS** builds with bundled type declarations

## Installation

```bash
npm install @newcms/html-processor
# or
pnpm add @newcms/html-processor
```

## TagProcessor

Scans the document with a mutable cursor. Call `nextTag()` to advance, then read or modify the current tag. Modifications are buffered and applied when you call `getUpdatedHtml()`.

```ts
import { TagProcessor } from '@newcms/html-processor';

const p = new TagProcessor('<div><img src="photo.jpg"><img src="logo.png"></div>');

// Visit every <img> and make it lazy-loaded
while (p.nextTag('img')) {
	p.setAttribute('loading', 'lazy');
	p.addClass('cms-image');
}

p.getUpdatedHtml();
// <div><img src="photo.jpg" loading="lazy" class="cms-image"><img src="logo.png" loading="lazy" class="cms-image"></div>
```

Call `nextTag()` without a name to iterate every opening tag:

```ts
const p = new TagProcessor('<div><span>x</span></div>');
const tags: string[] = [];
while (p.nextTag()) tags.push(p.getTag()!);
// ['div', 'span']
```

Reading and removing attributes:

```ts
const p = new TagProcessor('<a href="/old" target="_blank" onclick="evil()">link</a>');
p.nextTag('a');

p.getAttribute('href'); // '/old'
p.setAttribute('href', '/new');
p.removeAttribute('onclick');
p.hasClass('external'); // false

p.getUpdatedHtml(); // <a href="/new" target="_blank">link</a>
```

### API Reference

| Method                      | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `new TagProcessor(html)`    | Create a processor for an HTML string                                   |
| `nextTag(tagName?)`         | Advance to the next opening tag (optionally by name); returns `boolean` |
| `getTag()`                  | Name of the current tag, or `null`                                      |
| `getAttribute(name)`        | Attribute value on the current tag, or `null`                           |
| `setAttribute(name, value)` | Set an attribute on the current tag                                     |
| `removeAttribute(name)`     | Remove an attribute from the current tag                                |
| `addClass(className)`       | Add a CSS class to the current tag                                      |
| `removeClass(className)`    | Remove a CSS class from the current tag                                 |
| `hasClass(className)`       | Check whether the current tag has a CSS class                           |
| `getUpdatedHtml()`          | Serialize the HTML with all buffered modifications applied              |
| `reset()`                   | Move the cursor back to the beginning                                   |

## FullProcessor

Parses the document into an `HtmlNode` tree at construction time, handling void elements and implicit closing per HTML5 rules (an unclosed `<li>` is closed by the next `<li>`, and so on).

```ts
import { FullProcessor, type HtmlNode } from '@newcms/html-processor';

const doc = new FullProcessor(`
  <article id="post-1" class="post featured">
    <h2>Hello</h2>
    <ul><li>One<li>Two</ul>
    <!-- a comment -->
  </article>
`);

// Queries
const items = doc.findAll('li'); // HtmlNode[] — both <li> elements
const heading = doc.findFirst('h2'); // HtmlNode | undefined
const featured = doc.findByClass('featured');
const article = doc.findById('post-1');

// Text and structure
doc.getTextContent(heading!); // 'Hello'
doc.getBreadcrumbs(items[0]); // ['article', 'ul', 'li']

// Traverse the whole tree
doc.walk(doc.getRoot(), (node: HtmlNode) => {
	if (node.type === 'element') console.log(node.tag);
});

// Serialize (whole document, or any subtree)
doc.serialize();
doc.serialize(heading); // '<h2>Hello</h2>'
```

### API Reference

| Method                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `new FullProcessor(html)` | Parse an HTML string into a tree                         |
| `getRoot()`               | The `#document` root node                                |
| `findAll(tagName)`        | All elements with the given tag name                     |
| `findFirst(tagName)`      | First element with the given tag name, or `undefined`    |
| `findByClass(className)`  | All elements carrying a CSS class                        |
| `findById(id)`            | Element with the given `id`, or `undefined`              |
| `getTextContent(node)`    | Concatenated text of a node and its descendants          |
| `getBreadcrumbs(node)`    | Tag-name path from the root down to a node               |
| `walk(node, visitor)`     | Depth-first visit of a node and its descendants          |
| `serialize(node?)`        | Serialize a subtree (or the whole document) back to HTML |

### HtmlNode

| Field         | Type                               | Description                              |
| ------------- | ---------------------------------- | ---------------------------------------- |
| `type`        | `'element' \| 'text' \| 'comment'` | Node kind                                |
| `tag`         | `string \| undefined`              | Tag name (elements only)                 |
| `attributes`  | `Map<string, string> \| undefined` | Parsed attributes (elements only)        |
| `children`    | `HtmlNode[]`                       | Child nodes                              |
| `parent`      | `HtmlNode \| undefined`            | Parent node                              |
| `text`        | `string \| undefined`              | Content of text/comment nodes            |
| `selfClosing` | `boolean \| undefined`             | Whether the element is void/self-closing |

## Choosing Between Them

- Use **`TagProcessor`** when you only need to tweak tags in place (add a class, rewrite a `src`, strip an attribute). It never allocates a tree and leaves untouched markup byte-identical.
- Use **`FullProcessor`** when you need structure: querying descendants, extracting text, or knowing where a node sits in the document.

## License

GPL-2.0-or-later — part of the [NewCMS](https://github.com/durvs/newcms) monorepo.
