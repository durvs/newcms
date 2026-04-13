import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createConnection, type Database } from '../src/connection.js';
import { PostRepository } from '../src/repositories/post-repository.js';
import { posts, postmeta } from '../src/schema/index.js';
import type postgres from 'postgres';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

describe('PostRepository', () => {
	let db: Database;
	let client: ReturnType<typeof postgres>;
	let repo: PostRepository;

	beforeAll(async () => {
		const conn = createConnection();
		db = conn.db;
		client = conn.client;
		repo = new PostRepository(db);
	});

	afterAll(async () => {
		await client.end();
	});

	beforeEach(async () => {
		// Clean test posts (keep seed data by filtering on specific titles)
		await db.delete(posts).where(eq(posts.postTitle, '__test__'));
		await db.delete(posts).where(eq(posts.postTitle, '__test_update__'));
		await db.delete(posts).where(eq(posts.postTitle, '__test_trash__'));
		await db.delete(posts).where(eq(posts.postTitle, '__test_sticky__'));
		await db.delete(posts).where(eq(posts.postTitle, '__test_dup__'));
	});

	describe('create', () => {
		it('should create a post and return it', async () => {
			const post = await repo.create({
				postAuthor: 1,
				postTitle: '__test__',
				postContent: '<p>Hello</p>',
				postStatus: 'publish',
			});

			expect(post.id).toBeGreaterThan(0);
			expect(post.postTitle).toBe('__test__');
			expect(post.postStatus).toBe('publish');
			expect(post.postType).toBe('post');
			expect(post.postName).toBeTruthy();
		});

		it('should generate a unique slug', async () => {
			const p1 = await repo.create({ postAuthor: 1, postTitle: '__test_dup__' });
			const p2 = await repo.create({ postAuthor: 1, postTitle: '__test_dup__' });

			expect(p1.postName).toBe('__test_dup__');
			expect(p2.postName).toBe('__test_dup__-2');
		});

		it('should default to draft status', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			expect(post.postStatus).toBe('draft');
		});
	});

	describe('getById / getBySlug', () => {
		it('should get a post by ID', async () => {
			const created = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			const found = await repo.getById(created.id);
			expect(found?.id).toBe(created.id);
		});

		it('should return undefined for non-existent ID', async () => {
			const found = await repo.getById(999999);
			expect(found).toBeUndefined();
		});

		it('should get a post by slug', async () => {
			await repo.create({ postAuthor: 1, postTitle: '__test__', postStatus: 'publish' });
			const found = await repo.getBySlug('__test__', 'post');
			expect(found?.postTitle).toBe('__test__');
		});
	});

	describe('update', () => {
		it('should update post fields', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			const updated = await repo.update(post.id, {
				postTitle: '__test_update__',
				postStatus: 'publish',
			});

			expect(updated?.postTitle).toBe('__test_update__');
			expect(updated?.postStatus).toBe('publish');
			expect(updated!.postModified.getTime()).toBeGreaterThanOrEqual(
				post.postModified.getTime(),
			);
		});

		it('should return undefined for non-existent post', async () => {
			const result = await repo.update(999999, { postTitle: 'nope' });
			expect(result).toBeUndefined();
		});
	});

	describe('trash / untrash / deletePermanently', () => {
		it('should trash a post (preserving original status)', async () => {
			const post = await repo.create({
				postAuthor: 1,
				postTitle: '__test_trash__',
				postStatus: 'publish',
			});

			const trashed = await repo.trash(post.id);
			expect(trashed?.postStatus).toBe('trash');

			const savedStatus = await repo.meta.get<string>(post.id, '_trash_meta_status');
			expect(savedStatus).toBe('publish');
		});

		it('should untrash restoring original status', async () => {
			const post = await repo.create({
				postAuthor: 1,
				postTitle: '__test_trash__',
				postStatus: 'publish',
			});
			await repo.trash(post.id);
			const restored = await repo.untrash(post.id);
			expect(restored?.postStatus).toBe('publish');
		});

		it('should permanently delete a post', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			const deleted = await repo.deletePermanently(post.id);
			expect(deleted).toBe(true);
			expect(await repo.getById(post.id)).toBeUndefined();
		});
	});

	describe('sticky', () => {
		it('should set and check sticky', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test_sticky__' });
			await repo.setSticky(post.id, true);
			expect(await repo.isSticky(post.id)).toBe(true);

			const stickyIds = await repo.getStickyIds();
			expect(stickyIds).toContain(post.id);
		});

		it('should unset sticky', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test_sticky__' });
			await repo.setSticky(post.id, true);
			await repo.setSticky(post.id, false);
			expect(await repo.isSticky(post.id)).toBe(false);
		});
	});

	describe('meta (via PostRepository)', () => {
		it('should add and read post meta', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			await repo.meta.add(post.id, 'color', 'blue');
			const value = await repo.meta.get<string>(post.id, 'color');
			expect(value).toBe('blue');
		});

		it('should store complex meta as JSONB', async () => {
			const post = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			const complex = { dimensions: { width: 100, height: 200 } };
			await repo.meta.add(post.id, 'image_data', complex);
			const value = await repo.meta.get(post.id, 'image_data');
			expect(value).toEqual(complex);
		});

		it('should batch load meta for multiple posts', async () => {
			const p1 = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			const p2 = await repo.create({ postAuthor: 1, postTitle: '__test__' });
			await repo.meta.add(p1.id, 'key1', 'val1');
			await repo.meta.add(p2.id, 'key2', 'val2');

			const batch = await repo.meta.batchLoad([p1.id, p2.id]);
			expect(batch.get(p1.id)?.get('key1')?.[0]).toBe('val1');
			expect(batch.get(p2.id)?.get('key2')?.[0]).toBe('val2');
		});
	});

	describe('countByStatus', () => {
		it('should count posts by status', async () => {
			await repo.create({
				postAuthor: 1,
				postTitle: '__test__',
				postStatus: 'publish',
			});
			const counts = await repo.countByStatus('post');
			expect(counts['publish']).toBeGreaterThanOrEqual(1);
		});
	});
});
