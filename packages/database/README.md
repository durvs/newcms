# @newcms/database

Database schema, Redis object cache, and repositories for [NewCMS](https://github.com/durvs/newcms) — a modern, TypeScript-first content management system.

## Installation

```bash
npm install @newcms/database
```

**Requirements:** PostgreSQL 17+ and Redis 7+.

## Database Schema

Type-safe [Drizzle ORM](https://orm.drizzle.team/) schema with 14 tables covering the full CMS data model:

```typescript
import {
	posts,
	postmeta,
	users,
	usermeta,
	comments,
	commentmeta,
	terms,
	termTaxonomy,
	termRelationships,
	termmeta,
	options,
	links,
	sessions,
	scheduledEvents,
} from '@newcms/database/schema';
```

### Tables

| Table                | Purpose                                                     |
| -------------------- | ----------------------------------------------------------- |
| `posts`              | All content types (posts, pages, attachments, custom types) |
| `postmeta`           | Post metadata (EAV with JSONB support)                      |
| `users`              | User accounts                                               |
| `usermeta`           | User metadata                                               |
| `comments`           | Threaded comments                                           |
| `commentmeta`        | Comment metadata                                            |
| `terms`              | Taxonomy terms                                              |
| `term_taxonomy`      | Term-taxonomy relationships with hierarchy                  |
| `term_relationships` | Object-term assignments                                     |
| `termmeta`           | Term metadata                                               |
| `options`            | Site settings (with autoload and JSONB)                     |
| `links`              | Blogroll / link manager                                     |
| `sessions`           | User sessions (Redis-backed with DB fallback)               |
| `scheduled_events`   | Cron-like scheduled tasks (BullMQ-backed)                   |

### Key Design Decisions

- **JSONB columns** on all meta tables — queryable structured data instead of opaque serialized text
- **GIN indexes** on JSONB columns for efficient structured queries
- **Composite indexes** on frequently queried combinations (e.g., `post_type + status + date`)
- **Dedicated tables** for sessions and scheduled events (instead of serialized blobs in options/usermeta)

## Connection

```typescript
import { createConnection } from '@newcms/database';

// From environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
const { db, client } = createConnection();

// Or with explicit config
const { db, client } = createConnection({
	host: 'localhost',
	port: 5432,
	database: 'newcms',
	user: 'newcms',
	password: 'your-secure-password',
});

// Use Drizzle query builder
const allPosts = await db.select().from(posts);
```

**Note:** `DB_PASSWORD` is required — there is no default. Set it in your environment or `.env` file.

## Object Cache

Redis-backed object cache with group isolation, TTL, and multisite support:

```typescript
import { ObjectCache } from '@newcms/database';

const cache = new ObjectCache({
	host: 'localhost',
	port: 6379,
});
await cache.connect();

// Basic get/set
await cache.set('my_key', { hello: 'world' }, 'my_group');
const value = await cache.get('my_key', 'my_group');

// TTL (in seconds)
await cache.set('temp', 'data', 'default', 300); // expires in 5 min

// Batch operations (uses Redis pipeline)
await cache.setMultiple({ a: 1, b: 2, c: 3 }, 'counters');
const results = await cache.getMultiple(['a', 'b', 'c'], 'counters');

// Increment/decrement
await cache.set('views', 0);
await cache.incr('views'); // => 1

// Group-level TTL
cache.setGroupTtl('transients', 3600); // 1 hour for all transients

// Multisite: global groups shared across sites
cache.addGlobalGroups(['users', 'site-options']);
cache.setSiteId(2); // switch site context

// Flush
await cache.flushGroup('posts'); // flush one group
await cache.flushAll(); // flush everything
```

## Options Repository

CRUD for site options with integrated Redis cache:

```typescript
import { createConnection, ObjectCache, OptionsRepository } from '@newcms/database';

const { db } = createConnection();
const cache = new ObjectCache({ host: 'localhost', port: 6379 });
await cache.connect();

const options = new OptionsRepository(db, cache);

// Read (with cache — hits DB only on first read)
const siteName = await options.getOption('blogname');
const perPage = await options.getOption('posts_per_page', 10); // with default

// Write (invalidates cache automatically)
await options.updateOption('blogname', 'My New Site');
await options.addOption('custom_setting', { enabled: true, threshold: 50 });

// Delete
await options.deleteOption('old_setting');

// Bootstrap: pre-load all autoloaded options into cache
const allOptions = await options.loadAutoloadedOptions();
```

### Cache Behavior

- **Autoloaded options** are bulk-loaded into Redis on bootstrap
- **Cache-aside pattern** — reads check cache first, fall back to DB
- **Not-found caching** — missing keys are cached to prevent repeated DB misses
- **Granular invalidation** — writes invalidate only the affected key
- **JSONB** — complex values (objects, arrays) stored in queryable JSONB column

## Environment Variables

| Variable             | Required | Default     | Description          |
| -------------------- | -------- | ----------- | -------------------- |
| `DB_HOST`            | No       | `localhost` | PostgreSQL host      |
| `DB_PORT`            | No       | `5432`      | PostgreSQL port      |
| `DB_NAME`            | No       | `newcms`    | Database name        |
| `DB_USER`            | No       | `newcms`    | Database user        |
| `DB_PASSWORD`        | **Yes**  | —           | Database password    |
| `DB_MAX_CONNECTIONS` | No       | `10`        | Connection pool size |

## License

GPL-2.0-or-later
