import { SetMetadata } from '@nestjs/common';

export const CAPABILITY_KEY = 'required_capability';

/**
 * Decorator to protect an endpoint with a capability check.
 *
 * Usage:
 *   @RequireCapability('edit_posts')
 *   @UseGuards(AuthGuard, PermissionGuard)
 */
export const RequireCapability = (capability: string) =>
	SetMetadata(CAPABILITY_KEY, capability);
