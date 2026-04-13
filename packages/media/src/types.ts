/**
 * Media processing types.
 */

export interface ImageSize {
	name: string;
	width: number;
	height: number;
	crop: boolean;
}

export interface ProcessedImage {
	size: ImageSize;
	buffer: Buffer;
	format: string;
	width: number;
	height: number;
	byteLength: number;
}

export interface ImageMetadata {
	width: number;
	height: number;
	format: string;
	space?: string;
	channels?: number;
	hasAlpha: boolean;
	fileSize: number;
	/** EXIF data if available */
	exif?: Record<string, unknown>;
}

export interface UploadResult {
	path: string;
	url: string;
	filename: string;
	mimeType: string;
	size: number;
	metadata: ImageMetadata;
	sizes: { name: string; path: string; url: string; width: number; height: number }[];
}

export interface StorageAdapter {
	/** Write a file to storage */
	write(path: string, buffer: Buffer, mimeType: string): Promise<string>;
	/** Read a file from storage */
	read(path: string): Promise<Buffer>;
	/** Delete a file from storage */
	delete(path: string): Promise<boolean>;
	/** Check if a file exists */
	exists(path: string): Promise<boolean>;
	/** Get the public URL for a path */
	getUrl(path: string): string;
}

/**
 * Default image sizes (matching WordPress defaults + modern additions).
 */
export const DEFAULT_IMAGE_SIZES: ImageSize[] = [
	{ name: 'thumbnail', width: 150, height: 150, crop: true },
	{ name: 'medium', width: 300, height: 300, crop: false },
	{ name: 'medium_large', width: 768, height: 0, crop: false },
	{ name: 'large', width: 1024, height: 1024, crop: false },
	{ name: 'full', width: 0, height: 0, crop: false },
];
