# Agent instructions for NewCMS

This file is the entry point for AI coding agents working in this repository.
Project-specific decisions live in [`docs/decisions/`](docs/decisions) as short
ADRs — read the ones relevant to your task before changing behavior they cover.

## What this project is

A demo/educational CMS: WordPress-inspired content model + Elementor-inspired
visual builder, built from scratch in TypeScript. pnpm + Turborepo monorepo.

| Path                      | What it is                                                     |
| ------------------------- | -------------------------------------------------------------- |
| `apps/api`                | NestJS 11 REST API (`/api/v2/...`, Swagger at `/api/docs`)     |
| `apps/web`                | Next.js 15 App Router — admin, visual editor, public frontend  |
| `packages/core`           | Hooks (actions/filters), shortcodes, rewrite rules, registries |
| `packages/database`       | Drizzle schema, repositories, Redis object cache, seed         |
| `packages/auth`           | Password hashing, sessions, nonces, roles/capabilities         |
| `packages/query-engine`   | Declarative post queries compiled to SQL                       |
| `packages/editor`         | Block parser/serializer, element tree, CSS compiler            |
| `packages/editor-ui`      | React UI for the visual builder                                |
| `packages/html-processor` | Zero-dependency HTML5 tag/tree processor                       |
| `packages/media`          | Upload pipeline, sharp image processing, storage adapters      |
| `packages/create-newcms`  | `pnpm create newcms` scaffolder (published to npm)             |

## Commands

```bash
pnpm install
cp .env.example .env        # defaults work for local dev
pnpm env:start              # postgres + redis (docker compose)
pnpm db:migrate && pnpm db:seed
pnpm dev                    # api :3001, web :3000

pnpm typecheck              # strict tsc across the workspace
pnpm test                   # vitest; query-engine suite needs the DB running
pnpm turbo run test --filter=@newcms/editor   # single package
pnpm format                 # prettier — format:check is enforced in CI
```

Demo login: `admin` / `password` at http://localhost:3000/login.

## Rules that bite (learned the hard way)

- **New env vars must be declared in `globalEnv` in `turbo.json`.** Turbo 2
  runs tasks in strict env mode and silently strips undeclared variables.
  Locally `dotenv` hides the mistake; in CI there is no `.env`, so the task
  fails. This broke CI once. See [ADR 0005](docs/decisions/0005-turbo-strict-env.md).
- **`@newcms/*` imports resolve to `dist/`**, not `src/`. Build dependencies
  before typecheck/tests/seed (`turbo` handles it via `dependsOn: ["^build"]` —
  keep that wiring when adding tasks).
- **Password hashing is peppered.** `hashPassword(password, AUTH_SECRET)` =
  bcrypt over an HMAC-SHA384 pre-hash. The seed and the API must use the same
  `AUTH_SECRET` or every login fails. See [ADR 0003](docs/decisions/0003-password-hashing-and-roles.md).
- **Roles come from the `capabilities` usermeta.** A user without it is
  treated as `subscriber` and gets 403 on every capability-gated endpoint,
  even if login succeeds.
- **pnpm is strict.** Declare every package you import in that workspace's
  `package.json` — phantom dependencies fail typecheck/resolution.
- **`.env` loading happens in `apps/api/src/env.ts`, which must stay the
  first application import in `main.ts`.** ES imports are hoisted, so a
  `dotenv.config()` call in `main.ts`'s body runs after module-scope
  `process.env` reads in controllers (this silently broke `AUTH_SECRET` once).
- **Post content is block markup** (`<!-- cms:paragraph -->...`), and visual
  builder documents are an element-tree JSON stored in the `_builder_data`
  postmeta. See [ADR 0004](docs/decisions/0004-elementor-compatible-element-tree.md).
- **Prettier is enforced in CI** (`pnpm format:check`). Run `pnpm format`
  before committing. Indentation is tabs (see `.prettierrc`).

## Conventions

- TypeScript strict, ESM (`"type": "module"`), target ES2023.
- Packages build with tsup; tests are vitest files under `__tests__/`.
- API controllers guard mutations with `AuthGuard` + `PermissionGuard` +
  `@RequireCapability('...')` — follow that pattern for new endpoints.
- Conventional-commit style messages (`fix(seed): ...`, `docs: ...`).
- License is GPL-2.0-or-later across the repo.

## Where decisions live

- [`docs/decisions/`](docs/decisions) — ADRs: the _why_ behind non-obvious choices.
- [`docs/specs/`](docs/specs) — original clean-room functional specs (pt-BR).
- When you make a new non-obvious, load-bearing decision, add an ADR
  (copy the format of an existing one, number it sequentially).
