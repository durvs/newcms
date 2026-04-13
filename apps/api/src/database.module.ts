import { Global, Module } from '@nestjs/common';
import { DatabaseProvider } from './database.provider.js';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';

@Global()
@Module({
	providers: [DatabaseProvider, AuthGuard, PermissionGuard],
	exports: [DatabaseProvider, AuthGuard, PermissionGuard],
})
export class DatabaseModule {}
