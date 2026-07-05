# create-newcms

Scaffold a new [NewCMS](https://github.com/durvs/newcms) project — a
WordPress-inspired TypeScript CMS with an Elementor-inspired visual builder.

```bash
pnpm create newcms my-site
# or
npm create newcms@latest my-site
```

## What it does

1. Clones the [newcms template](https://github.com/durvs/newcms) (shallow) into `my-site/`
2. Detaches it from the template's git history and starts a fresh one
3. Renames the root package to your project name
4. Generates a `.env` from `.env.example` with a fresh random `AUTH_SECRET`
5. Removes the scaffolder package from the new project
6. Prints the next steps

## After scaffolding

```bash
cd my-site
pnpm install
pnpm env:start      # postgres + redis via docker compose
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000/login and sign in with `admin` / `password`.

## AI agents included

Every scaffolded project ships with agent instructions:

- `AGENTS.md` — entry point for AI coding agents (architecture, commands, gotchas)
- `docs/decisions/` — short ADRs recording the _why_ behind project decisions
- `CLAUDE.md` — imports `AGENTS.md` for Claude Code

Requirements: Node.js 22+, git, pnpm 10+ (for the scaffolded project), Docker.

Part of the [newcms](https://github.com/durvs/newcms) monorepo. License: GPL-2.0-or-later.
