import {
	pgTable,
	serial,
	bigint,
	text,
	varchar,
	index,
	jsonb,
	uniqueIndex,
	primaryKey,
} from 'drizzle-orm/pg-core';
import { posts } from './posts';

export const terms = pgTable(
	'terms',
	{
		termId: serial('term_id').primaryKey(),
		name: varchar('name', { length: 200 }).notNull().default(''),
		slug: varchar('slug', { length: 200 }).notNull().default(''),
		termGroup: bigint('term_group', { mode: 'number' }).notNull().default(0),
	},
	(table) => [index('idx_term_slug').on(table.slug), index('idx_term_name').on(table.name)],
);

export const termTaxonomy = pgTable(
	'term_taxonomy',
	{
		termTaxonomyId: serial('term_taxonomy_id').primaryKey(),
		termId: bigint('term_id', { mode: 'number' })
			.notNull()
			.references(() => terms.termId, { onDelete: 'cascade' }),
		taxonomy: varchar('taxonomy', { length: 32 }).notNull().default(''),
		description: text('description').notNull().default(''),
		parent: bigint('parent', { mode: 'number' }).notNull().default(0),
		count: bigint('count', { mode: 'number' }).notNull().default(0),
	},
	(table) => [
		uniqueIndex('idx_term_id_taxonomy').on(table.termId, table.taxonomy),
		index('idx_taxonomy').on(table.taxonomy),
	],
);

export const termRelationships = pgTable(
	'term_relationships',
	{
		objectId: bigint('object_id', { mode: 'number' })
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		termTaxonomyId: bigint('term_taxonomy_id', { mode: 'number' })
			.notNull()
			.references(() => termTaxonomy.termTaxonomyId, { onDelete: 'cascade' }),
		termOrder: bigint('term_order', { mode: 'number' }).notNull().default(0),
	},
	(table) => [
		primaryKey({ columns: [table.objectId, table.termTaxonomyId] }),
		index('idx_term_taxonomy_id').on(table.termTaxonomyId),
	],
);

export const termmeta = pgTable(
	'termmeta',
	{
		metaId: serial('meta_id').primaryKey(),
		termId: bigint('term_id', { mode: 'number' })
			.notNull()
			.references(() => terms.termId, { onDelete: 'cascade' }),
		metaKey: varchar('meta_key', { length: 255 }),
		metaValue: text('meta_value'),
		metaValueJson: jsonb('meta_value_json'),
	},
	(table) => [
		index('idx_termmeta_term_id').on(table.termId),
		index('idx_termmeta_meta_key').on(table.metaKey),
	],
);
