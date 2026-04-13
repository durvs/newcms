import { eq, and, inArray, sql } from 'drizzle-orm';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import type { Database } from '../connection';

/**
 * Column references needed for a meta table.
 */
export interface MetaTableColumns {
	metaId: PgColumn;
	objectId: PgColumn;
	metaKey: PgColumn;
	metaValue: PgColumn;
	metaValueJson: PgColumn;
}

/**
 * Column name mapping for raw SQL operations and result parsing.
 *
 * `sql` = names as in the database (for INSERT/UPDATE raw SQL)
 * `ts` = names as in the Drizzle schema definition (for reading select results)
 */
export interface MetaColumnNames {
	table: string;
	/** SQL column names (for raw queries) */
	sql: { metaId: string; objectId: string; metaKey: string; metaValue: string; metaValueJson: string };
	/** TypeScript property names (for reading Drizzle select results) */
	ts: { metaId: string; objectId: string; metaKey: string; metaValue: string; metaValueJson: string };
}

export interface MetaEntry {
	metaId: number;
	objectId: number;
	metaKey: string | null;
	metaValue: string | null;
	metaValueJson: unknown;
}

/**
 * Generic metadata repository — works with any meta table (postmeta, usermeta,
 * commentmeta, termmeta). Follows the entity-attribute-value pattern with
 * JSONB support for structured queries.
 */
export class MetaRepository {
	private colNames: MetaColumnNames;

	constructor(
		private db: Database,
		private table: PgTable,
		private columns: MetaTableColumns,
		colNames: MetaColumnNames,
	) {
		this.colNames = colNames;
	}

	async get<T = unknown>(objectId: number, key: string): Promise<T | undefined> {
		const rows = await this.db
			.select()
			.from(this.table)
			.where(and(eq(this.columns.objectId, objectId), eq(this.columns.metaKey, key)))
			.limit(1);

		if (rows.length === 0) return undefined;
		return this.deserialize<T>(this.toMetaEntry(rows[0] as Record<string, unknown>));
	}

	async getAll<T = unknown>(objectId: number, key: string): Promise<T[]> {
		const rows = await this.db
			.select()
			.from(this.table)
			.where(and(eq(this.columns.objectId, objectId), eq(this.columns.metaKey, key)));

		return rows.map((r) => this.deserialize<T>(this.toMetaEntry(r as Record<string, unknown>)));
	}

	async getAllForObject(objectId: number): Promise<Map<string, unknown[]>> {
		const rows = await this.db
			.select()
			.from(this.table)
			.where(eq(this.columns.objectId, objectId));

		const result = new Map<string, unknown[]>();
		for (const row of rows) {
			const entry = this.toMetaEntry(row as Record<string, unknown>);
			const key = entry.metaKey ?? '';
			const values = result.get(key) ?? [];
			values.push(this.deserialize(entry));
			result.set(key, values);
		}
		return result;
	}

	async batchLoad(objectIds: number[]): Promise<Map<number, Map<string, unknown[]>>> {
		if (objectIds.length === 0) return new Map();

		const rows = await this.db
			.select()
			.from(this.table)
			.where(inArray(this.columns.objectId, objectIds));

		const result = new Map<number, Map<string, unknown[]>>();
		for (const row of rows) {
			const rawRow = row as Record<string, unknown>;
			const entry = this.toMetaEntry(rawRow);
			if (!result.has(entry.objectId)) {
				result.set(entry.objectId, new Map());
			}
			const objectMeta = result.get(entry.objectId)!;
			const key = entry.metaKey ?? '';
			const values = objectMeta.get(key) ?? [];
			values.push(this.deserialize(entry));
			objectMeta.set(key, values);
		}
		return result;
	}

