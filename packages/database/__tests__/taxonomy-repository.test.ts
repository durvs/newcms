import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { createConnection, type Database } from '../src/connection.js';
import { TaxonomyRepository } from '../src/repositories/taxonomy-repository.js';
import { PostRepository } from '../src/repositories/post-repository.js';
import { terms, termTaxonomy, termRelationships } from '../src/schema/index.js';
import type postgres from 'postgres';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

describe('TaxonomyRepository', () => {
	let db: Database;
	let client: ReturnType<typeof postgres>;
	let taxRepo: TaxonomyRepository;
	let postRepo: PostRepository;

	beforeAll(async () => {
		const conn = createConnection();
		db = conn.db;
		client = conn.client;
		taxRepo = new TaxonomyRepository(db);
		postRepo = new PostRepository(db);
	});

	afterAll(async () => {
		await client.end();
	});

	beforeEach(async () => {
		// Clean test terms (keep seed data "Uncategorized")
		const testTerms = await db
			.select({ termId: terms.termId })
			.from(terms)
			.where(eq(terms.name, '__test_term__'));
		for (const t of testTerms) {
			// Get term_taxonomy_ids for this term
			const ttRows = await db
				.select({ termTaxonomyId: termTaxonomy.termTaxonomyId })
				.from(termTaxonomy)
				.where(eq(termTaxonomy.termId, t.termId));
			for (const tt of ttRows) {
				await db.delete(termRelationships).where(
					eq(termRelationships.termTaxonomyId, tt.termTaxonomyId),
				);
			}
			await db.delete(termTaxonomy).where(eq(termTaxonomy.termId, t.termId));
			await db.delete(terms).where(eq(terms.termId, t.termId));
		}
		// Also clean __qe_test_tag__ from query engine tests
		const qeTerms = await db
			.select({ termId: terms.termId })
			.from(terms)
			.where(eq(terms.name, '__qe_test_tag__'));
		for (const t of qeTerms) {
			const ttRows = await db
				.select({ termTaxonomyId: termTaxonomy.termTaxonomyId })
				.from(termTaxonomy)
				.where(eq(termTaxonomy.termId, t.termId));
			for (const tt of ttRows) {
				await db.delete(termRelationships).where(
					eq(termRelationships.termTaxonomyId, tt.termTaxonomyId),
				);
			}
			await db.delete(termTaxonomy).where(eq(termTaxonomy.termId, t.termId));
			await db.delete(terms).where(eq(terms.termId, t.termId));
		}
	});

	describe('createTerm', () => {
		it('should create a term in a taxonomy', async () => {
			const term = await taxRepo.createTerm({
				name: '__test_term__',
				taxonomy: 'category',
			});

			expect(term.termId).toBeGreaterThan(0);
			expect(term.name).toBe('__test_term__');
			expect(term.taxonomy).toBe('category');
			expect(term.slug).toBe('__test_term__');
			expect(term.count).toBe(0);
		});

		it('should generate unique slug', async () => {
			const t1 = await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'category' });
			const t2 = await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'post_tag' });

			expect(t1.slug).toBe('__test_term__');
			expect(t2.slug).toBe('__test_term__-2');
		});
	});

	describe('getTermById / getTermBySlug / getTerms', () => {
		it('should get term by ID', async () => {
			const created = await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'category' });
			const found = await taxRepo.getTermById(created.termId, 'category');
			expect(found?.name).toBe('__test_term__');
		});

		it('should get term by slug', async () => {
			await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'category' });
			const found = await taxRepo.getTermBySlug('__test_term__', 'category');
			expect(found?.name).toBe('__test_term__');
		});

		it('should list terms in a taxonomy', async () => {
			await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'post_tag' });
			const allTags = await taxRepo.getTerms('post_tag');
			expect(allTags.some((t) => t.name === '__test_term__')).toBe(true);
		});
	});

	describe('setObjectTerms / getObjectTerms', () => {
		it('should assign terms to a post and retrieve them', async () => {
			const post = await postRepo.create({ postAuthor: 1, postTitle: '__test__' });
			const term = await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'post_tag' });

			await taxRepo.setObjectTerms(post.id, [term.termTaxonomyId]);
			const objectTerms = await taxRepo.getObjectTerms(post.id, 'post_tag');

			expect(objectTerms).toHaveLength(1);
			expect(objectTerms[0].name).toBe('__test_term__');
		});

		it('should update term count after assignment', async () => {
			const post = await postRepo.create({ postAuthor: 1, postTitle: '__test__' });
			const term = await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'post_tag' });

			await taxRepo.setObjectTerms(post.id, [term.termTaxonomyId]);

			const refreshed = await taxRepo.getTermById(term.termId, 'post_tag');
			expect(refreshed?.count).toBe(1);
		});
	});

	describe('deleteTerm', () => {
		it('should delete a term and its relationships', async () => {
			const term = await taxRepo.createTerm({ name: '__test_term__', taxonomy: 'post_tag' });
			const deleted = await taxRepo.deleteTerm(term.termId, 'post_tag');
			expect(deleted).toBe(true);

			const found = await taxRepo.getTermById(term.termId, 'post_tag');
			expect(found).toBeUndefined();
		});
	});
});
