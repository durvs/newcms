import {
	Controller,
	Post,
	Body,
	Inject,
	Req,
	HttpCode,
	HttpStatus,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { DatabaseProvider } from '../../database.provider';
import { hashPassword, verifyPassword, SessionManager } from '@newcms/auth';
import { eq, or } from 'drizzle-orm';
import { users } from '@newcms/database';

const AUTH_SECRET = process.env['AUTH_SECRET'] ?? 'newcms-dev-secret-change-in-production';

@ApiTags('auth')
@Controller('v2/auth')
export class AuthController {
	private sessionManager: SessionManager;

	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {
		this.sessionManager = new SessionManager(dbProvider.cache.getRedis());
	}

	@Post('login')
	@ApiOperation({ summary: 'Authenticate and create a session' })
	@Throttle({ default: { ttl: 60000, limit: 5 } })
	@HttpCode(HttpStatus.OK)
	async login(@Body() body: { login: string; password: string }, @Req() req: Request) {
		if (!body.login || !body.password) {
			throw new UnauthorizedException('Login and password are required');
		}

		const rows = await this.dbProvider.db
			.select()
			.from(users)
			.where(or(eq(users.userLogin, body.login), eq(users.userEmail, body.login)))
			.limit(1);

		if (rows.length === 0) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const user = rows[0];

		const { valid, needsRehash } = await verifyPassword(body.password, user.userPass, AUTH_SECRET);

		if (!valid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		if (needsRehash) {
			const newHash = await hashPassword(body.password, AUTH_SECRET);
			await this.dbProvider.db
				.update(users)
				.set({ userPass: newHash })
				.where(eq(users.id, user.id));
		}

		// Create session in Redis
		const { token, session } = await this.sessionManager.create({
			userId: user.id,
			ip: req.ip ?? '',
			userAgent: req.headers['user-agent'] ?? '',
		});

		return {
			token: `${user.id}:${token}`,
			user: {
				id: user.id,
				login: user.userLogin,
				email: user.userEmail,
				displayName: user.displayName,
			},
			expiresAt: new Date(session.expiresAt * 1000).toISOString(),
		};
	}

	@Post('logout')
	@ApiOperation({ summary: 'Destroy current session' })
	@HttpCode(HttpStatus.OK)
	async logout(@Req() req: Request) {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith('Bearer ')) {
			return { message: 'No active session' };
		}

		const token = authHeader.slice(7);
		const colonIndex = token.indexOf(':');
		if (colonIndex === -1) return { message: 'Invalid token' };

		const userId = parseInt(token.substring(0, colonIndex), 10);
		const sessionToken = token.substring(colonIndex + 1);

		if (!isNaN(userId)) {
			await this.sessionManager.destroy(userId, sessionToken);
		}

		return { message: 'Logged out' };
	}

	@Post('hash-password')
	@ApiOperation({ summary: 'Hash a password (dev/setup utility)' })
	@HttpCode(HttpStatus.OK)
	async hashPasswordEndpoint(@Body() body: { password: string }) {
		const hash = await hashPassword(body.password, AUTH_SECRET);
		return { hash };
	}
}
