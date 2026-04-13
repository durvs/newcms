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
import { posts } from './posts';
import { users } from './users';

export const comments = pgTable(
	'comments',
	{
		commentId: serial('comment_id').primaryKey(),
		commentPostId: bigint('comment_post_id', { mode: 'number' })
			.notNull()
			.default(0)
			.references(() => posts.id, { onDelete: 'cascade' }),
		commentAuthor: text('comment_author').notNull().default(''),
		commentAuthorEmail: varchar('comment_author_email', { length: 100 })
			.notNull()
			.default(''),
		commentAuthorUrl: varchar('comment_author_url', { length: 200 }).notNull().default(''),
		commentAuthorIp: varchar('comment_author_ip', { length: 100 }).notNull().default(''),
		commentDate: timestamp('comment_date', { withTimezone: true }).notNull().defaultNow(),
		commentDateGmt: timestamp('comment_date_gmt', { withTimezone: true }).notNull().defaultNow(),
		commentContent: text('comment_content').notNull().default(''),
		commentKarma: bigint('comment_karma', { mode: 'number' }).notNull().default(0),
		commentApproved: varchar('comment_approved', { length: 20 }).notNull().default('1'),
		commentAgent: varchar('comment_agent', { length: 255 }).notNull().default(''),
		commentType: varchar('comment_type', { length: 20 }).notNull().default('comment'),
		commentParent: bigint('comment_parent', { mode: 'number' }).notNull().default(0),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.default(0)
			.references(() => users.id),
	},
	(table) => [
		index('idx_comment_post_id').on(table.commentPostId),
		index('idx_comment_approved_date_gmt').on(table.commentApproved, table.commentDateGmt),
		index('idx_comment_date_gmt').on(table.commentDateGmt),
		index('idx_comment_parent').on(table.commentParent),
		index('idx_comment_author_email').on(table.commentAuthorEmail),
	],
);

export const commentmeta = pgTable(
	'commentmeta',
	{
		metaId: serial('meta_id').primaryKey(),
		commentId: bigint('comment_id', { mode: 'number' })
			.notNull()
			.references(() => comments.commentId, { onDelete: 'cascade' }),
		metaKey: varchar('meta_key', { length: 255 }),
		metaValue: text('meta_value'),
		metaValueJson: jsonb('meta_value_json'),
	},
	(table) => [
		index('idx_commentmeta_comment_id').on(table.commentId),
		index('idx_commentmeta_meta_key').on(table.metaKey),
	],
);
