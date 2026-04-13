import { Module, Inject, type OnModuleInit } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database.module';
import { DatabaseProvider } from './database.provider';
import { HealthModule } from './modules/health/health.module';
import { PostsModule } from './modules/posts/posts.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { OptionsModule } from './modules/options/options.module';

@Module({
	imports: [
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
		DatabaseModule,
		HealthModule,
		PostsModule,
		UsersModule,
		AuthModule,
		TaxonomyModule,
		OptionsModule,
	],
})
export class AppModule implements OnModuleInit {
	constructor(@Inject(DatabaseProvider) private readonly dbProvider: DatabaseProvider) {}

	async onModuleInit() {
		console.log('Loading autoloaded options...');
		const options = await this.dbProvider.options.loadAutoloadedOptions();
		console.log(`   ${options.size} options loaded into cache`);
	}
}
