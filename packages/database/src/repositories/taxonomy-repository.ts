import { eq, and, sql, inArray } from 'drizzle-orm';
import type { Database } from '../connection';
import { terms, termTaxonomy, termRelationships, termmeta } from '../schema/index';
import { MetaRepository, type MetaTableColumns, type MetaColumnNames } from './meta-repository';

export interface CreateTermInput {
	name: string;
	slug?: string;
	taxonomy: string;
	description?: string;
	parent?: number;
}

export interface TermRow {
	termId: number;
	name: string;
	slug: string;
	termGroup: number;
	termTaxonomyId: number;
	taxonomy: string;
	description: string;
	parent: number;
	count: number;
}

/**
 * Repository for taxonomy terms (categories, tags, custom taxonomies).
 */
export class TaxonomyRepository {
	readonly meta: MetaRepository;

	constructor(private db: Database) {
		const metaCols: MetaTableColumns = {
			metaId: termmeta.metaId,
			objectId: termmeta.termId,
			metaKey: termmeta.metaKey,
			metaValue: termmeta.metaValue,
			metaValueJson: termmeta.metaValueJson,
		};
		const colNames: MetaColumnNames = {
			table: 'termmeta',
			sql: {
				metaId: 'meta_id',
				objectId: 'term_id',
				metaKey: 'meta_key',
				metaValue: 'meta_value',
				metaValueJson: 'meta_value_json',
			},
			ts: {
				metaId: 'metaId',
				objectId: 'termId',
				metaKey: 'metaKey',
				metaValue: 'metaValue',
				metaValueJson: 'metaValueJson',
			},
		};
		this.meta = new MetaRepository(db, termmeta, metaCols, colNames);
	}

	/**
	 * Create a new term in a taxonomy.
	 */
	async createTerm(input: CreateTermInput): Promise<TermRow> {
		const slug = input.slug || this.generateSlug(input.name);
		const uniqueSlug = await this.ensureUniqueSlug(slug);

		const [term] = await this.db
			.insert(terms)
			.values({
				name: input.name,
				slug: uniqueSlug,
			})
			.returning();

		const [tt] = await this.db
			.insert(termTaxonomy)
			.values({
				termId: term.termId,
				taxonomy: input.taxonomy,
				description: input.description ?? '',
				parent: input.parent ?? 0,
				count: 0,
			})
			.returning();

		return {
			termId: term.termId,
			name: term.name,
			slug: term.slug,
			termGroup: term.termGroup,
			termTaxonomyId: tt.termTaxonomyId,
			taxonomy: tt.taxonomy,
			description: tt.description,
			parent: tt.parent,
			count: tt.count,
		};
	}

	/**
	 * Get a term by ID and taxonomy.
	 */
	async getTermById(termId: number, taxonomy: string): Promise<TermRow | undefined> {
		const rows = await this.db
			.select({
				termId: terms.termId,
				name: terms.name,
				slug: terms.slug,
				termGroup: terms.termGroup,
				termTaxonomyId: termTaxonomy.termTaxonomyId,
				taxonomy: termTaxonomy.taxonomy,
				description: termTaxonomy.description,
				parent: termTaxonomy.parent,
				count: termTaxonomy.count,
			})
			.from(terms)
			.innerJoin(termTaxonomy, eq(terms.termId, termTaxonomy.termId))
			.where(and(eq(terms.termId, termId), eq(termTaxonomy.taxonomy, taxonomy)))
			.limit(1);

		return rows[0] as TermRow | undefined;
	}

	/**
	 * Get a term by slug and taxonomy.
	 */
	async getTermBySlug(slug: string, taxonomy: string): Promise<TermRow | undefined> {
		const rows = await this.db
			.select({
				termId: terms.termId,
				name: terms.name,
				slug: terms.slug,
				termGroup: terms.termGroup,
				termTaxonomyId: termTaxonomy.termTaxonomyId,
				taxonomy: termTaxonomy.taxonomy,
				description: termTaxonomy.description,
				parent: termTaxonomy.parent,
				count: termTaxonomy.count,
			})
			.from(terms)
			.innerJoin(termTaxonomy, eq(terms.termId, termTaxonomy.termId))
			.where(and(eq(terms.slug, slug), eq(termTaxonomy.taxonomy, taxonomy)))
			.limit(1);

		return rows[0] as TermRow | undefined;
	}

	/**
	 * Get all terms in a taxonomy.
	 */
	async getTerms(taxonomy: string, parentId?: number): Promise<TermRow[]> {
		const conditions = [eq(termTaxonomy.taxonomy, taxonomy)];
		if (parentId !== undefined) {
			conditions.push(eq(termTaxonomy.parent, parentId));
		}

		const rows = await this.db
			.select({
				termId: terms.termId,
				name: terms.name,
				slug: terms.slug,
				termGroup: terms.termGroup,
				termTaxonomyId: termTaxonomy.termTaxonomyId,
				taxonomy: termTaxonomy.taxonomy,
				description: termTaxonomy.description,
				parent: termTaxonomy.parent,
				count: termTaxonomy.count,
			})
			.from(terms)
			.innerJoin(termTaxonomy, eq(terms.termId, termTaxonomy.termId))
			.where(and(...conditions))
			.orderBy(terms.name);

		return rows as TermRow[];
	}

