import { Global, Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import {
	createConnection,
	ObjectCache,
	OptionsRepository,
	PostRepository,
	TaxonomyRepository,
	RevisionRepository,
	type Database,
} from '@newcms/database';

@Injectable()
export class DatabaseProvider implements OnModuleDestroy {
	readonly db: Database;
	readonly cache: ObjectCache;
	readonly options: OptionsRepository;
	readonly posts: PostRepository;
	readonly taxonomy: TaxonomyRepository;
	readonly revisions: RevisionRepository;

	private client: ReturnType<typeof createConnection>['client'];

	constructor() {
		const conn = createConnection();
		this.db = conn.db;
		this.client = conn.client;

		this.cache = new ObjectCache({
			host: process.env['REDIS_HOST'] ?? 'localhost',
			port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
			keyPrefix: 'newcms',
		});

		// Connect Redis synchronously in constructor — will be ready by the time requests arrive
		this.cache.connect().catch((err: unknown) => {
			console.error('Failed to connect to Redis:', err);
		});

		this.options = new OptionsRepository(this.db, this.cache);
		this.posts = new PostRepository(this.db);
		this.taxonomy = new TaxonomyRepository(this.db);
		this.revisions = new RevisionRepository(this.db);
	}

	async onModuleDestroy() {
		await this.cache.disconnect();
		await this.client.end();
	}
}
