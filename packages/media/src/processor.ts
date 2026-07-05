import sharp from 'sharp';
import type { ImageSize, ProcessedImage, ImageMetadata } from './types';

/**
 * Image processor powered by Sharp (libvips).
 * Handles resize, crop, format conversion, and metadata extraction.
 */
export class ImageProcessor {
	/**
	 * Extract metadata from an image buffer.
	 */
	async getMetadata(buffer: Buffer): Promise<ImageMetadata> {
		const meta = await sharp(buffer).metadata();

		return {
			width: meta.width ?? 0,
			height: meta.height ?? 0,
			format: meta.format ?? 'unknown',
			space: meta.space,
			channels: meta.channels,
			hasAlpha: meta.hasAlpha ?? false,
			fileSize: buffer.byteLength,
			exif: meta.exif ? parseExifBuffer(meta.exif) : undefined,
		};
	}

	/**
	 * Generate resized versions of an image for all specified sizes.
	 */
	async generateSizes(
		buffer: Buffer,
		sizes: ImageSize[],
		options?: { format?: 'webp' | 'avif' | 'jpeg' | 'png'; quality?: number },
	): Promise<ProcessedImage[]> {
		const meta = await sharp(buffer).metadata();
		const originalWidth = meta.width ?? 0;
		const originalHeight = meta.height ?? 0;
		const results: ProcessedImage[] = [];

		for (const size of sizes) {
			// Skip if image is smaller than the target size
			if (
				size.width > 0 &&
				size.height > 0 &&
				originalWidth <= size.width &&
				originalHeight <= size.height
			) {
				continue;
			}
			if (size.width > 0 && size.height === 0 && originalWidth <= size.width) {
				continue;
			}
			// Skip 'full' size — it's the original
			if (size.name === 'full') continue;

			let pipeline = sharp(buffer);

			if (size.crop) {
				pipeline = pipeline.resize(size.width, size.height, {
					fit: 'cover',
					position: 'centre',
				});
			} else {
				pipeline = pipeline.resize(size.width || undefined, size.height || undefined, {
					fit: 'inside',
					withoutEnlargement: true,
				});
			}

			// Format conversion
			if (options?.format) {
				pipeline = pipeline.toFormat(options.format, { quality: options.quality ?? 82 });
			}

			const outputBuffer = await pipeline.toBuffer();
			const outputMeta = await sharp(outputBuffer).metadata();

			results.push({
				size,
				buffer: outputBuffer,
				format: outputMeta.format ?? options?.format ?? meta.format ?? 'jpeg',
				width: outputMeta.width ?? 0,
				height: outputMeta.height ?? 0,
				byteLength: outputBuffer.byteLength,
			});
		}

		return results;
	}

	/**
	 * Resize a single image.
	 */
	async resize(
		buffer: Buffer,
		width: number,
		height?: number,
		options?: { fit?: 'cover' | 'contain' | 'inside' | 'fill'; quality?: number },
	): Promise<Buffer> {
		let pipeline = sharp(buffer).resize(width, height || undefined, {
			fit: options?.fit ?? 'inside',
			withoutEnlargement: true,
		});

		if (options?.quality) {
			pipeline = pipeline.jpeg({ quality: options.quality });
		}

		return pipeline.toBuffer();
	}

	/**
	 * Convert image format.
	 */
	async convert(
		buffer: Buffer,
		format: 'webp' | 'avif' | 'jpeg' | 'png',
		quality: number = 82,
	): Promise<Buffer> {
		return sharp(buffer).toFormat(format, { quality }).toBuffer();
	}

	/**
	 * Rotate image (auto-orient from EXIF or explicit angle).
	 */
	async rotate(buffer: Buffer, angle?: number): Promise<Buffer> {
		return sharp(buffer).rotate(angle).toBuffer();
	}

	/**
	 * Generate a srcset string for responsive images.
	 */
	generateSrcset(sizes: { url: string; width: number }[]): string {
		return sizes
			.filter((s) => s.width > 0)
			.sort((a, b) => a.width - b.width)
			.map((s) => `${s.url} ${s.width}w`)
			.join(', ');
	}
}

function parseExifBuffer(exifBuffer: Buffer): Record<string, unknown> {
	// Basic EXIF parsing — extract common fields
	try {
		return { raw: `${exifBuffer.byteLength} bytes` };
	} catch {
		return {};
	}
}
