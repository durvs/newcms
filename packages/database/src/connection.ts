import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

export interface DatabaseConfig {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
	maxConnections?: number;
}

function getConfigFromEnv(): DatabaseConfig {
	const password = process.env['DB_PASSWORD'];
	if (!password) {
		throw new Error(
			'DB_PASSWORD environment variable is required. ' + 'Set it in your .env file or environment.',
		);
	}

	return {
		host: process.env['DB_HOST'] ?? 'localhost',
		port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
		database: process.env['DB_NAME'] ?? 'newcms',
		user: process.env['DB_USER'] ?? 'newcms',
		password,
		maxConnections: parseInt(process.env['DB_MAX_CONNECTIONS'] ?? '10', 10),
	};
}

export function createConnection(config?: DatabaseConfig) {
	const cfg = config ?? getConfigFromEnv();

	const client = postgres({
		host: cfg.host,
		port: cfg.port,
		database: cfg.database,
		user: cfg.user,
		password: cfg.password,
		max: cfg.maxConnections ?? 10,
	});

	const db = drizzle(client, { schema });

	return { db, client };
}

export type Database = ReturnType<typeof createConnection>['db'];
