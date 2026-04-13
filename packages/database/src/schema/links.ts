import {
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
	bigint,
	index,
} from 'drizzle-orm/pg-core';

export const links = pgTable(
	'links',
	{
		linkId: serial('link_id').primaryKey(),
		linkUrl: varchar('link_url', { length: 255 }).notNull().default(''),
		linkName: varchar('link_name', { length: 255 }).notNull().default(''),
		linkImage: varchar('link_image', { length: 255 }).notNull().default(''),
		linkTarget: varchar('link_target', { length: 25 }).notNull().default(''),
		linkDescription: varchar('link_description', { length: 255 }).notNull().default(''),
		linkVisible: varchar('link_visible', { length: 20 }).notNull().default('Y'),
		linkOwner: bigint('link_owner', { mode: 'number' }).notNull().default(1),
		linkRating: bigint('link_rating', { mode: 'number' }).notNull().default(0),
		linkUpdated: timestamp('link_updated', { withTimezone: true }).notNull().defaultNow(),
		linkRel: varchar('link_rel', { length: 255 }).notNull().default(''),
		linkNotes: text('link_notes').notNull().default(''),
		linkRss: varchar('link_rss', { length: 255 }).notNull().default(''),
	},
	(table) => [index('idx_link_visible').on(table.linkVisible)],
);
