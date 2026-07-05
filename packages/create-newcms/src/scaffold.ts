import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const TEMPLATE_REPO = 'https://github.com/durvs/newcms.git';

export interface ScaffoldOptions {
	targetDir: string;
	projectName: string;
	/** Git URL or local path of the template. Defaults to the newcms repo. */
	templateRepo?: string;
	log?: (message: string) => void;
}

/** npm-compatible package name (unscoped). */
export function validateProjectName(name: string): string | null {
	if (!name) return 'Project name is required';
	if (name.length > 214) return 'Project name must be at most 214 characters';
	if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
		return 'Project name must be lowercase letters, digits, ".", "_" or "-" (starting with a letter or digit)';
	}
	return null;
}

/** Build a .env from .env.example contents with a fresh random AUTH_SECRET. */
export function generateEnv(envExample: string, secret: string = randomSecret()): string {
	if (/^AUTH_SECRET=.*$/m.test(envExample)) {
		return envExample.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`);
	}
	return `${envExample.trimEnd()}\nAUTH_SECRET=${secret}\n`;
}

export function randomSecret(): string {
	return randomBytes(32).toString('hex');
}

function run(command: string, args: string[], cwd?: string): { ok: boolean; output: string } {
	const result = spawnSync(command, args, { cwd, encoding: 'utf-8' });
	if (result.error || result.status !== 0) {
		const output = [result.stdout, result.stderr, result.error?.message].filter(Boolean).join('\n');
		return { ok: false, output };
	}
	return { ok: true, output: result.stdout ?? '' };
}

export function scaffold(options: ScaffoldOptions): void {
	const { targetDir, projectName, templateRepo = TEMPLATE_REPO, log = () => {} } = options;

	const nameError = validateProjectName(projectName);
	if (nameError) throw new Error(nameError);

	if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
		throw new Error(`Target directory "${targetDir}" already exists and is not empty`);
	}

	// 1. Clone the template
	log(`Cloning template from ${templateRepo}...`);
	const clone = run('git', ['clone', '--depth=1', templateRepo, targetDir]);
	if (!clone.ok) {
		throw new Error(
			`Failed to clone the template (is git installed and the repo reachable?)\n${clone.output}`,
		);
	}

	// 2. Detach from the template's history and drop the scaffolder itself
	rmSync(join(targetDir, '.git'), { recursive: true, force: true });
	rmSync(join(targetDir, 'packages', 'create-newcms'), { recursive: true, force: true });

	// 3. Rename the root package
	const pkgPath = join(targetDir, 'package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
	pkg['name'] = projectName;
	writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);

	// 4. Generate .env with a fresh AUTH_SECRET
	const examplePath = join(targetDir, '.env.example');
	if (existsSync(examplePath)) {
		writeFileSync(join(targetDir, '.env'), generateEnv(readFileSync(examplePath, 'utf-8')));
		log('Generated .env with a fresh AUTH_SECRET');
	}

	// 5. Fresh git history (best effort — user may not have git identity configured)
	const init = run('git', ['init', '-b', 'main'], targetDir);
	if (init.ok) {
		run('git', ['add', '-A'], targetDir);
		const commit = run(
			'git',
			['commit', '-m', `chore: scaffold ${projectName} from the newcms template`],
			targetDir,
		);
		log(
			commit.ok
				? 'Initialized git repository'
				: 'Initialized git (commit skipped — no git identity?)',
		);
	}
}
