import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createConnection, type Database } from '../src/connection.js';
import { PostRepository } from '../src/repositories/post-repository.js';
import { RevisionRepository } from '../src/repositories/revision-repository.js';
import type postgres from 'postgres';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

describe('RevisionRepository', () => {
	let db: Database;
	let client: ReturnType<typeof postgres>;
	let postRepo: PostRepository;
	let revisionRepo: RevisionRepository;

	beforeAll(async () => {
		const conn = createConnection();
		db = conn.db;
		client = conn.client;
		postRepo = new PostRepository(db);
		revisionRepo = new RevisionRepository(db);
	});

	afterAll(async () => {
		await client.end();
	});

	it('should create a revision on first save', async () => {
		const post = await postRepo.create({
			postAuthor: 1,
			postTitle: '__test_rev__',
			postContent: 'v1',
		});

		const revision = await revisionRepo.createRevision(post, 1);
		expect(revision).toBeDefined();
		expect(revision!.postType).toBe('revision');
		expect(revision!.postParent).toBe(post.id);
		expect(revision!.postContent).toBe('v1');
	});

	it('should NOT create revision if nothing changed', async () => {
		const post = await postRepo.create({
			postAuthor: 1,
			postTitle: '__test_rev__',
			postContent: 'same',
		});

		await revisionRepo.createRevision(post, 1);
		// Call again with same content
		const dup = await revisionRepo.createRevision(post, 1);
		expect(dup).toBeUndefined();
	});

	it('should create revision when content changes', async () => {
		const post = await postRepo.create({
			postAuthor: 1,
			postTitle: '__test_rev__',
			postContent: 'v1',
		});
		await revisionRepo.createRevision(post, 1);

		const updated = await postRepo.update(post.id, { postContent: 'v2' });
		const rev2 = await revisionRepo.createRevision(updated!, 1);
		expect(rev2).toBeDefined();
		expect(rev2!.postContent).toBe('v2');
	});

	it('should list revisions newest first', async () => {
		const post = await postRepo.create({
			postAuthor: 1,
			postTitle: '__test_rev__',
			postContent: 'v1',
		});
		await revisionRepo.createRevision(post, 1);

		const u2 = await postRepo.update(post.id, { postContent: 'v2' });
		await revisionRepo.createRevision(u2!, 1);

		const u3 = await postRepo.update(post.id, { postContent: 'v3' });
		await revisionRepo.createRevision(u3!, 1);

		const revisions = await revisionRepo.getRevisions(post.id);
		expect(revisions.length).toBe(3);
		expect(revisions[0].postContent).toBe('v3');
		expect(revisions[2].postContent).toBe('v1');
	});

	it('should restore a post from a revision', async () => {
		const post = await postRepo.create({
			postAuthor: 1,
			postTitle: '__test_rev__',
			postContent: 'original',
		});
		const rev = await revisionRepo.createRevision(post, 1);

		await postRepo.update(post.id, { postContent: 'changed' });

		const restored = await revisionRepo.restore(post.id, rev!.id);
		expect(restored?.postContent).toBe('original');
	});

	it('should cleanup old revisions', async () => {
		const post = await postRepo.create({
			postAuthor: 1,
			postTitle: '__test_rev__',
			postContent: 'v1',
		});

		for (let i = 1; i <= 5; i++) {
			const updated = await postRepo.update(post.id, { postContent: `v${i}` });
			await revisionRepo.createRevision(updated!, 1);
		}

		const deleted = await revisionRepo.cleanup(post.id, 2);
		expect(deleted).toBe(3); // keep 2, delete 3

		const remaining = await revisionRepo.count(post.id);
		expect(remaining).toBe(2);
	});
});
