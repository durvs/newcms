import { pgTable, serial, bigint, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Dedicated sessions table — replaces serialized session tokens
 * stored as user metadata in the original system.
 *
 * Note: Primary session storage is in Redis for O(1) access.
 * This table serves as persistent backup and for admin visibility.
 */
export const sessions = pgTable(
	'sessions',
	{
		id: serial('id').primaryKey(),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		ip: varchar('ip', { length: 45 }).notNull().default(''),
		userAgent: varchar('user_agent', { length: 500 }).notNull().default(''),
		data: jsonb('data'),
	},
	(table) => [
		index('idx_session_user_id').on(table.userId),
		index('idx_session_token_hash').on(table.tokenHash),
		index('idx_session_expires_at').on(table.expiresAt),
	],
);
