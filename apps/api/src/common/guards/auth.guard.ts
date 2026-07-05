import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Inject,
	UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseProvider } from '../../database.provider';
import { SessionManager, verifyAppPassword } from '@newcms/auth';
import { eq, and } from 'drizzle-orm';
import { users, usermeta } from '@newcms/database';

export interface AuthenticatedRequest extends Request {
	user: {
		id: number;
		login: string;
		email: string;
		roles: string[];
	};
}

/**
 * Guard that authenticates requests via:
 * 1. Bearer token (session token)
 * 2. HTTP Basic Auth (app passwords)
 *
 * Sets req.user on success.
 */
@Injectable()
export class AuthGuard implements CanActivate {
	private sessionManager: SessionManager;

	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {
		this.sessionManager = new SessionManager(dbProvider.cache.getRedis());
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

		// Try Bearer token first
		const authHeader = request.headers.authorization;
		if (authHeader?.startsWith('Bearer ')) {
			return this.authenticateBearer(request, authHeader.slice(7));
		}

		// Try Basic Auth (app passwords)
		if (authHeader?.startsWith('Basic ')) {
			return this.authenticateBasic(request, authHeader.slice(6));
		}

		throw new UnauthorizedException('Authentication required');
	}

	private async authenticateBearer(request: AuthenticatedRequest, token: string): Promise<boolean> {
		// Token format: {userId}:{sessionToken}
		const colonIndex = token.indexOf(':');
		if (colonIndex === -1) throw new UnauthorizedException('Invalid token format');

		const userId = parseInt(token.substring(0, colonIndex), 10);
		const sessionToken = token.substring(colonIndex + 1);

		if (isNaN(userId)) throw new UnauthorizedException('Invalid token format');

		const session = await this.sessionManager.validate(userId, sessionToken);
		if (!session) throw new UnauthorizedException('Invalid or expired session');

		await this.loadUser(request, userId);
		return true;
	}

	private async authenticateBasic(
		request: AuthenticatedRequest,
		encoded: string,
	): Promise<boolean> {
		const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
		const colonIndex = decoded.indexOf(':');
		if (colonIndex === -1) throw new UnauthorizedException('Invalid credentials');

		const username = decoded.substring(0, colonIndex);
		const password = decoded.substring(colonIndex + 1);

		// Find user
		const userRows = await this.dbProvider.db
			.select()
			.from(users)
			.where(eq(users.userLogin, username))
			.limit(1);

		if (userRows.length === 0) throw new UnauthorizedException('Invalid credentials');
		const user = userRows[0];

		// Check app passwords stored in usermeta
		const appPasswords = await this.dbProvider.db
			.select({ metaValue: usermeta.metaValue })
			.from(usermeta)
			.where(eq(usermeta.userId, user.id));

		const appPassEntries = appPasswords.filter(
			(m) => m.metaValue && m.metaValue.startsWith('{') && m.metaValue.includes('"hash"'),
		);

		let authenticated = false;
		for (const entry of appPassEntries) {
			try {
				const parsed = JSON.parse(entry.metaValue!) as { hash: string };
				if (verifyAppPassword(password, parsed.hash)) {
					authenticated = true;
					break;
				}
			} catch {
				continue;
			}
		}

		if (!authenticated) throw new UnauthorizedException('Invalid credentials');

		await this.loadUser(request, user.id);
		return true;
	}

	private async loadUser(request: AuthenticatedRequest, userId: number): Promise<void> {
		const userRows = await this.dbProvider.db
			.select({
				id: users.id,
				login: users.userLogin,
				email: users.userEmail,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (userRows.length === 0) throw new UnauthorizedException('User not found');

		// Load roles from usermeta (capabilities meta key)
		const capsMeta = await this.dbProvider.db
			.select({ metaValue: usermeta.metaValue })
			.from(usermeta)
			.where(and(eq(usermeta.userId, userId), eq(usermeta.metaKey, 'capabilities')))
			.limit(1);

		let userRoles: string[] = ['subscriber'];
		if (capsMeta.length > 0 && capsMeta[0].metaValue) {
			try {
				const parsed = JSON.parse(capsMeta[0].metaValue);
				if (typeof parsed === 'object' && parsed !== null) {
					userRoles = Object.keys(parsed).filter((k) => parsed[k] === true);
				}
			} catch {
				// default to subscriber
			}
		}

		request.user = {
			id: userRows[0].id,
			login: userRows[0].login,
			email: userRows[0].email,
			roles: userRoles,
		};
	}
}
