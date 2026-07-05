# @newcms/core

Core hook engine, types, and constants for [NewCMS](https://github.com/durvs/newcms) — a modern, TypeScript-first content management system.

## Installation

```bash
npm install @newcms/core
```

## Hook Engine

The `HookEngine` is the backbone of NewCMS extensibility. It implements a priority-based action/filter system that allows plugins and themes to modify behavior without touching core code.

### Actions

Actions are hooks that trigger side effects. Multiple callbacks can be registered at different priorities.

```typescript
import { HookEngine } from '@newcms/core';

const hooks = new HookEngine();

// Register an action (priority 10 by default)
hooks.addAction('post_saved', (postId) => {
	console.log(`Post ${postId} was saved`);
});

// Register with custom priority (lower = earlier)
hooks.addAction(
	'post_saved',
	(postId) => {
		invalidateCache(postId);
	},
	{ priority: 5 },
);

// Fire the action
await hooks.doAction('post_saved', 42);
```

### Filters

Filters transform a value through a chain of callbacks. Each callback receives the (possibly modified) value and returns a new one.

```typescript
// Register filters
hooks.addFilter('post_title', (title) => title.trim());
hooks.addFilter('post_title', (title) => `${title} — My Site`, { priority: 20 });

// Apply the filter chain
const title = await hooks.applyFilters('post_title', '  Hello World  ');
// => "Hello World — My Site"
```

### Features

- **Priority ordering** — lower number executes first (default: 10)
- **Stable sort** — same-priority callbacks run in registration order
- **Async support** — `doAction` / `applyFilters` for async, `doActionSync` / `applyFiltersSync` for sync
- **Recursive hooks** — hooks can fire other hooks safely
- **Universal "all" hook** — fires before every action and filter
- **Execution stack** — track which hooks are currently running
- **Fire counters** — check how many times a hook has been fired
- **Precise removal** — remove by callback reference + priority

### API Reference

| Method                                    | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| `addAction(name, callback, options?)`     | Register an action callback                  |
| `addFilter(name, callback, options?)`     | Register a filter callback                   |
| `doAction(name, ...args)`                 | Fire an action (async)                       |
| `doActionSync(name, ...args)`             | Fire an action (sync)                        |
| `applyFilters(name, value, ...args)`      | Apply filter chain (async)                   |
| `applyFiltersSync(name, value, ...args)`  | Apply filter chain (sync)                    |
| `removeAction(name, callback, priority?)` | Remove a specific action                     |
| `removeFilter(name, callback, priority?)` | Remove a specific filter                     |
| `removeAllHooks(name, priority?)`         | Remove all handlers for a hook               |
| `hasAction(name, callback?)`              | Check if action has handlers                 |
| `hasFilter(name, callback?)`              | Check if filter has handlers                 |
| `didAction(name)`                         | Check if action has ever fired               |
| `isDoingHook(name?)`                      | Check if a hook is currently executing       |
| `currentHook()`                           | Get the name of the currently executing hook |
| `getFireCount(name)`                      | Get how many times a hook has fired          |
| `getHandlerCount(name)`                   | Get number of registered handlers            |

### Options

```typescript
interface AddHookOptions {
	priority?: number; // Default: 10. Lower = earlier execution.
	acceptedArgs?: number; // Default: 1. Number of arguments passed to callback.
}
```

## Types & Constants

```typescript
import { POST_STATUS, USER_ROLES, HOOK_PRIORITY } from '@newcms/core';

POST_STATUS.PUBLISH; // 'publish'
POST_STATUS.DRAFT; // 'draft'
USER_ROLES.ADMINISTRATOR; // 'administrator'
HOOK_PRIORITY.DEFAULT; // 10
```

## License

GPL-2.0-or-later
