import {
	pgTable,
	serial,
	text,
	varchar,
	boolean,
	jsonb,
	uniqueIndex,
	index,
} from 'drizzle-orm/pg-core';

export const options = pgTable(
	'options',
	{
		optionId: serial('option_id').primaryKey(),
		optionName: varchar('option_name', { length: 191 }).notNull().unique(),
		optionValue: text('option_value').notNull().default(''),
		optionValueJson: jsonb('option_value_json'),
		autoload: boolean('autoload').notNull().default(true),
	},
	(table) => [
		uniqueIndex('idx_option_name').on(table.optionName),
		index('idx_autoload').on(table.autoload),
	],
);
