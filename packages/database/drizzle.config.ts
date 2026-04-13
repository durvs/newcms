import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'drizzle-kit';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

export default defineConfig({
	schema: './src/schema/index.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		host: process.env['DB_HOST'] ?? 'localhost',
		port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
		database: process.env['DB_NAME'] ?? 'newcms',
		user: process.env['DB_USER'] ?? 'newcms',
		password: process.env['DB_PASSWORD'] ?? '',
	},
});
