# 0001 — Single monorepo; packages not published to npm

## Context

The `@newcms/*` packages could live in their own repo (or be published to npm)
separately from the demo apps. Splitting was considered when the project was
first published to GitHub.

## Decision

One pnpm + Turborepo monorepo. Packages reference each other with
`workspace:*` and are **not** published to npm. The demo apps (`apps/api`,
`apps/web`) live alongside the packages and serve as their living
documentation. New projects are created by cloning this repo as a template
(`pnpm create newcms`), not by installing packages.

The only package published to npm is `create-newcms`, because `pnpm create`
requires it to be resolvable from the registry.

## Consequences

- `@newcms/*` imports resolve to each package's built `dist/` — build order
  matters and is wired via turbo `dependsOn: ["^build"]`.
- There is no version skew between packages; everything moves together.
- If packages are ever published, the `package.json` metadata (exports,
  `files`, `prepublishOnly`) is already in place.
