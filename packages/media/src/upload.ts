import { ImageProcessor } from './processor';
import type { StorageAdapter, ImageSize, UploadResult } from './types';

const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml',
	'video/mp4', 'video/webm', 'video/ogg',
	'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
	'application/pdf',
	'text/plain', 'text/csv',
]);

const IMAGE_MIME_TYPES = new Set([
	'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
]);

/**
 * Upload manager — handles file upload, image processing, and storage.
 */
export class UploadManager {
	private processor: ImageProcessor;

	constructor(
		private storage: StorageAdapter,
		private imageSizes: ImageSize[],
		private maxFileSize: number = 10 * 1024 * 1024, // 10MB default
	) {
		this.processor = new ImageProcessor();
	}

	/**
	 * Process and store an uploaded file.
	 */
	async upload(
		buffer: Buffer,
		filename: string,
		mimeType: string,
	): Promise<UploadResult> {
		// Validate
		if (!ALLOWED_MIME_TYPES.has(mimeType)) {
			throw new Error(`File type "${mimeType}" is not allowed`);
		}
		if (buffer.byteLength > this.maxFileSize) {
			throw new Error(`File size ${Math.round(buffer.byteLength / 1024 / 1024)}MB exceeds limit of ${Math.round(this.maxFileSize / 1024 / 1024)}MB`);
		}

		// Generate storage path: yyyy/mm/filename
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const safeName = sanitizeFilename(filename);
		const basePath = `${year}/${month}/${safeName}`;

		// Store original
		const url = await this.storage.write(basePath, buffer, mimeType);

		const result: UploadResult = {
			path: basePath,
			url,
			filename: safeName,
			mimeType,
			size: buffer.byteLength,
			metadata: {
				width: 0, height: 0, format: mimeType.split('/')[1] ?? 'unknown',
				hasAlpha: false, fileSize: buffer.byteLength,
			},
			sizes: [],
		};

		// Process images: extract metadata and generate sizes
		if (IMAGE_MIME_TYPES.has(mimeType)) {
			result.metadata = await this.processor.getMetadata(buffer);

			const processed = await this.processor.generateSizes(buffer, this.imageSizes);

			for (const img of processed) {
				const ext = img.format === 'jpeg' ? 'jpg' : img.format;
				const sizePath = basePath.replace(/\.[^.]+$/, `-${img.size.name}.${ext}`);
				const sizeUrl = await this.storage.write(sizePath, img.buffer, `image/${img.format}`);

				result.sizes.push({
					name: img.size.name,
					path: sizePath,
					url: sizeUrl,
					width: img.width,
					height: img.height,
				});
			}
		}

		return result;
	}

	/**
	 * Delete a file and all its generated sizes.
	 */
	async delete(path: string, sizes?: string[]): Promise<void> {
		await this.storage.delete(path);
		if (sizes) {
			for (const sizePath of sizes) {
				await this.storage.delete(sizePath);
			}
		}
	}
}

/**
 * Sanitize filename — lowercase, replace spaces, remove unsafe chars.
 */
function sanitizeFilename(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9._-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
