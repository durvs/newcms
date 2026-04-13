import { mkdir, writeFile, readFile, unlink, access } from 'fs/promises';
import { join, dirname } from 'path';
import type { StorageAdapter } from './types';

/**
 * Local filesystem storage adapter.
 * Stores files in a directory (typically `uploads/`) and serves via a base URL.
 */
export class LocalStorage implements StorageAdapter {
	constructor(
		private basePath: string,
		private baseUrl: string,
	) {}

	async write(path: string, buffer: Buffer, _mimeType: string): Promise<string> {
		const fullPath = join(this.basePath, path);
		await mkdir(dirname(fullPath), { recursive: true });
		await writeFile(fullPath, buffer);
		return this.getUrl(path);
	}

	async read(path: string): Promise<Buffer> {
		const fullPath = join(this.basePath, path);
		return readFile(fullPath);
	}

	async delete(path: string): Promise<boolean> {
		try {
			const fullPath = join(this.basePath, path);
			await unlink(fullPath);
			return true;
		} catch {
			return false;
		}
	}

	async exists(path: string): Promise<boolean> {
		try {
			await access(join(this.basePath, path));
			return true;
		} catch {
			return false;
		}
	}

	getUrl(path: string): string {
		return `${this.baseUrl}/${path}`;
	}
}
