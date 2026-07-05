// Loads .env before any other application module is evaluated.
// This MUST be the first application import in main.ts: ES module imports
// are hoisted, so calling dotenv.config() in main.ts's body runs AFTER
// module-scope process.env reads in controllers (e.g. AUTH_SECRET).
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });
