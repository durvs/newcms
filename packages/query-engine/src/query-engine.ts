import { eq, and, or, desc, asc, sql, inArray, like, gt, lt, notInArray } from 'drizzle-orm';
import { posts, postmeta, termRelationships, termTaxonomy, terms } from '@newcms/database';
import type { Database } from '@newcms/database';
import type { QueryParams, QueryResult, QueryFlags, TaxQuery, MetaQuery, DateQuery } from './types';

const DEFAULT_PER_PAGE = 10;

/**
 * Declarative query engine for content.
 *
 * Accepts a `QueryParams` object and builds a type-safe SQL query
 * via Drizzle ORM. Supports taxonomy sub-queries, meta sub-queries,
 * date filters, full-text search, and pagination.
 */
export class QueryEngine {
	constructor(private db: Database) {}

	/**
	 * Execute a content query.
	 */
	async query(params: QueryParams = {}): Promise<QueryResult> {
		const perPage = params.perPage === -1 ? 0 : (params.perPage ?? DEFAULT_PER_PAGE);
		const page = params.page ?? 1;
		const offset = perPage > 0 ? (page - 1) * perPage : 0;

		const conditions = this.buildConditions(params);
		const orderClause = this.buildOrderBy(params);

		// Count total
		const [countResult] = await this.db
			.select({ count: sql<number>`count(DISTINCT ${posts.id})::int` })
			.from(posts)
			.leftJoin(postmeta, this.needsMetaJoin(params) ? eq(posts.id, postmeta.postId) : sql`false`)
			.leftJoin(
				termRelationships,
				this.needsTaxJoin(params) ? eq(posts.id, termRelationships.objectId) : sql`false`,
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		const total = countResult.count;
		const totalPages = perPage > 0 ? Math.ceil(total / perPage) : total > 0 ? 1 : 0;

		// Fetch posts
		let query = this.db
			.selectDistinct({
				id: posts.id,
				postAuthor: posts.postAuthor,
				postDate: posts.postDate,
				postDateGmt: posts.postDateGmt,
				postContent: posts.postContent,
				postTitle: posts.postTitle,
				postExcerpt: posts.postExcerpt,
				postStatus: posts.postStatus,
				commentStatus: posts.commentStatus,
				pingStatus: posts.pingStatus,
				postPassword: posts.postPassword,
				postName: posts.postName,
				toPing: posts.toPing,
				pinged: posts.pinged,
				postModified: posts.postModified,
				postModifiedGmt: posts.postModifiedGmt,
				postContentFiltered: posts.postContentFiltered,
				postParent: posts.postParent,
				guid: posts.guid,
				menuOrder: posts.menuOrder,
				postType: posts.postType,
				postMimeType: posts.postMimeType,
				commentCount: posts.commentCount,
			})
			.from(posts)
			.leftJoin(postmeta, this.needsMetaJoin(params) ? eq(posts.id, postmeta.postId) : sql`false`)
			.leftJoin(
				termRelationships,
				this.needsTaxJoin(params) ? eq(posts.id, termRelationships.objectId) : sql`false`,
			)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(orderClause)
			.$dynamic();

		if (perPage > 0) {
			query = query.limit(perPage).offset(offset);
		}

		const rows = await query;

		const flags = this.buildFlags(params, rows.length, total);

		return {
			posts: rows,
			total,
			totalPages,
			page,
			perPage: perPage || total,
			flags,
		};
	}

	/**
	 * Shorthand: query a single post by ID.
	 */
	async querySingle(id: number, postType?: string): Promise<QueryResult> {
		return this.query({
			include: [id],
			postType: postType ?? 'post',
			postStatus: ['publish', 'private', 'draft'],
			perPage: 1,
		});
	}

	// ─── Private: condition builders ─────────────────────────────

	private buildConditions(params: QueryParams): ReturnType<typeof eq>[] {
		const conditions: ReturnType<typeof eq>[] = [];

		// Post type
		const postType = params.postType ?? 'post';
		if (Array.isArray(postType)) {
			conditions.push(inArray(posts.postType, postType));
		} else {
			conditions.push(eq(posts.postType, postType));
		}

		// Post status
		const status = params.postStatus ?? 'publish';
		if (Array.isArray(status)) {
			conditions.push(inArray(posts.postStatus, status));
		} else {
			conditions.push(eq(posts.postStatus, status));
		}

		// Author
		if (params.author !== undefined) {
			if (Array.isArray(params.author)) {
				conditions.push(inArray(posts.postAuthor, params.author));
			} else {
				conditions.push(eq(posts.postAuthor, params.author));
			}
		}

		// Include/exclude IDs
		if (params.include && params.include.length > 0) {
			conditions.push(inArray(posts.id, params.include));
		}
		if (params.exclude && params.exclude.length > 0) {
			conditions.push(notInArray(posts.id, params.exclude));
		}

		// Parent
		if (params.parent !== undefined) {
			conditions.push(eq(posts.postParent, params.parent));
		}

		// Slug
		if (params.slug !== undefined) {
			if (Array.isArray(params.slug)) {
				conditions.push(inArray(posts.postName, params.slug));
			} else {
				conditions.push(eq(posts.postName, params.slug));
			}
		}

		// Search (full-text)
		if (params.search) {
			const searchTerm = params.search.replace(/[^\w\s]/g, '').trim();
			if (searchTerm) {
				conditions.push(
					or(like(posts.postTitle, `%${searchTerm}%`), like(posts.postContent, `%${searchTerm}%`))!,
				);
			}
		}

		// Taxonomy sub-query
		if (params.tax) {
			const taxConditions = this.buildTaxConditions(params.tax);
			if (taxConditions) {
				conditions.push(taxConditions);
			}
		}

		// Meta sub-query
		if (params.meta) {
			const metaConditions = this.buildMetaConditions(params.meta);
			if (metaConditions) {
				conditions.push(metaConditions);
			}
		}

		// Date sub-query
		if (params.date) {
			const dateConditions = this.buildDateConditions(params.date);
			if (dateConditions) {
				conditions.push(dateConditions);
			}
		}

		return conditions;
	}

	private buildTaxConditions(tax: TaxQuery): ReturnType<typeof eq> | undefined {
		const clauseConditions = tax.clauses
			.map((clause) => {
				const subConditions: ReturnType<typeof eq>[] = [];

				if (clause.termIds && clause.termIds.length > 0) {
					// Sub-select to find term_taxonomy_ids for these term IDs
					const ttIdSubquery = sql`${termRelationships.termTaxonomyId} IN (
					SELECT ${termTaxonomy.termTaxonomyId} FROM ${termTaxonomy}
					WHERE ${termTaxonomy.taxonomy} = ${clause.taxonomy}
					AND ${termTaxonomy.termId} IN (${sql.join(
						clause.termIds.map((id) => sql`${id}`),
						sql`, `,
					)})
				)`;

					if (clause.operator === 'NOT IN') {
						subConditions.push(sql`${posts.id} NOT IN (
						SELECT ${termRelationships.objectId} FROM ${termRelationships}
						WHERE ${ttIdSubquery}
					)`);
					} else {
						subConditions.push(ttIdSubquery);
					}
				}

				if (clause.termSlugs && clause.termSlugs.length > 0) {
					const ttIdSubquery = sql`${termRelationships.termTaxonomyId} IN (
					SELECT ${termTaxonomy.termTaxonomyId} FROM ${termTaxonomy}
					INNER JOIN ${terms} ON ${terms.termId} = ${termTaxonomy.termId}
					WHERE ${termTaxonomy.taxonomy} = ${clause.taxonomy}
					AND ${terms.slug} IN (${sql.join(
						clause.termSlugs.map((s) => sql`${s}`),
						sql`, `,
					)})
				)`;

					if (clause.operator === 'NOT IN') {
						subConditions.push(sql`${posts.id} NOT IN (
						SELECT ${termRelationships.objectId} FROM ${termRelationships}
						WHERE ${ttIdSubquery}
					)`);
					} else {
						subConditions.push(ttIdSubquery);
					}
				}

				return subConditions.length > 0 ? and(...subConditions) : undefined;
			})
			.filter(Boolean);

		if (clauseConditions.length === 0) return undefined;

		const relation = tax.relation ?? 'AND';
		if (relation === 'OR') {
			return or(...clauseConditions)!;
		}
		return and(...clauseConditions)!;
	}

	private buildMetaConditions(meta: MetaQuery): ReturnType<typeof eq> | undefined {
		const clauseConditions = meta.clauses
			.map((clause) => {
				if (clause.compare === 'EXISTS') {
					return sql`${posts.id} IN (
					SELECT ${postmeta.postId} FROM ${postmeta}
					WHERE ${postmeta.metaKey} = ${clause.key}
				)`;
				}
				if (clause.compare === 'NOT EXISTS') {
					return sql`${posts.id} NOT IN (
					SELECT ${postmeta.postId} FROM ${postmeta}
					WHERE ${postmeta.metaKey} = ${clause.key}
				)`;
				}

				const valueStr = String(clause.value ?? '');
				const compare = clause.compare ?? '=';
				const castCol =
					clause.type === 'NUMERIC'
						? sql`CAST(${postmeta.metaValue} AS NUMERIC)`
						: postmeta.metaValue;

				const compareValue =
					clause.type === 'NUMERIC' ? sql`CAST(${valueStr} AS NUMERIC)` : sql`${valueStr}`;

				let condition;
				switch (compare) {
					case '=':
						condition = sql`${castCol} = ${compareValue}`;
						break;
					case '!=':
						condition = sql`${castCol} != ${compareValue}`;
						break;
					case '>':
						condition = sql`${castCol} > ${compareValue}`;
						break;
					case '<':
						condition = sql`${castCol} < ${compareValue}`;
						break;
					case '>=':
						condition = sql`${castCol} >= ${compareValue}`;
						break;
					case '<=':
						condition = sql`${castCol} <= ${compareValue}`;
						break;
					case 'LIKE':
						condition = sql`${postmeta.metaValue} LIKE ${valueStr}`;
						break;
					case 'NOT LIKE':
						condition = sql`${postmeta.metaValue} NOT LIKE ${valueStr}`;
						break;
					default:
						condition = sql`${castCol} = ${compareValue}`;
				}

				return sql`${posts.id} IN (
				SELECT ${postmeta.postId} FROM ${postmeta}
				WHERE ${postmeta.metaKey} = ${clause.key} AND ${condition}
			)`;
			})
			.filter(Boolean);

		if (clauseConditions.length === 0) return undefined;

		const relation = meta.relation ?? 'AND';
		if (relation === 'OR') {
			return or(...clauseConditions)!;
		}
		return and(...clauseConditions)!;
	}

	private buildDateConditions(date: DateQuery): ReturnType<typeof eq> | undefined {
		const clauseConditions = date.clauses
			.map((clause) => {
				const col = clause.column === 'post_modified' ? posts.postModified : posts.postDate;
				const conditions: ReturnType<typeof eq>[] = [];

				if (clause.year !== undefined) {
					conditions.push(sql`EXTRACT(YEAR FROM ${col}) = ${clause.year}`);
				}
				if (clause.month !== undefined) {
					conditions.push(sql`EXTRACT(MONTH FROM ${col}) = ${clause.month}`);
				}
				if (clause.day !== undefined) {
					conditions.push(sql`EXTRACT(DAY FROM ${col}) = ${clause.day}`);
				}
				if (clause.after !== undefined) {
					const afterDate = clause.after instanceof Date ? clause.after : new Date(clause.after);
					conditions.push(gt(col, afterDate));
				}
				if (clause.before !== undefined) {
					const beforeDate =
						clause.before instanceof Date ? clause.before : new Date(clause.before);
					conditions.push(lt(col, beforeDate));
				}

				return conditions.length > 0 ? and(...conditions) : undefined;
			})
			.filter(Boolean);

		if (clauseConditions.length === 0) return undefined;

		const relation = date.relation ?? 'AND';
		if (relation === 'OR') {
			return or(...clauseConditions)!;
		}
		return and(...clauseConditions)!;
	}

	// ─── Private: order by ───────────────────────────────────────

	private buildOrderBy(params: QueryParams) {
		const direction = params.order === 'asc' ? asc : desc;
		switch (params.orderBy) {
			case 'title':
				return direction(posts.postTitle);
			case 'name':
				return direction(posts.postName);
			case 'modified':
				return direction(posts.postModified);
			case 'id':
				return direction(posts.id);
			case 'author':
				return direction(posts.postAuthor);
			case 'menu_order':
				return direction(posts.menuOrder);
			case 'date':
			default:
				return direction(posts.postDate);
		}
	}

	// ─── Private: join detection ─────────────────────────────────

	private needsMetaJoin(params: QueryParams): boolean {
		return params.meta !== undefined && params.meta.clauses.length > 0;
	}

	private needsTaxJoin(params: QueryParams): boolean {
		return params.tax !== undefined && params.tax.clauses.length > 0;
	}

	// ─── Private: query flags ────────────────────────────────────

	private buildFlags(params: QueryParams, resultCount: number, _total: number): QueryFlags {
		const isSearch = Boolean(params.search);
		const isSingle =
			(params.include?.length === 1 || params.slug !== undefined) && !Array.isArray(params.slug);
		const isAuthor = params.author !== undefined;
		const isTaxonomy = params.tax !== undefined;
		const isDate = params.date !== undefined;
		const isPage = params.postType === 'page';
		const is404 = resultCount === 0;
		const isHome =
			!isSearch && !isSingle && !isAuthor && !isTaxonomy && !isDate && params.postType === 'post';
		const isArchive = !isSingle && (isAuthor || isTaxonomy || isDate);

		return { isSingle, isArchive, isSearch, is404, isHome, isPage, isAuthor, isTaxonomy, isDate };
	}
}
