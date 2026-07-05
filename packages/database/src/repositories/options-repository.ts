import { eq } from 'drizzle-orm';
import type { Database } from '../connection';
import { options } from '../schema/options';
import type { ObjectCache } from '../cache/object-cache';

const CACHE_GROUP = 'options';
const AUTOLOAD_CACHE_KEY = '__autoloaded';
const NOT_FOUND_GROUP = 'options_nf';

/**
 * Options repository — CRUD for site options with integrated Redis cache.
 *
 * Behaviors per spec:
 * - Options marked as autoload=true are pre-loaded into cache together
 * - Cache of "not found" keys prevents repeated DB misses
 * - Complex values (objects/arrays) stored as JSONB in addition to text
 * - Write operations invalidate cache granularly
 */
export class OptionsRepository {
	constructor(
		private db: Database,
		private cache: ObjectCache,
	) {}

	/**
	 * Get an option value.
	 *
	 * Lookup order:
	 * 1. Redis cache (group "options")
	 * 2. "Not found" cache (avoids repeated DB queries for missing keys)
	 * 3. Database
	 */
	async getOption<T = string>(name: string, defaultValue?: T): Promise<T | undefined> {
		// 1. Check cache
		const cached = await this.cache.get<T>(name, CACHE_GROUP);
		if (cached !== undefined) return cached;

		// 2. Check "not found" cache
		const isNotFound = await this.cache.get(name, NOT_FOUND_GROUP);
		if (isNotFound !== undefined) return defaultValue;

		// 3. Query database
		const rows = await this.db.select().from(options).where(eq(options.optionName, name)).limit(1);

		if (rows.length === 0) {
			// Cache as "not found" to avoid future DB queries
			await this.cache.set(name, true, NOT_FOUND_GROUP, 3600);
			return defaultValue;
		}

		const row = rows[0];
		const value = this.deserializeValue<T>(row);

		// Cache the value
		await this.cache.set(name, value, CACHE_GROUP);

		return value;
	}

	/**
	 * Add a new option. Fails if option already exists.
	 *
	 * @returns true if the option was created
	 */
	async addOption(name: string, value: unknown, autoload: boolean = true): Promise<boolean> {
		// Check if already exists
		const existing = await this.db
			.select({ optionId: options.optionId })
			.from(options)
			.where(eq(options.optionName, name))
			.limit(1);

		if (existing.length > 0) return false;

		const { textValue, jsonValue } = this.serializeValue(value);

		await this.db.insert(options).values({
			optionName: name,
			optionValue: textValue,
			optionValueJson: jsonValue,
			autoload,
		});

		// Update cache
		await this.cache.set(name, value, CACHE_GROUP);
		await this.cache.delete(name, NOT_FOUND_GROUP);

		// Invalidate autoload cache if this is an autoloaded option
		if (autoload) {
			await this.cache.delete(AUTOLOAD_CACHE_KEY, CACHE_GROUP);
		}

		return true;
	}

	/**
	 * Update an existing option, or create it if it doesn't exist.
	 *
	 * @returns true if the value was changed
	 */
	async updateOption(name: string, value: unknown, autoload?: boolean): Promise<boolean> {
		const { textValue, jsonValue } = this.serializeValue(value);

		// Try to update
		const existing = await this.db
			.select()
			.from(options)
			.where(eq(options.optionName, name))
			.limit(1);

		if (existing.length === 0) {
			// Option doesn't exist — create it
			return this.addOption(name, value, autoload ?? true);
		}

		const row = existing[0];

		// Check if value actually changed
		if (row.optionValue === textValue && autoload === undefined) {
			return false;
		}

		const updateData: Record<string, unknown> = {
			optionValue: textValue,
			optionValueJson: jsonValue,
		};

		if (autoload !== undefined) {
			updateData['autoload'] = autoload;
		}

		await this.db.update(options).set(updateData).where(eq(options.optionName, name));

		// Update cache
		await this.cache.set(name, value, CACHE_GROUP);
		await this.cache.delete(name, NOT_FOUND_GROUP);

		// Invalidate autoload cache
		await this.cache.delete(AUTOLOAD_CACHE_KEY, CACHE_GROUP);

		return true;
	}

	/**
	 * Delete an option.
	 *
	 * @returns true if the option existed and was deleted
	 */
	async deleteOption(name: string): Promise<boolean> {
		const result = await this.db
			.delete(options)
			.where(eq(options.optionName, name))
			.returning({ optionId: options.optionId });

		if (result.length === 0) return false;

		// Remove from cache
		await this.cache.delete(name, CACHE_GROUP);
		await this.cache.delete(name, NOT_FOUND_GROUP);
		await this.cache.delete(AUTOLOAD_CACHE_KEY, CACHE_GROUP);

		return true;
	}

	/**
	 * Load all autoloaded options into cache at once.
	 * Called during bootstrap to pre-warm the cache.
	 */
	async loadAutoloadedOptions(): Promise<Map<string, unknown>> {
		// Check if already loaded
		const cached = await this.cache.get<Record<string, unknown>>(AUTOLOAD_CACHE_KEY, CACHE_GROUP);

		if (cached) {
			const result = new Map(Object.entries(cached));
			// Populate individual option caches
			for (const [key, value] of result) {
				await this.cache.set(key, value, CACHE_GROUP);
			}
			return result;
		}

		// Query all autoloaded options
		const rows = await this.db.select().from(options).where(eq(options.autoload, true));

		const result = new Map<string, unknown>();
		const autoloadMap: Record<string, unknown> = {};

		for (const row of rows) {
			const value = this.deserializeValue(row);
			result.set(row.optionName, value);
			autoloadMap[row.optionName] = value;
			await this.cache.set(row.optionName, value, CACHE_GROUP);
		}

		// Cache the complete autoload map
		await this.cache.set(AUTOLOAD_CACHE_KEY, autoloadMap, CACHE_GROUP);

		return result;
	}

	/**
	 * Serialize a value for storage.
	 * Complex types (objects, arrays) are stored in both text and JSONB columns.
	 */
	private serializeValue(value: unknown): { textValue: string; jsonValue: unknown } {
		if (value === null || value === undefined) {
			return { textValue: '', jsonValue: null };
		}

		if (typeof value === 'string') {
			// Try to detect if it's JSON
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed === 'object' && parsed !== null) {
					return { textValue: value, jsonValue: parsed };
				}
			} catch {
				// Not JSON, store as plain text
			}
			return { textValue: value, jsonValue: null };
		}

		if (typeof value === 'number' || typeof value === 'boolean') {
			return { textValue: String(value), jsonValue: null };
		}

		// Objects and arrays → both text (JSON string) and JSONB
		const textValue = JSON.stringify(value);
		return { textValue, jsonValue: value };
	}

	/**
	 * Deserialize a value from the database row.
	 * Prefers JSONB column when available (already parsed).
	 */
	private deserializeValue<T>(row: { optionValue: string; optionValueJson: unknown }): T {
		// Prefer JSONB if available
		if (row.optionValueJson !== null && row.optionValueJson !== undefined) {
			return row.optionValueJson as T;
		}

		// Try to parse as JSON
		try {
			return JSON.parse(row.optionValue) as T;
		} catch {
			return row.optionValue as T;
		}
	}
}
