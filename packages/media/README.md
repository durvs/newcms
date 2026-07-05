# @newcms/media

Media upload handling, image processing, and storage abstraction for [NewCMS](https://github.com/durvs/newcms) — a modern, TypeScript-first content management system.

## Installation

```bash
npm install @newcms/media
```

Image processing is powered by [sharp](https://sharp.pixelplumbing.com/) (libvips), installed as a dependency.

## Features

- **Upload pipeline** — MIME type allowlist, file size limits, and filename sanitization (lowercase, accent-stripped, safe characters only)
- **WordPress-style image sizes** — automatic generation of `thumbnail`, `medium`, `medium_large`, and `large` variants, with support for custom sizes
- **Metadata extraction** — dimensions, format, color space, alpha channel, and EXIF presence
- **Format conversion** — WebP, AVIF, JPEG, PNG with configurable quality
- **Pluggable storage** — a small `StorageAdapter` interface with a filesystem implementation included; bring your own S3/GCS/memory adapter
- **Date-based paths** — files are stored under `yyyy/mm/filename`, like a WordPress uploads directory

## Uploading Files

The `UploadManager` validates, stores, and (for images) processes an uploaded file in one call.

```typescript
import { UploadManager, LocalStorage, DEFAULT_IMAGE_SIZES } from '@newcms/media';

const storage = new LocalStorage('/var/www/uploads', 'https://example.com/uploads');
const uploads = new UploadManager(storage, DEFAULT_IMAGE_SIZES);

const result = await uploads.upload(buffer, 'Beach Photo.jpg', 'image/jpeg');

result.path; // "2026/07/beach-photo.jpg"
result.url; // "https://example.com/uploads/2026/07/beach-photo.jpg"
result.filename; // "beach-photo.jpg"
result.metadata; // { width, height, format, hasAlpha, fileSize, ... }
result.sizes; // [{ name: 'thumbnail', path, url, width: 150, height: 150 }, ...]
```

Uploads that fail validation throw:

```typescript
await uploads.upload(buffer, 'app.exe', 'application/x-msdownload');
// Error: File type "application/x-msdownload" is not allowed

const strict = new UploadManager(storage, DEFAULT_IMAGE_SIZES, 1024 * 1024); // 1MB limit
await strict.upload(bigBuffer, 'huge.png', 'image/png');
// Error: File size 8MB exceeds limit of 1MB
```

Allowed MIME types cover common images (JPEG, PNG, GIF, WebP, AVIF, SVG), video (MP4, WebM, Ogg), audio (MP3, Ogg, WAV, WebM), PDF, and plain text/CSV. Filenames are sanitized aggressively — `"Relatório (versão #2)!.txt"` becomes `"relatorio-versao-2-.txt"`.

To remove a file and its generated size variants:

```typescript
await uploads.delete(
	result.path,
	result.sizes.map((s) => s.path),
);
```

## Image Processing

The `ImageProcessor` can also be used standalone, without the upload pipeline.

```typescript
import { ImageProcessor, DEFAULT_IMAGE_SIZES } from '@newcms/media';

const processor = new ImageProcessor();

// Extract metadata
const meta = await processor.getMetadata(buffer);
// { width: 3000, height: 2000, format: 'jpeg', hasAlpha: false, fileSize: 123456, ... }

// Generate all size variants (skips sizes larger than the original, and 'full')
const variants = await processor.generateSizes(buffer, DEFAULT_IMAGE_SIZES, {
	format: 'webp',
	quality: 82,
});

// One-off operations
const resized = await processor.resize(buffer, 800, 600, { fit: 'cover', quality: 90 });
const webp = await processor.convert(buffer, 'webp', 82);
const upright = await processor.rotate(buffer); // auto-orient from EXIF

// Build a srcset for responsive images
const srcset = processor.generateSrcset(result.sizes.map((s) => ({ url: s.url, width: s.width })));
// "https://.../photo-thumbnail.jpg 150w, https://.../photo-medium.jpg 300w, ..."
```

### Default Image Sizes

`DEFAULT_IMAGE_SIZES` mirrors the WordPress defaults (`0` means "unconstrained"):

| Name           | Width | Height | Crop |
| -------------- | ----- | ------ | ---- |
| `thumbnail`    | 150   | 150    | yes  |
| `medium`       | 300   | 300    | no   |
| `medium_large` | 768   | 0      | no   |
| `large`        | 1024  | 1024   | no   |
| `full`         | 0     | 0      | no   |

Cropped sizes use `fit: cover` (center); uncropped sizes fit inside the box without enlargement.

## Storage Adapters

Storage is abstracted behind the `StorageAdapter` interface — the extension point for S3, GCS, or any other backend:

```typescript
interface StorageAdapter {
	write(path: string, buffer: Buffer, mimeType: string): Promise<string>; // returns public URL
	read(path: string): Promise<Buffer>;
	delete(path: string): Promise<boolean>;
	exists(path: string): Promise<boolean>;
	getUrl(path: string): string;
}
```

The included `LocalStorage` writes to the filesystem (creating directories as needed) and maps paths to a base URL:

```typescript
import { LocalStorage } from '@newcms/media';

const storage = new LocalStorage('./uploads', '/uploads');
await storage.write('2026/07/photo.jpg', buffer, 'image/jpeg'); // "/uploads/2026/07/photo.jpg"
await storage.exists('2026/07/photo.jpg'); // true
```

A custom adapter is just an object (or class) implementing the five methods — for example, an in-memory adapter for tests:

```typescript
import type { StorageAdapter } from '@newcms/media';

const files = new Map<string, Buffer>();

const memoryStorage: StorageAdapter = {
	async write(path, buffer) {
		files.set(path, buffer);
		return `/uploads/${path}`;
	},
	async read(path) {
		const b = files.get(path);
		if (!b) throw new Error('Not found');
		return b;
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
```

## API Reference

| Export                                                                           | Description                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `new UploadManager(storage, imageSizes, maxFileSize?)`                           | Upload pipeline (max size defaults to 10MB)                 |
| `UploadManager.upload(buffer, filename, mimeType)`                               | Validate, store, and process a file; returns `UploadResult` |
| `UploadManager.delete(path, sizes?)`                                             | Delete a file and its size variants                         |
| `new ImageProcessor()`                                                           | Sharp-backed image processor                                |
| `ImageProcessor.getMetadata(buffer)`                                             | Extract `ImageMetadata` from an image                       |
| `ImageProcessor.generateSizes(buffer, sizes, options?)`                          | Generate resized variants (`ProcessedImage[]`)              |
| `ImageProcessor.resize(buffer, width, height?, options?)`                        | Resize a single image                                       |
| `ImageProcessor.convert(buffer, format, quality?)`                               | Convert to WebP/AVIF/JPEG/PNG                               |
| `ImageProcessor.rotate(buffer, angle?)`                                          | Rotate, or auto-orient from EXIF                            |
| `ImageProcessor.generateSrcset(sizes)`                                           | Build a `srcset` attribute string                           |
| `new LocalStorage(basePath, baseUrl)`                                            | Filesystem `StorageAdapter`                                 |
| `DEFAULT_IMAGE_SIZES`                                                            | WordPress-style default `ImageSize[]`                       |
| `StorageAdapter`, `ImageSize`, `ProcessedImage`, `ImageMetadata`, `UploadResult` | Exported types                                              |

## License

GPL-2.0-or-later
