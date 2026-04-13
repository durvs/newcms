import {
	Controller,
	Post,
	Get,
	Delete,
	Param,
	Query,
	Inject,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	ParseIntPipe,
	BadRequestException,
	NotFoundException,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { resolve } from 'path';
import { DatabaseProvider } from '../../database.provider';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequireCapability } from '../../common/decorators/require-capability.decorator';
import { UploadManager, LocalStorage, DEFAULT_IMAGE_SIZES } from '@newcms/media';

const UPLOADS_DIR = resolve(process.cwd(), '../../uploads');
const UPLOADS_URL = '/uploads';

@ApiTags('media')
@Controller('v2/media')
export class MediaController {
	private uploadManager: UploadManager;

	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {
		const storage = new LocalStorage(UPLOADS_DIR, UPLOADS_URL);
		this.uploadManager = new UploadManager(storage, DEFAULT_IMAGE_SIZES);
	}

	@Post('upload')
	@ApiOperation({ summary: 'Upload a file' })
	@ApiConsumes('multipart/form-data')
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('upload_files')
	@UseInterceptors(FileInterceptor('file'))
	@HttpCode(HttpStatus.CREATED)
	async upload(@UploadedFile() file: Express.Multer.File) {
		if (!file) throw new BadRequestException('No file uploaded');

		const result = await this.uploadManager.upload(
			file.buffer,
			file.originalname,
			file.mimetype,
		);

		// Create attachment post
		const post = await this.dbProvider.posts.create({
			postAuthor: 1,
			postTitle: file.originalname.replace(/\.[^.]+$/, ''),
			postType: 'attachment',
			postStatus: 'inherit',
			postMimeType: file.mimetype,
			guid: result.url,
		});

		// Store metadata
		await this.dbProvider.posts.meta.add(post.id, '_file_path', result.path);
		await this.dbProvider.posts.meta.add(post.id, '_file_url', result.url);
		await this.dbProvider.posts.meta.add(post.id, '_file_metadata', result.metadata);
		if (result.sizes.length > 0) {
			await this.dbProvider.posts.meta.add(post.id, '_file_sizes', result.sizes);
		}

		return {
			id: post.id,
			url: result.url,
			filename: result.filename,
			mimeType: result.mimeType,
			size: result.size,
			metadata: result.metadata,
			sizes: result.sizes,
		};
	}

	@Get()
	@ApiOperation({ summary: 'List media files' })
	@ApiQuery({ name: 'page', required: false })
	@ApiQuery({ name: 'per_page', required: false })
	@ApiQuery({ name: 'mime_type', required: false })
	async list(
		@Query('page') page?: string,
		@Query('per_page') perPage?: string,
		@Query('mime_type') mimeType?: string,
	) {
		const { QueryEngine } = await import('@newcms/query-engine');
		const qe = new QueryEngine(this.dbProvider.db);

		const result = await qe.query({
			postType: 'attachment',
			postStatus: 'inherit',
			page: page ? parseInt(page, 10) : 1,
			perPage: perPage ? parseInt(perPage, 10) : 20,
		});

		// Enrich with URLs from meta
		const enriched = await Promise.all(
			result.posts.map(async (p: Record<string, unknown>) => {
				const url = await this.dbProvider.posts.meta.get<string>(p.id as number, '_file_url');
				const sizes = await this.dbProvider.posts.meta.get(p.id as number, '_file_sizes');
				return { ...p, url, sizes };
			}),
		);

		return {
			media: enriched,
			total: result.total,
			totalPages: result.totalPages,
			page: result.page,
		};
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a media file' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('upload_files')
	async remove(@Param('id', ParseIntPipe) id: number) {
		const path = await this.dbProvider.posts.meta.get<string>(id, '_file_path');
		const sizes = await this.dbProvider.posts.meta.get<{ path: string }[]>(id, '_file_sizes');

		if (path) {
			await this.uploadManager.delete(path, sizes?.map((s) => s.path));
		}

		await this.dbProvider.posts.deletePermanently(id);
		return { deleted: true };
	}
}
