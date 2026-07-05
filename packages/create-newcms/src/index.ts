#!/usr/bin/env node
import { basename, resolve } from 'node:path';
import { scaffold, validateProjectName } from './scaffold.js';

const HELP = `create-newcms — scaffold a new NewCMS project

Usage:
  pnpm create newcms <directory>
  npm create newcms@latest <directory>

The new project is a full monorepo (API + web + packages) cloned from
https://github.com/durvs/newcms with a fresh .env and git history.
`;

function main(): void {
	const arg = process.argv[2];

	if (!arg || arg === '--help' || arg === '-h') {
		console.log(HELP);
		process.exit(arg ? 0 : 1);
	}

	const targetDir = resolve(process.cwd(), arg);
	const projectName = basename(targetDir);

	const nameError = validateProjectName(projectName);
	if (nameError) {
		console.error(`✖ ${nameError}`);
		process.exit(1);
	}

	try {
		scaffold({ targetDir, projectName, log: (m) => console.log(`  ${m}`) });
	} catch (err) {
		console.error(`✖ ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}

	console.log(`
✔ Created ${projectName}

Next steps:
  cd ${arg}
  pnpm install
  pnpm env:start        # postgres + redis via docker compose
  pnpm db:migrate
  pnpm db:seed
  pnpm dev

Then open http://localhost:3000/login — sign in with admin / password.

Working with AI agents? Start them at AGENTS.md; project decisions live
in docs/decisions/.
`);
}

main();
