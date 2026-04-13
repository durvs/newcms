import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HookEngine } from '../src/hook-engine.js';
import { BootstrapManager, BOOTSTRAP_PHASES } from '../src/bootstrap.js';

describe('BootstrapManager', () => {
	let hooks: HookEngine;
	let bootstrap: BootstrapManager;

	beforeEach(() => {
		hooks = new HookEngine();
		bootstrap = new BootstrapManager(hooks);
	});

	it('should define exactly 17 phases', () => {
		expect(BOOTSTRAP_PHASES).toHaveLength(17);
	});

	it('should execute all phases in order', async () => {
		const order: string[] = [];

		bootstrap.on('configuration', () => order.push('config'));
		bootstrap.on('database_connect', () => order.push('db'));
		bootstrap.on('init', () => order.push('init'));
		bootstrap.on('system_loaded', () => order.push('loaded'));

		await bootstrap.run();

		expect(order).toEqual(['config', 'db', 'init', 'loaded']);
		expect(bootstrap.getCompletedPhases()).toHaveLength(17);
	});

	it('should fire hooks for each phase', async () => {
		const hookCalls: string[] = [];

		hooks.addAction('bootstrap:configuration', () => {
			hookCalls.push('bootstrap:configuration');
		});
		hooks.addAction('bootstrap:init', () => {
			hookCalls.push('bootstrap:init');
		});
		hooks.addAction('cms_loaded', () => {
			hookCalls.push('cms_loaded');
		});

		await bootstrap.run();

		expect(hookCalls).toContain('bootstrap:configuration');
		expect(hookCalls).toContain('bootstrap:init');
		expect(hookCalls).toContain('cms_loaded');
	});

	it('should support short-init (stop early)', async () => {
		const order: string[] = [];

		bootstrap.on('configuration', () => order.push('config'));
		bootstrap.on('database_connect', () => order.push('db'));
		bootstrap.on('init', () => order.push('init'));

		await bootstrap.run('database_connect');

		expect(order).toEqual(['config', 'db']);
		expect(bootstrap.isPhaseComplete('configuration')).toBe(true);
		expect(bootstrap.isPhaseComplete('database_connect')).toBe(true);
		expect(bootstrap.isPhaseComplete('init')).toBe(false);
	});

	it('should track current phase during execution', async () => {
		let capturedPhase: string | null = null;

		bootstrap.on('object_cache', () => {
			capturedPhase = bootstrap.getCurrentPhase();
		});

		await bootstrap.run();

		expect(capturedPhase).toBe('object_cache');
		expect(bootstrap.getCurrentPhase()).toBeNull();
	});

	it('should allow multiple handlers per phase', async () => {
		const order: number[] = [];

		bootstrap.on('init', () => order.push(1));
		bootstrap.on('init', () => order.push(2));
		bootstrap.on('init', () => order.push(3));

		await bootstrap.run();

		expect(order).toEqual([1, 2, 3]);
	});

	it('should run handlers before hooks for each phase', async () => {
		const order: string[] = [];

		bootstrap.on('init', () => order.push('handler'));
		hooks.addAction('bootstrap:init', () => order.push('hook'));

		await bootstrap.run();

		expect(order).toEqual(['handler', 'hook']);
	});
});
