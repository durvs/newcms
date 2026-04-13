# @newcms/query-engine

Declarative, type-safe query engine for [NewCMS](https://github.com/durvs/newcms). Build complex content queries with taxonomy, meta, and date sub-queries — all compiled to efficient SQL via Drizzle ORM.

## Installation

```bash
npm install @newcms/query-engine @newcms/database
```

## Quick Start

```typescript
import { createConnection } from '@newcms/database';
import { QueryEngine } from '@newcms/query-engine';

const { db } = createConnection();
const engine = new QueryEngine(db);

// Get published posts, newest first
const result = await engine.query({
  postType: 'post',
  postStatus: 'publish',
  perPage: 10,
  page: 1,
});

console.log(result.posts);       // Post[]
console.log(result.total);       // Total matching posts
console.log(result.totalPages);  // Total pages
console.log(result.flags);       // { isHome, isSingle, isArchive, ... }
```

## Query Parameters

```typescript
const result = await engine.query({
  // Content type
  postType: 'post',              // string or string[]
  postStatus: 'publish',         // string or string[]

  // Filters
  author: 1,                     // number or number[]
  search: 'hello world',         // full-text search
  slug: 'my-post',               // string or string[]
  parent: 0,                     // for hierarchical types
  include: [1, 2, 3],            // only these IDs
  exclude: [4, 5],               // not these IDs

  // Pagination
  perPage: 10,                   // -1 for all results
  page: 1,

  // Ordering
  orderBy: 'date',               // date | title | name | modified | id | author | menu_order
  order: 'desc',                 // asc | desc
});
```

## Taxonomy Sub-Query

Filter posts by assigned terms:

```typescript
const result = await engine.query({
  tax: {
    relation: 'AND',  // all clauses must match
    clauses: [
      { taxonomy: 'category', termSlugs: ['news', 'tech'], operator: 'IN' },
      { taxonomy: 'post_tag', termIds: [42], operator: 'IN' },
    ],
  },
});
```

**Operators:**
- `IN` — post has any of the specified terms (default)
- `NOT IN` — post does NOT have any of the specified terms
- `AND` — post has ALL specified terms

## Meta Sub-Query

Filter posts by metadata values:

```typescript
const result = await engine.query({
  meta: {
    relation: 'AND',
    clauses: [
      { key: '_featured', compare: 'EXISTS' },
      { key: 'rating', value: 4, compare: '>=', type: 'NUMERIC' },
      { key: 'color', value: 'red', compare: '=' },
    ],
  },
});
```

**Compare operators:** `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `NOT LIKE`, `IN`, `NOT IN`, `EXISTS`, `NOT EXISTS`

**Type casting:** `CHAR` (default), `NUMERIC`, `DATE`, `DATETIME`

## Date Sub-Query

Filter posts by date:

```typescript
const result = await engine.query({
  date: {
    relation: 'AND',
    clauses: [
      { year: 2026, month: 4 },
      { after: '2026-01-01', before: '2026-12-31' },
      { column: 'post_modified' },  // default: post_date
    ],
  },
});
```

## Query Flags

Every result includes flags indicating the query type:

```typescript
result.flags.isHome      // Default blog listing
result.flags.isSingle    // Single post/page
result.flags.isArchive   // Archive (author, taxonomy, date)
result.flags.isSearch    // Search results
result.flags.is404       // No results found
result.flags.isPage      // Page type query
result.flags.isAuthor    // Author archive
result.flags.isTaxonomy  // Taxonomy archive
result.flags.isDate      // Date archive
```

## Single Post Query

```typescript
const result = await engine.querySingle(42);
// Queries post ID 42 with status publish/private/draft
```

## License

GPL-2.0-or-later
