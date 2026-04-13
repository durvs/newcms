import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['__tests__/**/*.test.ts'],
	},
	resolve: {
		alias: {
			'@newcms/database': resolve(__dirname, '../database/src/index.ts'),
		},
	},
});
