import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Body,
	Inject,
	UseGuards,
	ParseIntPipe,
	HttpCode,
	HttpStatus,
	NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseProvider } from '../../database.provider';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequireCapability } from '../../common/decorators/require-capability.decorator';
import { hashPassword } from '@newcms/auth';
import { eq } from 'drizzle-orm';
import { users } from '@newcms/database';

const AUTH_SECRET = process.env['AUTH_SECRET'] ?? 'newcms-dev-secret-change-in-production';

@ApiTags('users')
@Controller('v2/users')
export class UsersController {
	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {}

	@Get()
	@ApiOperation({ summary: 'List users' })
	async list() {
		const rows = await this.dbProvider.db
			.select({
				id: users.id,
				login: users.userLogin,
				nicename: users.userNicename,
				email: users.userEmail,
				url: users.userUrl,
				registered: users.userRegistered,
				displayName: users.displayName,
			})
			.from(users)
			.orderBy(users.userLogin);

		return rows;
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a user by ID' })
	@ApiParam({ name: 'id', type: Number })
	async getById(@Param('id', ParseIntPipe) id: number) {
		const rows = await this.dbProvider.db
			.select({
				id: users.id,
				login: users.userLogin,
				nicename: users.userNicename,
				email: users.userEmail,
				url: users.userUrl,
				registered: users.userRegistered,
				displayName: users.displayName,
			})
			.from(users)
			.where(eq(users.id, id))
			.limit(1);

		if (rows.length === 0) throw new NotFoundException(`User ${id} not found`);
		return rows[0];
	}

	@Post()
	@ApiOperation({ summary: 'Create a new user' })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('create_users')
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body()
		body: {
			login: string;
			email: string;
			password: string;
			displayName?: string;
			role?: string;
		},
	) {
		const passwordHash = await hashPassword(body.password, AUTH_SECRET);

		const [user] = await this.dbProvider.db
			.insert(users)
			.values({
				userLogin: body.login,
				userEmail: body.email,
				userPass: passwordHash,
				userNicename: body.login.toLowerCase(),
				displayName: body.displayName ?? body.login,
			})
			.returning({
				id: users.id,
				login: users.userLogin,
				email: users.userEmail,
				displayName: users.displayName,
				registered: users.userRegistered,
			});

		return user;
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update a user' })
	@ApiParam({ name: 'id', type: Number })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('edit_users')
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body()
		body: {
			email?: string;
			displayName?: string;
			password?: string;
			url?: string;
		},
	) {
		const existing = await this.dbProvider.db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, id))
			.limit(1);

		if (existing.length === 0) throw new NotFoundException(`User ${id} not found`);

		const updateData: Record<string, unknown> = {};
		if (body.email !== undefined) updateData['userEmail'] = body.email;
		if (body.displayName !== undefined) updateData['displayName'] = body.displayName;
		if (body.url !== undefined) updateData['userUrl'] = body.url;
		if (body.password !== undefined) {
			updateData['userPass'] = await hashPassword(body.password, AUTH_SECRET);
		}

		const [updated] = await this.dbProvider.db
			.update(users)
			.set(updateData)
			.where(eq(users.id, id))
			.returning({
				id: users.id,
				login: users.userLogin,
				email: users.userEmail,
				displayName: users.displayName,
			});

		return updated;
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a user' })
	@ApiParam({ name: 'id', type: Number })
	@ApiBearerAuth()
	@UseGuards(AuthGuard, PermissionGuard)
	@RequireCapability('delete_users')
	async remove(@Param('id', ParseIntPipe) id: number) {
		const result = await this.dbProvider.db
			.delete(users)
			.where(eq(users.id, id))
			.returning({ id: users.id });

		if (result.length === 0) throw new NotFoundException(`User ${id} not found`);
		return { deleted: true };
	}
}
