import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Body,
	Query,
	Inject,
	UseGuards,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequireCapability } from '../../common/decorators/require-capability.decorator';
import { DatabaseProvider } from '../../database.provider';
import { QueryEngine } from '@newcms/query-engine';

@ApiTags('posts')
@Controller('v2/posts')
export class PostsController {
	private queryEngine: QueryEngine;

	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {
		this.queryEngine = new QueryEngine(dbProvider.db);
	}

	@Get()
	@ApiOperation({ summary: 'List posts' })
	@ApiQuery({ name: 'page', required: false, type: Number })
	@ApiQuery({ name: 'per_page', required: false, type: Number })
	@ApiQuery({ name: 'search', required: false, type: String })
	@ApiQuery({ name: 'status', required: false, type: String })
	@ApiQuery({ name: 'type', required: false, type: String })
	@ApiQuery({ name: 'author', required: false, type: Number })
	@ApiQuery({ name: 'orderby', required: false, type: String })
	@ApiQuery({ name: 'order', required: false, type: String })
	async list(
		@Query('page') page?: string,
		@Query('per_page') perPage?: string,
		@Query('search') search?: string,
		@Query('status') status?: string,
		@Query('type') type?: string,
		@Query('author') author?: string,
		@Query('orderby') orderby?: string,
		@Query('order') order?: string,
	) {
		const result = await this.queryEngine.query({
			page: page ? parseInt(page, 10) : 1,
			perPage: perPage ? parseInt(perPage, 10) : 10,
			search: search || undefined,
			postStatus: status || 'publish',
			postType: type || 'post',
			author: author ? parseInt(author, 10) : undefined,
			orderBy: (orderby as 'date' | 'title' | 'id') || 'date',
			order: (order as 'asc' | 'desc') || 'desc',
		});

		return {
			posts: result.posts,
			total: result.total,
			totalPages: result.totalPages,
			page: result.page,
			perPage: result.perPage,
		};
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a post by ID' })
	@ApiParam({ name: 'id', type: Number })
	async getById(@Param('id', ParseIntPipe) id: number) {
		const post = await this.dbProvider.posts.getById(id);
		if (!post) throw new NotFoundException(`Post ${id} not found`);
		return post;
	}

	@Post()
	@ApiOperation({ summary: 'Create a new post' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('edit_posts')
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body()
		body: {
			title: string;
			content?: string;
			excerpt?: string;
			status?: string;
			type?: string;
			slug?: string;
			author?: number;
		},
	) {
		const post = await this.dbProvider.posts.create({
			postAuthor: body.author ?? 1,
			postTitle: body.title,
			postContent: body.content ?? '',
			postExcerpt: body.excerpt ?? '',
			postStatus: body.status ?? 'draft',
			postType: body.type ?? 'post',
			postName: body.slug,
		});

		// Create initial revision
		await this.dbProvider.revisions.createRevision(post, post.postAuthor);

		return post;
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update a post' })
	@ApiParam({ name: 'id', type: Number })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('edit_posts')
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body()
		body: {
			title?: string;
			content?: string;
			excerpt?: string;
			status?: string;
			slug?: string;
		},
	) {
		const post = await this.dbProvider.posts.update(id, {
			postTitle: body.title,
			postContent: body.content,
			postExcerpt: body.excerpt,
			postStatus: body.status,
			postName: body.slug,
		});
		if (!post) throw new NotFoundException(`Post ${id} not found`);

		// Create revision
		await this.dbProvider.revisions.createRevision(post, post.postAuthor);

		return post;
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Trash or delete a post' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('delete_posts')
	@ApiParam({ name: 'id', type: Number })
	@ApiQuery({ name: 'force', required: false, type: Boolean })
	async remove(
		@Param('id', ParseIntPipe) id: number,
		@Query('force') force?: string,
	) {
		if (force === 'true') {
			const deleted = await this.dbProvider.posts.deletePermanently(id);
			if (!deleted) throw new NotFoundException(`Post ${id} not found`);
			return { deleted: true };
		}

		const trashed = await this.dbProvider.posts.trash(id);
		if (!trashed) throw new NotFoundException(`Post ${id} not found`);
		return trashed;
	}

	// ─── Post Meta ───────────────────────────────────────────

	@Get(':id/meta/:key')
	@ApiOperation({ summary: 'Get a post meta value' })
	@ApiParam({ name: 'id', type: Number })
	@ApiParam({ name: 'key', type: String })
	async getMeta(
		@Param('id', ParseIntPipe) id: number,
		@Param('key') key: string,
	) {
		const value = await this.dbProvider.posts.meta.get(id, key);
		return { key, value: value ?? null };
	}

	@Put(':id/meta/:key')
	@ApiOperation({ summary: 'Set a post meta value' })
	@ApiParam({ name: 'id', type: Number })
	@ApiParam({ name: 'key', type: String })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('edit_posts')
	async setMeta(
		@Param('id', ParseIntPipe) id: number,
		@Param('key') key: string,
		@Body() body: { value: unknown },
	) {
		await this.dbProvider.posts.meta.update(id, key, body.value);
		return { key, value: body.value, updated: true };
	}
}
