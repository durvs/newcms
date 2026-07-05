import { describe, it, expect } from 'vitest';
import { UploadManager } from '../src/upload';
import { DEFAULT_IMAGE_SIZES } from '../src/types';
import type { StorageAdapter } from '../src/types';

function createMemoryStorage(): StorageAdapter & { files: Map<string, Buffer> } {
	const files = new Map<string, Buffer>();
	return {
		files,
		async write(path, buffer) {
			files.set(path, buffer);
			return `/uploads/${path}`;
		},
		async read(path) {
			const buf = files.get(path);
			if (!buf) throw new Error(`Not found: ${path}`);
			return buf;
		},
		async delete(path) {
			return files.delete(path);
		},
		async exists(path) {
			return files.has(path);
		},
		getUrl(path) {
			return `/uploads/${path}`;
		},
	};
}

describe('UploadManager', () => {
	it('stores a non-image file and returns its URL and metadata', async () => {
		const storage = createMemoryStorage();
		const manager = new UploadManager(storage, DEFAULT_IMAGE_SIZES);
		const buffer = Buffer.from('%PDF-1.4 fake pdf content');

		const result = await manager.upload(buffer, 'Report Final.pdf', 'application/pdf');

		expect(result.filename).toBe('report-final.pdf');
		expect(result.path).toMatch(/^\d{4}\/\d{2}\/report-final\.pdf$/);
		expect(result.url).toBe(`/uploads/${result.path}`);
		expect(result.size).toBe(buffer.byteLength);
		expect(result.sizes).toEqual([]);
		expect(storage.files.has(result.path)).toBe(true);
	});

	it('sanitizes accented and unsafe characters in filenames', async () => {
		const storage = createMemoryStorage();
		const manager = new UploadManager(storage, DEFAULT_IMAGE_SIZES);

		const result = await manager.upload(
			Buffer.from('text'),
			'Relatório  (versão #2)!.txt',
			'text/plain',
		);

		expect(result.filename).toBe('relatorio-versao-2-.txt');
		expect(result.filename).not.toMatch(/[^a-z0-9._-]/);
	});

	it('rejects disallowed MIME types', async () => {
		const manager = new UploadManager(createMemoryStorage(), DEFAULT_IMAGE_SIZES);

		await expect(
			manager.upload(Buffer.from('MZ'), 'app.exe', 'application/x-msdownload'),
		).rejects.toThrow('not allowed');
	});

	it('rejects files over the size limit', async () => {
		const manager = new UploadManager(createMemoryStorage(), DEFAULT_IMAGE_SIZES, 1024);

		await expect(manager.upload(Buffer.alloc(2048), 'big.txt', 'text/plain')).rejects.toThrow(
			'exceeds limit',
		);
	});

	it('deletes a file and its generated sizes', async () => {
		const storage = createMemoryStorage();
		const manager = new UploadManager(storage, DEFAULT_IMAGE_SIZES);
		const result = await manager.upload(Buffer.from('data'), 'note.txt', 'text/plain');
		storage.files.set('2024/01/note-thumbnail.jpg', Buffer.from('thumb'));

		await manager.delete(result.path, ['2024/01/note-thumbnail.jpg']);

		expect(storage.files.has(result.path)).toBe(false);
		expect(storage.files.has('2024/01/note-thumbnail.jpg')).toBe(false);
	});
});