	async add(objectId: number, key: string, value: unknown): Promise<number> {
		const { textValue, jsonValue } = this.serialize(value);
		const jsonStr = jsonValue !== null ? JSON.stringify(jsonValue) : null;
		const s = this.colNames.sql;
		const t = this.colNames.table;

		const rows = await this.db.execute(sql`
			INSERT INTO ${sql.raw(`"${t}"`)} (${sql.raw(`"${s.objectId}"`)}, ${sql.raw(`"${s.metaKey}"`)}, ${sql.raw(`"${s.metaValue}"`)}, ${sql.raw(`"${s.metaValueJson}"`)})
			VALUES (${objectId}, ${key}, ${textValue}, ${jsonStr}::jsonb)
			RETURNING ${sql.raw(`"${s.metaId}"`)}
		`);

		const returnedRows = rows as unknown as Array<Record<string, number>>;
		return returnedRows[0][s.metaId];
	}

	async update(objectId: number, key: string, value: unknown): Promise<boolean> {
		const { textValue, jsonValue } = this.serialize(value);

		const existing = await this.db
			.select({ metaId: this.columns.metaId })
			.from(this.table)
			.where(and(eq(this.columns.objectId, objectId), eq(this.columns.metaKey, key)))
			.limit(1);

		if (existing.length === 0) {
			await this.add(objectId, key, value);
			return true;
		}

		const metaId = (existing[0] as { metaId: number }).metaId;
		const jsonStr = jsonValue !== null ? JSON.stringify(jsonValue) : null;
		const s = this.colNames.sql;
		const t = this.colNames.table;

		await this.db.execute(sql`
			UPDATE ${sql.raw(`"${t}"`)}
			SET ${sql.raw(`"${s.metaValue}"`)} = ${textValue}, ${sql.raw(`"${s.metaValueJson}"`)} = ${jsonStr}::jsonb
			WHERE ${sql.raw(`"${s.metaId}"`)} = ${metaId}
		`);

		return true;
	}

	async delete(objectId: number, key: string, value?: unknown): Promise<number> {
		if (value !== undefined) {
			const { textValue } = this.serialize(value);
			const result = await this.db
				.delete(this.table)
				.where(
					and(
						eq(this.columns.objectId, objectId),
						eq(this.columns.metaKey, key),
						eq(this.columns.metaValue, textValue),
					),
				)
				.returning({ metaId: this.columns.metaId });
			return result.length;
		}

		const result = await this.db
			.delete(this.table)
			.where(and(eq(this.columns.objectId, objectId), eq(this.columns.metaKey, key)))
			.returning({ metaId: this.columns.metaId });

		return result.length;
	}

	async deleteAllForObject(objectId: number): Promise<number> {
		const result = await this.db
			.delete(this.table)
			.where(eq(this.columns.objectId, objectId))
			.returning({ metaId: this.columns.metaId });
		return result.length;
	}

	/**
	 * Convert a raw DB row to MetaEntry using column name mapping.
	 */
	private toMetaEntry(row: Record<string, unknown>): MetaEntry {
		const ts = this.colNames.ts;
		return {
			metaId: row[ts.metaId] as number,
			objectId: row[ts.objectId] as number,
			metaKey: row[ts.metaKey] as string | null,
			metaValue: row[ts.metaValue] as string | null,
			metaValueJson: row[ts.metaValueJson],
		};
	}

	private serialize(value: unknown): { textValue: string; jsonValue: unknown } {
		if (value === null || value === undefined) {
			return { textValue: '', jsonValue: null };
		}
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (typeof parsed === 'object' && parsed !== null) {
					return { textValue: value, jsonValue: parsed };
				}
			} catch { /* plain string */ }
			return { textValue: value, jsonValue: null };
		}
		if (typeof value === 'number' || typeof value === 'boolean') {
			return { textValue: String(value), jsonValue: null };
		}
		const textValue = JSON.stringify(value);
		return { textValue, jsonValue: value };
	}

	private deserialize<T>(entry: MetaEntry): T {
		if (entry.metaValueJson !== null && entry.metaValueJson !== undefined) {
			return entry.metaValueJson as T;
		}
		if (entry.metaValue === null) return '' as T;
		try {
			return JSON.parse(entry.metaValue) as T;
		} catch {
			return entry.metaValue as T;
		}
	}
}
