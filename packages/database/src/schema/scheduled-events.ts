import { pgTable, serial, varchar, timestamp, jsonb, bigint, index } from 'drizzle-orm/pg-core';

/**
 * Dedicated scheduled_events table — replaces the serialized cron
 * array stored in the options table in the original system.
 *
 * This is a persistent record. Actual scheduling is managed by BullMQ.
 */
export const scheduledEvents = pgTable(
	'scheduled_events',
	{
		id: serial('id').primaryKey(),
		hook: varchar('hook', { length: 255 }).notNull(),
		args: jsonb('args').notNull().default('[]'),
		schedule: varchar('schedule', { length: 50 }),
		intervalSeconds: bigint('interval_seconds', { mode: 'number' }),
		nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		status: varchar('status', { length: 20 }).notNull().default('pending'),
	},
	(table) => [
		index('idx_scheduled_hook').on(table.hook),
		index('idx_scheduled_next_run').on(table.nextRunAt),
		index('idx_scheduled_status').on(table.status),
	],
);
