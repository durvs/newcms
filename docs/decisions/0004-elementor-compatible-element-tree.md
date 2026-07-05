# 0004 — Elementor-compatible element tree in `_builder_data`

## Context

The visual builder needs a document format, and the project must import
Elementor template kits (ZIPs of JSON documents) with reasonable fidelity.

## Decision

Builder documents are a JSON array of element nodes —
`{ id, elType: 'container' | 'widget', widgetType?, settings, elements[] }` —
deliberately shaped like Elementor's format, stored in the `_builder_data`
postmeta of the post being edited. Plain (non-builder) content uses block
markup in `post_content` (`<!-- cms:paragraph -->...<!-- /cms:paragraph -->`),
parsed by `@newcms/editor`.

## Consequences

- Template-kit import is mostly a settings-mapping problem, not a format
  translation (`packages/editor/src/import-export/elementor-compat.ts`).
- The public frontend renders `_builder_data` when present and falls back to
  `post_content` otherwise — both paths must keep working.
- Widget `settings` are loosely typed (`Record<string, unknown>`); renderers
  must validate/coerce at the edge instead of trusting the shape.
