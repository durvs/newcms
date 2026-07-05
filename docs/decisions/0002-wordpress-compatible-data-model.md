# 0002 — WordPress-compatible data model (clean room)

## Context

The project's goal is to support WordPress-style content — including importing
Elementor template kits — without a WordPress installation. The domain model
had to be either invented or borrowed.

## Decision

Reimplement the WordPress data model as a clean room: `posts` (with
`post_type`, `post_status`, `post_name`), `postmeta`, `options` (with
autoload), `terms` + `term_taxonomy`, `users` + `usermeta`, comments, and
WP-style roles/capabilities. The original functional specs live in
[`docs/specs/`](../specs) (pt-BR).

## Consequences

- Concepts map 1:1 to WordPress, which makes template-kit import and WP-honed
  intuitions work — e.g. attachments are posts with `post_type='attachment'`.
- Some WP quirks are inherited on purpose (options as strings, meta as
  key/value rows). Don't "normalize" them away without an ADR.
- Naming follows WP (`siteurl`, `permalink_structure`, `user_roles` option) —
  keep new options/meta keys consistent with that style.
