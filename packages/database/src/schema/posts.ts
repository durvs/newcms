import {
	pgTable,
	serial,
	bigint,
	text,
	timestamp,
	varchar,
	index,
	jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const posts = pgTable(
	'posts',
	{
		id: serial('id').primaryKey(),
		postAuthor: bigint('post_author', { mode: 'number' })
			.notNull()
			.default(0)
			.references(() => users.id),
		postDate: timestamp('post_date', { withTimezone: true }).notNull().defaultNow(),
		postDateGmt: timestamp('post_date_gmt', { withTimezone: true }).notNull().defaultNow(),
		postContent: text('post_content').notNull().default(''),
		postTitle: text('post_title').notNull().default(''),
		postExcerpt: text('post_excerpt').notNull().default(''),
		postStatus: varchar('post_status', { length: 20 }).notNull().default('publish'),
		commentStatus: varchar('comment_status', { length: 20 }).notNull().default('open'),
		pingStatus: varchar('ping_status', { length: 20 }).notNull().default('open'),
		postPassword: varchar('post_password', { length: 255 }).notNull().default(''),
		postName: varchar('post_name', { length: 200 }).notNull().default(''),
		toPing: text('to_ping').notNull().default(''),
		pinged: text('pinged').notNull().default(''),
		postModified: timestamp('post_modified', { withTimezone: true }).notNull().defaultNow(),
		postModifiedGmt: timestamp('post_modified_gmt', { withTimezone: true }).notNull().defaultNow(),
		postContentFiltered: text('post_content_filtered').notNull().default(''),
		postParent: bigint('post_parent', { mode: 'number' }).notNull().default(0),
		guid: varchar('guid', { length: 255 }).notNull().default(''),
		menuOrder: bigint('menu_order', { mode: 'number' }).notNull().default(0),
		postType: varchar('post_type', { length: 20 }).notNull().default('post'),
		postMimeType: varchar('post_mime_type', { length: 100 }).notNull().default(''),
		commentCount: bigint('comment_count', { mode: 'number' }).notNull().default(0),
	},
	(table) => [
		index('idx_post_name').on(table.postName),
		index('idx_post_type_status_date').on(table.postType, table.postStatus, table.postDate),
		index('idx_post_parent').on(table.postParent),
		index('idx_post_author').on(table.postAuthor),
	],
);

export const postmeta = pgTable(
	'postmeta',
	{
		metaId: serial('meta_id').primaryKey(),
		postId: bigint('post_id', { mode: 'number' })
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		metaKey: varchar('meta_key', { length: 255 }),
		metaValue: text('meta_value'),
		metaValueJson: jsonb('meta_value_json'),
	},
	(table) => [
		index('idx_postmeta_post_id').on(table.postId),
		index('idx_postmeta_meta_key').on(table.metaKey),
		index('idx_postmeta_post_key').on(table.postId, table.metaKey),
	],
);
