import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createConnection, type Database } from '../src/connection.js';
import { ObjectCache } from '../src/cache/object-cache.js';
import { OptionsRepository } from '../src/repositories/options-repository.js';
import { options } from '../src/schema/options.js';
import type postgres from 'postgres';

import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

describe('OptionsRepository', () => {
	let db: Database;
	let client: ReturnType<typeof postgres>;
	let cache: ObjectCache;
	let repo: OptionsRepository;

	beforeAll(async () => {
		const conn = createConnection();
		db = conn.db;
		client = conn.client;

		cache = new ObjectCache({
			host: process.env['REDIS_HOST'] ?? 'localhost',
			port: parseInt(process.env['REDIS_PORT'] ?? '6380', 10),
			keyPrefix: 'test_options',
		});
		await cache.connect();

		repo = new OptionsRepository(db, cache);
	});

	afterAll(async () => {
		await cache.flushAll();
		await cache.disconnect();
		await client.end();
	});

	beforeEach(async () => {
		// Clean options table of test data (keep seed data)
		await db.delete(options).where(eq(options.optionName, 'test_option'));
		await db.delete(options).where(eq(options.optionName, 'test_option_2'));
		await db.delete(options).where(eq(options.optionName, 'test_complex'));
		await db.delete(options).where(eq(options.optionName, 'test_delete'));
		await db.delete(options).where(eq(options.optionName, 'test_no_autoload'));
		await cache.flushAll();
		cache.clearLocalCache();
	});

	// ─── getOption ───────────────────────────────────────────────

	describe('getOption', () => {
		it('should return an existing option from database', async () => {
			// blogname was created by seed
			const result = await repo.getOption('blogname');
			expect(result).toBe('My CMS Site');
		});

		it('should return from cache on second read', async () => {
			await repo.getOption('blogname'); // Populates cache
			// This should come from cache
			const result = await repo.getOption('blogname');
			expect(result).toBe('My CMS Site');
		});

		it('should return default value for non-existent option', async () => {
			const result = await repo.getOption('nonexistent', 'fallback');
			expect(result).toBe('fallback');
		});

		it('should return undefined when no default for non-existent option', async () => {
			const result = await repo.getOption('nonexistent');
			expect(result).toBeUndefined();
		});

		it('should cache "not found" to avoid repeated DB queries', async () => {
			await repo.getOption('ghost_option');
			// Second call should hit "not found" cache instead of DB
			const result = await repo.getOption('ghost_option', 'default');
			expect(result).toBe('default');
		});
	});

	// ─── addOption ───────────────────────────────────────────────

	describe('addOption', () => {
		it('should create a new option', async () => {
			const added = await repo.addOption('test_option', 'test_value');
			expect(added).toBe(true);

			const result = await repo.getOption('test_option');
			expect(result).toBe('test_value');
		});

		it('should fail if option already exists', async () => {
			await repo.addOption('test_option', 'first');
			const added = await repo.addOption('test_option', 'second');
			expect(added).toBe(false);

			const result = await repo.getOption('test_option');
			expect(result).toBe('first');
		});

		it('should store complex values as JSONB', async () => {
			const complex = { theme: 'default', colors: ['red', 'blue'], nested: { a: 1 } };
			await repo.addOption('test_complex', complex);

			cache.clearLocalCache();
			const result = await repo.getOption('test_complex');
			expect(result).toEqual(complex);
		});

		it('should clear "not found" cache on add', async () => {
			// Populate "not found" cache
			await repo.getOption('test_option');
			expect(await repo.getOption('test_option')).toBeUndefined();

			// Add the option
			await repo.addOption('test_option', 'now_exists');

			// Should now return the value
			const result = await repo.getOption('test_option');
			expect(result).toBe('now_exists');
		});
	});

	// ─── updateOption ────────────────────────────────────────────

	describe('updateOption', () => {
		it('should update an existing option', async () => {
			await repo.addOption('test_option', 'old_value');
			const updated = await repo.updateOption('test_option', 'new_value');
			expect(updated).toBe(true);

			cache.clearLocalCache();
			const result = await repo.getOption('test_option');
			expect(result).toBe('new_value');
		});

		it('should create option if it does not exist (upsert)', async () => {
			const updated = await repo.updateOption('test_option', 'created_via_update');
			expect(updated).toBe(true);

			const result = await repo.getOption('test_option');
			expect(result).toBe('created_via_update');
		});

		it('should return false if value did not change', async () => {
			await repo.addOption('test_option', 'same');
			cache.clearLocalCache();
			const updated = await repo.updateOption('test_option', 'same');
			expect(updated).toBe(false);
		});

		it('should update autoload flag', async () => {
			await repo.addOption('test_option', 'value', true);
			await repo.updateOption('test_option', 'value', false);

			const rows = await db.select().from(options).where(eq(options.optionName, 'test_option'));

			expect(rows[0].autoload).toBe(false);
		});
	});

	// ─── deleteOption ────────────────────────────────────────────

	describe('deleteOption', () => {
		it('should delete an existing option', async () => {
			await repo.addOption('test_delete', 'value');
			const deleted = await repo.deleteOption('test_delete');
			expect(deleted).toBe(true);

			cache.clearLocalCache();
			const result = await repo.getOption('test_delete');
			expect(result).toBeUndefined();
		});

		it('should return false for non-existent option', async () => {
			const deleted = await repo.deleteOption('nonexistent_delete');
			expect(deleted).toBe(false);
		});
	});

	// ─── loadAutoloadedOptions ───────────────────────────────────

	describe('loadAutoloadedOptions', () => {
		it('should load all autoloaded options into cache', async () => {
			const loaded = await repo.loadAutoloadedOptions();

			// Should contain seed options
			expect(loaded.get('blogname')).toBe('My CMS Site');
			expect(loaded.get('blogdescription')).toBe('Just another CMS site');
			// Numeric strings get parsed by JSON.parse — this is expected
			expect(loaded.get('posts_per_page')).toBe(10);
		});

		it('should NOT include non-autoloaded options', async () => {
			await repo.addOption('test_no_autoload', 'hidden', false);
			const loaded = await repo.loadAutoloadedOptions();
			expect(loaded.has('test_no_autoload')).toBe(false);
		});

		it('should use cached autoload map on second call', async () => {
			await repo.loadAutoloadedOptions();
			// Second call should use the cached map
			const loaded = await repo.loadAutoloadedOptions();
			expect(loaded.get('blogname')).toBe('My CMS Site');
		});
	});
});