	/**
	 * Assign terms to an object (post).
	 */
	async setObjectTerms(objectId: number, termTaxonomyIds: number[]): Promise<void> {
		// Remove existing relationships for these taxonomies
		const existingTtIds =
			termTaxonomyIds.length > 0
				? await this.db
						.select({ taxonomy: termTaxonomy.taxonomy })
						.from(termTaxonomy)
						.where(inArray(termTaxonomy.termTaxonomyId, termTaxonomyIds))
				: [];

		const taxonomies = [...new Set(existingTtIds.map((r) => r.taxonomy))];

		if (taxonomies.length > 0) {
			// Get all term_taxonomy_ids for these taxonomies
			const allTtIds = await this.db
				.select({ termTaxonomyId: termTaxonomy.termTaxonomyId })
				.from(termTaxonomy)
				.where(inArray(termTaxonomy.taxonomy, taxonomies));

			const allTtIdValues = allTtIds.map((r) => r.termTaxonomyId);

			if (allTtIdValues.length > 0) {
				await this.db
					.delete(termRelationships)
					.where(
						and(
							eq(termRelationships.objectId, objectId),
							inArray(termRelationships.termTaxonomyId, allTtIdValues),
						),
					);
			}
		}

		// Insert new relationships
		if (termTaxonomyIds.length > 0) {
			await this.db
				.insert(termRelationships)
				.values(
					termTaxonomyIds.map((ttId, i) => ({
						objectId,
						termTaxonomyId: ttId,
						termOrder: i,
					})),
				)
				.onConflictDoNothing();
		}

		// Update counts
		await this.recountTerms(termTaxonomyIds);
	}

	/**
	 * Get terms assigned to an object.
	 */
	async getObjectTerms(objectId: number, taxonomy?: string): Promise<TermRow[]> {
		const conditions = [eq(termRelationships.objectId, objectId)];
		if (taxonomy) {
			conditions.push(eq(termTaxonomy.taxonomy, taxonomy));
		}

		const rows = await this.db
			.select({
				termId: terms.termId,
				name: terms.name,
				slug: terms.slug,
				termGroup: terms.termGroup,
				termTaxonomyId: termTaxonomy.termTaxonomyId,
				taxonomy: termTaxonomy.taxonomy,
				description: termTaxonomy.description,
				parent: termTaxonomy.parent,
				count: termTaxonomy.count,
			})
			.from(termRelationships)
			.innerJoin(termTaxonomy, eq(termRelationships.termTaxonomyId, termTaxonomy.termTaxonomyId))
			.innerJoin(terms, eq(termTaxonomy.termId, terms.termId))
			.where(and(...conditions))
			.orderBy(termRelationships.termOrder);

		return rows as TermRow[];
	}

	/**
	 * Delete a term and all its relationships.
	 */
	async deleteTerm(termId: number, taxonomy: string): Promise<boolean> {
		const term = await this.getTermById(termId, taxonomy);
		if (!term) return false;

		// Delete relationships
		await this.db
			.delete(termRelationships)
			.where(eq(termRelationships.termTaxonomyId, term.termTaxonomyId));

		// Delete term_taxonomy
		await this.db.delete(termTaxonomy).where(eq(termTaxonomy.termTaxonomyId, term.termTaxonomyId));

		// Delete term (if not used by another taxonomy)
		const otherUsages = await this.db
			.select({ termTaxonomyId: termTaxonomy.termTaxonomyId })
			.from(termTaxonomy)
			.where(eq(termTaxonomy.termId, termId))
			.limit(1);

		if (otherUsages.length === 0) {
			await this.db.delete(terms).where(eq(terms.termId, termId));
		}

		// Delete meta
		await this.meta.deleteAllForObject(termId);

		return true;
	}

	/**
	 * Recount the number of objects assigned to terms.
	 */
	async recountTerms(termTaxonomyIds: number[]): Promise<void> {
		for (const ttId of termTaxonomyIds) {
			const [result] = await this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(termRelationships)
				.where(eq(termRelationships.termTaxonomyId, ttId));

			await this.db
				.update(termTaxonomy)
				.set({ count: result.count })
				.where(eq(termTaxonomy.termTaxonomyId, ttId));
		}
	}

	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9_\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.substring(0, 200);
	}

	private async ensureUniqueSlug(slug: string, excludeId?: number): Promise<string> {
		let candidate = slug;
		let suffix = 2;

		while (true) {
			const conditions = [eq(terms.slug, candidate)];
			if (excludeId !== undefined) {
				conditions.push(sql`${terms.termId} != ${excludeId}`);
			}

			const existing = await this.db
				.select({ termId: terms.termId })
				.from(terms)
				.where(and(...conditions))
				.limit(1);

			if (existing.length === 0) return candidate;
			candidate = `${slug}-${suffix}`;
			suffix++;
		}
	}
}
