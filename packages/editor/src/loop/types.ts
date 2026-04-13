/**
 * Loop Builder — query content and render with a visual template.
 */

export interface LoopQuery {
	postType: string;
	postsPerPage: number;
	orderBy: 'date' | 'title' | 'menu_order' | 'rand' | 'meta_value';
	order: 'asc' | 'desc';
	taxonomyFilter?: { taxonomy: string; terms: string[]; operator: 'IN' | 'NOT IN' }[];
	authorFilter?: number[];
	excludeIds?: number[];
	offsetPosts?: number;
	/** Prevent duplicates from other loops on the same page */
	excludeDuplicates?: boolean;
	/** Meta query for custom field filtering */
	metaQuery?: { key: string; value: string; compare: string }[];
}

export type LoopLayout = 'grid' | 'carousel' | 'list';

export interface LoopConfig {
	query: LoopQuery;
	layout: LoopLayout;
	columns: number;
	columnsMobile?: number;
	columnsTablet?: number;
	gap: number;
	pagination: boolean;
	paginationType?: 'numbers' | 'load-more' | 'infinite-scroll';
	/** ID of the loop item template */
	templateId?: number;
}

export const DEFAULT_LOOP_QUERY: LoopQuery = {
	postType: 'post',
	postsPerPage: 6,
	orderBy: 'date',
	order: 'desc',
};

export const DEFAULT_LOOP_CONFIG: LoopConfig = {
	query: DEFAULT_LOOP_QUERY,
	layout: 'grid',
	columns: 3,
	columnsMobile: 1,
	columnsTablet: 2,
	gap: 24,
	pagination: true,
	paginationType: 'numbers',
};
