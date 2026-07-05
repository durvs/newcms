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
	Req,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	NotFoundException,
	BadRequestException,
	ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { DatabaseProvider } from '../../database.provider';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequireCapability } from '../../common/decorators/require-capability.decorator';

@ApiTags('comments')
@Controller('v2/comments')
export class CommentsController {
	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {}

	@Get()
	@ApiOperation({ summary: 'List comments' })
	@ApiQuery({ name: 'post', required: false, type: Number })
	@ApiQuery({ name: 'status', required: false, type: String })
	async list(@Query('post') postId?: string, @Query('status') status?: string) {
		if (postId) {
			return this.dbProvider.comments.getByPost(parseInt(postId, 10), status);
		}
		return this.dbProvider.comments.countByStatus();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get comment by ID' })
	@ApiParam({ name: 'id', type: Number })
	async getById(@Param('id', ParseIntPipe) id: number) {
		const comment = await this.dbProvider.comments.getById(id);
		if (!comment) throw new NotFoundException(`Comment ${id} not found`);
		return comment;
	}

	@Post()
	@ApiOperation({ summary: 'Create a comment' })
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body()
		body: {
			post: number;
			author: string;
			author_email?: string;
			author_url?: string;
			content: string;
			parent?: number;
		},
		@Req() req: Request,
	) {
		if (!body.post || !body.content || !body.author) {
			throw new BadRequestException('post, author, and content are required');
		}

		// Duplicate check
		if (body.author_email) {
			const isDup = await this.dbProvider.comments.isDuplicate(
				body.post,
				body.author_email,
				body.content,
			);
			if (isDup) throw new ConflictException('Duplicate comment');
		}

		// Flood check
		const ip = req.ip ?? '';
		const isFlood = await this.dbProvider.comments.isFlooding(ip, 15);
		if (isFlood) throw new BadRequestException('You are posting too quickly. Please slow down.');

		// Moderation
		const modResult = this.dbProvider.comments.moderate(body.content, body.author_email ?? '', {
			maxLinks: 2,
		});

		const approved = modResult === 'approve' ? '1' : modResult === 'hold' ? '0' : 'spam';

		return this.dbProvider.comments.create({
			commentPostId: body.post,
			commentAuthor: body.author,
			commentAuthorEmail: body.author_email,
			commentAuthorUrl: body.author_url,
			commentAuthorIp: ip,
			commentContent: body.content,
			commentParent: body.parent,
			commentApproved: approved,
		});
	}

	@Put(':id/approve')
	@ApiOperation({ summary: 'Approve a comment' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('moderate_comments')
	async approve(@Param('id', ParseIntPipe) id: number) {
		const ok = await this.dbProvider.comments.approve(id);
		if (!ok) throw new NotFoundException(`Comment ${id} not found`);
		return { approved: true };
	}

	@Put(':id/unapprove')
	@ApiOperation({ summary: 'Unapprove a comment' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('moderate_comments')
	async unapprove(@Param('id', ParseIntPipe) id: number) {
		const ok = await this.dbProvider.comments.unapprove(id);
		if (!ok) throw new NotFoundException(`Comment ${id} not found`);
		return { unapproved: true };
	}

	@Put(':id/spam')
	@ApiOperation({ summary: 'Mark comment as spam' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('moderate_comments')
	async spam(@Param('id', ParseIntPipe) id: number) {
		const ok = await this.dbProvider.comments.spam(id);
		if (!ok) throw new NotFoundException(`Comment ${id} not found`);
		return { spam: true };
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Trash or delete a comment' })
	@ApiQuery({ name: 'force', required: false, type: Boolean })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('moderate_comments')
	async remove(@Param('id', ParseIntPipe) id: number, @Query('force') force?: string) {
		if (force === 'true') {
			const ok = await this.dbProvider.comments.deletePermanently(id);
			if (!ok) throw new NotFoundException(`Comment ${id} not found`);
			return { deleted: true };
		}
		const ok = await this.dbProvider.comments.trash(id);
		if (!ok) throw new NotFoundException(`Comment ${id} not found`);
		return { trashed: true };
	}
}
