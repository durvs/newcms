/**
 * Parameters for a content query.
 */
export interface QueryParams {
	/** Post type(s) to query. Default: 'post' */
	postType?: string | string[];
	/** Post status(es). Default: 'publish' */
	postStatus?: string | string[];
	/** Filter by author ID(s) */
	author?: number | number[];
	/** Search term (full-text search) */
	search?: string;
	/** Number of results per page. Default: 10. Use -1 for all. */
	perPage?: number;
	/** Page number (1-based). Default: 1 */
	page?: number;
	/** Order by field. Default: 'date' */
	orderBy?: 'date' | 'title' | 'name' | 'modified' | 'id' | 'author' | 'menu_order' | 'relevance';
	/** Order direction. Default: 'desc' */
	order?: 'asc' | 'desc';
	/** Include only these post IDs */
	include?: number[];
	/** Exclude these post IDs */
	exclude?: number[];
	/** Filter by parent ID (for hierarchical types) */
	parent?: number;
	/** Filter by slug(s) */
	slug?: string | string[];
	/** Only sticky posts */
	stickyOnly?: boolean;
	/** Taxonomy sub-query */
	tax?: TaxQuery;
	/** Meta sub-query */
	meta?: MetaQuery;
	/** Date sub-query */
	date?: DateQuery;
	/** Specific fields to return (optimization) */
	fields?: 'all' | 'ids';
}

/**
 * Taxonomy sub-query — filter posts by term assignments.
 */
export interface TaxQuery {
	/** How to combine multiple clauses: AND = all must match, OR = any can match */
	relation?: 'AND' | 'OR';
	clauses: TaxQueryClause[];
}

export interface TaxQueryClause {
	taxonomy: string;
	/** Term IDs to match */
	termIds?: number[];
	/** Term slugs to match */
	termSlugs?: string[];
	/** Operator: IN = has any of these terms, NOT IN = doesn't have these */
	operator?: 'IN' | 'NOT IN' | 'AND';
	/** Include children of hierarchical terms */
	includeChildren?: boolean;
}

/**
 * Meta sub-query — filter posts by metadata values.
 */
export interface MetaQuery {
	relation?: 'AND' | 'OR';
	clauses: MetaQueryClause[];
}

export interface MetaQueryClause {
	key: string;
	value?: string | number | boolean;
	compare?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'EXISTS' | 'NOT EXISTS';
	/** Cast type for comparison */
	type?: 'CHAR' | 'NUMERIC' | 'DATE' | 'DATETIME';
}

/**
 * Date sub-query — filter posts by date ranges.
 */
export interface DateQuery {
	relation?: 'AND' | 'OR';
	clauses: DateQueryClause[];
}

export interface DateQueryClause {
	year?: number;
	month?: number;
	day?: number;
	after?: string | Date;
	before?: string | Date;
	column?: 'post_date' | 'post_modified';
}

/**
 * Result of a content query.
 */
export interface QueryResult<T = unknown> {
	/** The matched posts */
	posts: T[];
	/** Total number of matching posts (ignoring pagination) */
	total: number;
	/** Total number of pages */
	totalPages: number;
	/** Current page */
	page: number;
	/** Posts per page */
	perPage: number;
	/** Query type flags */
	flags: QueryFlags;
}

/**
 * Flags indicating the type of query result.
 */
export interface QueryFlags {
	isSingle: boolean;
	isArchive: boolean;
	isSearch: boolean;
	is404: boolean;
	isHome: boolean;
	isPage: boolean;
	isAuthor: boolean;
	isTaxonomy: boolean;
	isDate: boolean;
}
