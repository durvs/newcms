import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionRegistry, type ExtensionManifest } from '../src/extension-registry.js';

const makeManifest = (slug: string, deps?: string[]): ExtensionManifest => ({
	slug,
	name: slug,
	version: '1.0.0',
	dependencies: deps,
});

describe('ExtensionRegistry', () => {
	let registry: ExtensionRegistry;

	beforeEach(() => {
		registry = new ExtensionRegistry();
	});

	describe('register / get / has', () => {
		it('should register and retrieve an extension', () => {
			registry.register(makeManifest('hello'), '/ext/hello', 'inactive');
			expect(registry.has('hello')).toBe(true);
			expect(registry.get('hello')?.manifest.slug).toBe('hello');
			expect(registry.get('hello')?.status).toBe('inactive');
		});

		it('should return undefined for non-existent extension', () => {
			expect(registry.get('nonexistent')).toBeUndefined();
		});
	});

	describe('activate / deactivate', () => {
		it('should activate an extension', () => {
			registry.register(makeManifest('hello'), '/ext/hello', 'inactive');
			registry.activate('hello');
			expect(registry.get('hello')?.status).toBe('active');
			expect(registry.getActive()).toHaveLength(1);
		});

		it('should deactivate an extension', () => {
			registry.register(makeManifest('hello'), '/ext/hello', 'active');
			registry.deactivate('hello');
			expect(registry.get('hello')?.status).toBe('inactive');
		});

		it('should throw when activating with unmet dependencies', () => {
			registry.register(makeManifest('child', ['parent']), '/ext/child', 'inactive');
			expect(() => registry.activate('child')).toThrow('missing dependencies: parent');
		});

		it('should activate when dependencies are met', () => {
			registry.register(makeManifest('parent'), '/ext/parent', 'active');
			registry.register(makeManifest('child', ['parent']), '/ext/child', 'inactive');
			registry.activate('child');
			expect(registry.get('child')?.status).toBe('active');
		});

		it('should throw when deactivating if other extensions depend on it', () => {
			registry.register(makeManifest('parent'), '/ext/parent', 'active');
			registry.register(makeManifest('child', ['parent']), '/ext/child', 'active');
			expect(() => registry.deactivate('parent')).toThrow('required by: child');
		});

		it('should not deactivate must-use extensions', () => {
			registry.register(makeManifest('core'), '/ext/core', 'must-use');
			expect(() => registry.deactivate('core')).toThrow('must-use');
		});
	});

	describe('pause / unpause (recovery mode)', () => {
		it('should pause an extension with reason', () => {
			registry.register(makeManifest('broken'), '/ext/broken', 'active');
			registry.pause('broken', 'Fatal error in init');
			expect(registry.get('broken')?.status).toBe('paused');
			expect(registry.get('broken')?.pauseReason).toBe('Fatal error in init');
			expect(registry.getPaused()).toHaveLength(1);
		});

		it('should unpause an extension', () => {
			registry.register(makeManifest('broken'), '/ext/broken', 'active');
			registry.pause('broken', 'Error');
			registry.unpause('broken');
			expect(registry.get('broken')?.status).toBe('active');
			expect(registry.get('broken')?.pauseReason).toBeUndefined();
		});
	});

	describe('circular dependency detection', () => {
		it('should detect direct circular dependency', () => {
			registry.register(makeManifest('a', ['b']), '/ext/a', 'inactive');
			registry.register(makeManifest('b', ['a']), '/ext/b', 'inactive');
			expect(registry.hasCircularDependency('a')).toBe(true);
		});

		it('should detect indirect circular dependency', () => {
			registry.register(makeManifest('a', ['b']), '/ext/a', 'inactive');
			registry.register(makeManifest('b', ['c']), '/ext/b', 'inactive');
			registry.register(makeManifest('c', ['a']), '/ext/c', 'inactive');
			expect(registry.hasCircularDependency('a')).toBe(true);
		});

		it('should not flag non-circular chains', () => {
			registry.register(makeManifest('a', ['b']), '/ext/a', 'inactive');
			registry.register(makeManifest('b', ['c']), '/ext/b', 'inactive');
			registry.register(makeManifest('c'), '/ext/c', 'inactive');
			expect(registry.hasCircularDependency('a')).toBe(false);
		});
	});

	describe('getByStatus / getMustUse', () => {
		it('should filter by status', () => {
			registry.register(makeManifest('a'), '/ext/a', 'active');
			registry.register(makeManifest('b'), '/ext/b', 'inactive');
			registry.register(makeManifest('c'), '/ext/c', 'must-use');

			expect(registry.getActive()).toHaveLength(1);
			expect(registry.getByStatus('inactive')).toHaveLength(1);
			expect(registry.getMustUse()).toHaveLength(1);
			expect(registry.getAll()).toHaveLength(3);
		});
	});
});
