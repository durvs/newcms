import { pgTable, serial, text, timestamp, varchar, index, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		userLogin: varchar('user_login', { length: 60 }).notNull().unique(),
		userPass: varchar('user_pass', { length: 255 }).notNull().default(''),
		userNicename: varchar('user_nicename', { length: 50 }).notNull().default(''),
		userEmail: varchar('user_email', { length: 100 }).notNull().unique(),
		userUrl: varchar('user_url', { length: 100 }).notNull().default(''),
		userRegistered: timestamp('user_registered', { withTimezone: true }).notNull().defaultNow(),
		userActivationKey: varchar('user_activation_key', { length: 255 }).notNull().default(''),
		userStatus: varchar('user_status', { length: 20 }).notNull().default('active'),
		displayName: varchar('display_name', { length: 250 }).notNull().default(''),
	},
	(table) => [
		index('idx_user_login').on(table.userLogin),
		index('idx_user_nicename').on(table.userNicename),
		index('idx_user_email').on(table.userEmail),
	],
);

export const usermeta = pgTable(
	'usermeta',
	{
		umetaId: serial('umeta_id').primaryKey(),
		userId: serial('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		metaKey: varchar('meta_key', { length: 255 }),
		metaValue: text('meta_value'),
		metaValueJson: jsonb('meta_value_json'),
	},
	(table) => [
		index('idx_usermeta_user_id').on(table.userId),
		index('idx_usermeta_meta_key').on(table.metaKey),
	],
);
