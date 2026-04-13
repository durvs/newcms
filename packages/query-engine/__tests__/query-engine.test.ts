import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { createConnection, type Database, posts } from '@newcms/database';
import { PostRepository, TaxonomyRepository } from '@newcms/database';
import { QueryEngine } from '../src/query-engine.js';
import type postgres from 'postgres';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

describe('QueryEngine', () => {
	let db: Database;
	let client: ReturnType<typeof postgres>;
	let postRepo: PostRepository;
	let taxRepo: TaxonomyRepository;
	let engine: QueryEngine;

	beforeAll(async () => {
		const conn = createConnection();
		db = conn.db;
		client = conn.client;
		postRepo = new PostRepository(db);
		taxRepo = new TaxonomyRepository(db);
		engine = new QueryEngine(db);
	});

	afterAll(async () => {
		await client.end();
	});

	describe('basic queries', () => {
		it('should return published posts', async () => {
			const result = await engine.query({ postType: 'post', postStatus: 'publish' });
			expect(result.posts.length).toBeGreaterThanOrEqual(1); // seed "Hello World"
			expect(result.total).toBeGreaterThanOrEqual(1);
			expect(result.flags.isHome).toBe(true);
		});

		it('should paginate results', async () => {
			const result = await engine.query({ perPage: 1, page: 1 });
			expect(result.posts.length).toBeLessThanOrEqual(1);
			expect(result.page).toBe(1);
			expect(result.perPage).toBe(1);
		});

		it('should filter by post type', async () => {
			const result = await engine.query({ postType: 'page', postStatus: 'publish' });
			for (const post of result.posts) {
				expect((post as { postType: string }).postType).toBe('page');
			}
		});

		it('should filter by slug', async () => {
			const result = await engine.query({ slug: 'hello-world', postStatus: 'publish' });
			expect(result.posts.length).toBe(1);
			expect(result.flags.isSingle).toBe(true);
		});

		it('should set is404 flag when no results', async () => {
			const result = await engine.query({ slug: 'does-not-exist-xyz' });
			expect(result.flags.is404).toBe(true);
		});

		it('should order by date descending by default', async () => {
			const result = await engine.query({ postStatus: 'publish', perPage: 10 });
			if (result.posts.length >= 2) {
				const dates = result.posts.map(
					(p) => (p as { postDate: Date }).postDate.getTime(),
				);
				expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
			}
		});

		it('should search by title/content', async () => {
			await postRepo.create({
				postAuthor: 1,
				postTitle: '__qe_searchable_test__',
				postContent: 'unique content for search',
				postStatus: 'publish',
			});

			const result = await engine.query({
				search: 'qe_searchable_test',
				postStatus: 'publish',
			});
			expect(result.posts.length).toBeGreaterThanOrEqual(1);
			expect(result.flags.isSearch).toBe(true);
		});
	});

	describe('date query', () => {
		it('should filter by year', async () => {
			const result = await engine.query({
				postStatus: 'publish',
				date: {
					clauses: [{ year: new Date().getFullYear() }],
				},
			});
			expect(result.flags.isDate).toBe(true);
		});
	});

	describe('meta query', () => {
		it('should filter by meta EXISTS', async () => {
			const post = await postRepo.create({
				postAuthor: 1,
				postTitle: '__test__',
				postStatus: 'publish',
			});
			await postRepo.meta.add(post.id, '_featured', '1');

			const result = await engine.query({
				postStatus: 'publish',
				meta: {
					clauses: [{ key: '_featured', compare: 'EXISTS' }],
				},
			});
			expect(result.posts.length).toBeGreaterThanOrEqual(1);
		});

		it('should filter by meta value', async () => {
			const post = await postRepo.create({
				postAuthor: 1,
				postTitle: '__test__',
				postStatus: 'publish',
			});
			await postRepo.meta.add(post.id, '_color', 'red');

			const result = await engine.query({
				postStatus: 'publish',
				meta: {
					clauses: [{ key: '_color', value: 'red', compare: '=' }],
				},
			});
			expect(result.posts.some((p) => (p as { id: number }).id === post.id)).toBe(true);
		});
	});

	describe('taxonomy query', () => {
		it('should filter by taxonomy term', async () => {
			const post = await postRepo.create({
				postAuthor: 1,
				postTitle: '__test__',
				postStatus: 'publish',
			});
			const term = await taxRepo.createTerm({
				name: '__qe_test_tag__',
				taxonomy: 'post_tag',
			});
			await taxRepo.setObjectTerms(post.id, [term.termTaxonomyId]);

			const result = await engine.query({
				postStatus: 'publish',
				tax: {
					clauses: [{ taxonomy: 'post_tag', termIds: [term.termId] }],
				},
			});
			expect(result.posts.some((p) => (p as { id: number }).id === post.id)).toBe(true);
			expect(result.flags.isTaxonomy).toBe(true);
		});
	});

	describe('query flags', () => {
		it('should set isPage for page queries', async () => {
			const result = await engine.query({ postType: 'page' });
			expect(result.flags.isPage).toBe(true);
		});

		it('should set isAuthor for author queries', async () => {
			const result = await engine.query({ author: 1 });
			expect(result.flags.isAuthor).toBe(true);
			expect(result.flags.isArchive).toBe(true);
		});
	});
});
