import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateEnv, randomSecret, scaffold, validateProjectName } from '../src/scaffold';

describe('validateProjectName', () => {
	it('accepts npm-compatible names', () => {
		expect(validateProjectName('my-site')).toBeNull();
		expect(validateProjectName('site2')).toBeNull();
		expect(validateProjectName('a.b_c-d')).toBeNull();
	});

	it('rejects invalid names', () => {
		expect(validateProjectName('')).toMatch(/required/);
		expect(validateProjectName('My Site')).toMatch(/lowercase/);
		expect(validateProjectName('-leading')).toMatch(/lowercase/);
		expect(validateProjectName('UPPER')).toMatch(/lowercase/);
		expect(validateProjectName('a'.repeat(215))).toMatch(/214/);
	});
});

describe('generateEnv', () => {
	it('replaces the AUTH_SECRET line', () => {
		const example = 'DB_HOST=localhost\nAUTH_SECRET=change-me\nAPI_PORT=3001\n';
		const env = generateEnv(example, 'fresh-secret');
		expect(env).toContain('AUTH_SECRET=fresh-secret');
		expect(env).not.toContain('change-me');
		expect(env).toContain('DB_HOST=localhost');
	});

	it('appends AUTH_SECRET when the example lacks it', () => {
		const env = generateEnv('DB_HOST=localhost\n', 'fresh-secret');
		expect(env.trimEnd().endsWith('AUTH_SECRET=fresh-secret')).toBe(true);
	});

	it('generates unique 64-char hex secrets by default', () => {
		expect(randomSecret()).toMatch(/^[0-9a-f]{64}$/);
		expect(randomSecret()).not.toBe(randomSecret());
	});
});

describe('scaffold (local template fixture, no network)', () => {
	let workDir: string;
	let templateDir: string;

	beforeAll(() => {
		workDir = mkdtempSync(join(tmpdir(), 'create-newcms-test-'));
		templateDir = join(workDir, 'template');

		// Minimal fake template repo
		mkdirSync(join(templateDir, 'packages', 'create-newcms'), { recursive: true });
		writeFileSync(
			join(templateDir, 'package.json'),
			JSON.stringify({ name: 'newcms', private: true }, null, '\t'),
		);
		writeFileSync(
			join(templateDir, '.env.example'),
			'DB_HOST=localhost\nAUTH_SECRET=newcms-dev-secret-change-in-production\n',
		);
		writeFileSync(join(templateDir, 'AGENTS.md'), '# Agent instructions\n');
		writeFileSync(join(templateDir, 'packages', 'create-newcms', 'package.json'), '{}');
		const git = (...args: string[]) =>
			execFileSync('git', args, {
				cwd: templateDir,
				env: {
					...process.env,
					GIT_AUTHOR_NAME: 'test',
					GIT_AUTHOR_EMAIL: 'test@example.com',
					GIT_COMMITTER_NAME: 'test',
					GIT_COMMITTER_EMAIL: 'test@example.com',
				},
			});
		git('init', '-b', 'main');
		git('add', '-A');
		git('commit', '-m', 'fixture');
	});

	afterAll(() => {
		rmSync(workDir, { recursive: true, force: true });
	});

	it('clones, renames, generates .env and drops the scaffolder', () => {
		const target = join(workDir, 'my-site');
		scaffold({ targetDir: target, projectName: 'my-site', templateRepo: templateDir });

		const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf-8'));
		expect(pkg.name).toBe('my-site');

		const env = readFileSync(join(target, '.env'), 'utf-8');
		expect(env).toMatch(/^AUTH_SECRET=[0-9a-f]{64}$/m);
		expect(env).not.toContain('newcms-dev-secret-change-in-production');

		expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
		expect(existsSync(join(target, 'packages', 'create-newcms'))).toBe(false);
		// Fresh git history, detached from the template
		expect(existsSync(join(target, '.git'))).toBe(true);
	});

	it('refuses a non-empty target directory', () => {
		const target = join(workDir, 'occupied');
		mkdirSync(target, { recursive: true });
		writeFileSync(join(target, 'file.txt'), 'hi');
		expect(() =>
			scaffold({ targetDir: target, projectName: 'occupied', templateRepo: templateDir }),
		).toThrow(/not empty/);
	});

	it('rejects an invalid project name before touching the disk', () => {
		expect(() =>
			scaffold({
				targetDir: join(workDir, 'X'),
				projectName: 'Bad Name',
				templateRepo: templateDir,
			}),
		).toThrow(/lowercase/);
	});
});
