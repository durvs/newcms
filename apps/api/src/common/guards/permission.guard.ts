import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAPABILITY_KEY } from '../decorators/require-capability.decorator';
import { userHasCapability } from '@newcms/auth';
import type { AuthenticatedRequest } from './auth.guard';

/**
 * Guard that checks if the authenticated user has the required capability.
 * Must be used AFTER AuthGuard (which sets req.user).
 */
@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(@Inject(Reflector) private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredCapability = this.reflector.getAllAndOverride<string | undefined>(
			CAPABILITY_KEY,
			[context.getHandler(), context.getClass()],
		);

		// No capability required — allow
		if (!requiredCapability) return true;

		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const user = request.user;

		if (!user) {
			throw new ForbiddenException('Authentication required');
		}

		if (!userHasCapability(user.roles, requiredCapability)) {
			throw new ForbiddenException(`You do not have the "${requiredCapability}" capability`);
		}

		return true;
	}
}
