import type {
	HookCallback,
	HookHandler,
	HookStackEntry,
	AddHookOptions,
	HasHookResult,
} from './types';

/**
 * Generates a unique identifier for a hook callback.
 *
 * For named functions, uses the function name + priority.
 * For anonymous/arrow functions, uses a counter-based ID.
 */
let anonymousCounter = 0;

function generateCallbackId(callback: HookCallback, priority: number): string {
	if (callback.name && callback.name !== '') {
		return `${callback.name}::${priority}`;
	}
	anonymousCounter++;
	return `__anonymous_${anonymousCounter}::${priority}`;
}

/**
 * HookEngine — the backbone of the CMS extensibility system.
 *
 * Implements a WordPress-compatible hook system with actions and filters.
 * Actions are hooks that perform side effects. Filters are hooks that
 * transform a value through a pipeline of callbacks.
 *
 * Features:
 * - Priority-based execution (lower number = earlier execution)
 * - Recursive hook execution support
 * - Universal "all" hook that fires for every hook
 * - Execution stack tracking
 * - Fire counters per hook
 * - Precise removal by callback + priority
 */
export class HookEngine {
	/**
	 * Map of hook name → array of handlers, kept sorted by priority.
	 */
	private hooks: Map<string, HookHandler[]> = new Map();

	/**
	 * Stack of hooks currently being executed (supports recursion).
	 */
	private currentStack: HookStackEntry[] = [];

	/**
	 * Counter of how many times each hook has been fired.
	 */
	private fireCount: Map<string, number> = new Map();

	/**
	 * Register a callback for a hook.
	 *
	 * @param hookName - The hook identifier
	 * @param callback - The function to execute
	 * @param options - Priority and accepted args configuration
	 * @returns The generated handler ID
	 */
	addHook(hookName: string, callback: HookCallback, options: AddHookOptions = {}): string {
		const priority = options.priority ?? 10;
		const acceptedArgs = options.acceptedArgs ?? 1;
		const id = generateCallbackId(callback, priority);

		const handler: HookHandler = {
			callback,
			priority,
			acceptedArgs,
			id,
		};

		const existing = this.hooks.get(hookName) ?? [];
		existing.push(handler);
		// Stable sort by priority (preserves insertion order for same priority)
		existing.sort((a, b) => a.priority - b.priority);
		this.hooks.set(hookName, existing);

		return id;
	}

	/**
	 * Remove a specific callback from a hook.
	 *
	 * Both the callback reference AND priority must match for removal.
	 *
	 * @param hookName - The hook identifier
	 * @param callback - The callback to remove
	 * @param priority - The priority it was registered with (default: 10)
	 * @returns true if a handler was removed
	 */
	removeHook(hookName: string, callback: HookCallback, priority: number = 10): boolean {
		const handlers = this.hooks.get(hookName);
		if (!handlers) return false;

		const initialLength = handlers.length;
		const filtered = handlers.filter(
			(h) => !(h.callback === callback && h.priority === priority),
		);

		if (filtered.length === initialLength) return false;

		if (filtered.length === 0) {
			this.hooks.delete(hookName);
		} else {
			this.hooks.set(hookName, filtered);
		}

		return true;
	}

	/**
	 * Remove all callbacks from a hook, optionally only for a specific priority.
	 *
	 * @param hookName - The hook identifier
	 * @param priority - If provided, only remove handlers at this priority
	 * @returns true if any handlers were removed
	 */
	removeAllHooks(hookName: string, priority?: number): boolean {
		if (priority === undefined) {
			return this.hooks.delete(hookName);
		}

		const handlers = this.hooks.get(hookName);
		if (!handlers) return false;

		const filtered = handlers.filter((h) => h.priority !== priority);
		if (filtered.length === handlers.length) return false;

		if (filtered.length === 0) {
			this.hooks.delete(hookName);
		} else {
			this.hooks.set(hookName, filtered);
		}

		return true;
	}

	/**
	 * Check if a hook has registered handlers.
	 *
	 * @param hookName - The hook identifier
	 * @param callback - If provided, check for this specific callback
	 * @returns false if no handlers, or the priority of the matching handler
	 */
	hasHook(hookName: string, callback?: HookCallback): HasHookResult {
		const handlers = this.hooks.get(hookName);
		if (!handlers || handlers.length === 0) return false;

		if (callback === undefined) {
			// Return the lowest priority (first handler)
			return handlers[0].priority;
		}

		const found = handlers.find((h) => h.callback === callback);
		return found ? found.priority : false;
	}

	/**
	 * Execute an action hook. All registered callbacks are called in priority order.
	 * The "all" universal hook fires before the specific hook.
	 *
	 * @param hookName - The hook identifier
	 * @param args - Arguments to pass to callbacks
	 */
	async doAction(hookName: string, ...args: unknown[]): Promise<void> {
		// Fire the universal "all" hook first (if we're not already in "all")
		if (hookName !== 'all') {
			await this.fireUniversalHook(hookName, args);
		}

		const handlers = this.hooks.get(hookName);
		this.incrementFireCount(hookName);

		if (!handlers || handlers.length === 0) return;

		// Push onto execution stack
		const stackEntry: HookStackEntry = { name: hookName, currentIndex: 0 };
		this.currentStack.push(stackEntry);

		try {
			for (let i = 0; i < handlers.length; i++) {
				stackEntry.currentIndex = i;
				const handler = handlers[i];
				const slicedArgs = args.slice(0, handler.acceptedArgs);
				await handler.callback(...slicedArgs);
			}
		} finally {
			this.currentStack.pop();
		}
	}

	/**
	 * Execute an action hook synchronously.
	 */
	doActionSync(hookName: string, ...args: unknown[]): void {
		if (hookName !== 'all') {
			this.fireUniversalHookSync(hookName, args);
		}

		const handlers = this.hooks.get(hookName);
		this.incrementFireCount(hookName);

		if (!handlers || handlers.length === 0) return;

		const stackEntry: HookStackEntry = { name: hookName, currentIndex: 0 };
		this.currentStack.push(stackEntry);

		try {
			for (let i = 0; i < handlers.length; i++) {
				stackEntry.currentIndex = i;
				const handler = handlers[i];
				const slicedArgs = args.slice(0, handler.acceptedArgs);
				handler.callback(...slicedArgs);
			}
		} finally {
			this.currentStack.pop();
		}
	}

	/**
	 * Execute a filter hook. The first argument is the value being filtered.
	 * Each callback receives the (possibly modified) value and returns a new value.
	 * The "all" universal hook fires before the specific hook.
	 *
	 * @param hookName - The hook identifier
	 * @param value - The initial value to filter
	 * @param args - Additional arguments passed to each callback
	 * @returns The filtered value after all callbacks have processed it
	 */
	async applyFilters(hookName: string, value: unknown, ...args: unknown[]): Promise<unknown> {
		// Fire the universal "all" hook first
		if (hookName !== 'all') {
			await this.fireUniversalHook(hookName, [value, ...args]);
		}

		const handlers = this.hooks.get(hookName);
		this.incrementFireCount(hookName);

		if (!handlers || handlers.length === 0) return value;

		const stackEntry: HookStackEntry = { name: hookName, currentIndex: 0 };
		this.currentStack.push(stackEntry);

		let filteredValue = value;

		try {
			for (let i = 0; i < handlers.length; i++) {
				stackEntry.currentIndex = i;
				const handler = handlers[i];
				const callArgs = [filteredValue, ...args].slice(0, handler.acceptedArgs);
				filteredValue = await handler.callback(filteredValue, ...callArgs.slice(1));
			}
		} finally {
			this.currentStack.pop();
		}

		return filteredValue;
	}

	/**
	 * Execute a filter hook synchronously.
	 */
	applyFiltersSync(hookName: string, value: unknown, ...args: unknown[]): unknown {
		if (hookName !== 'all') {
			this.fireUniversalHookSync(hookName, [value, ...args]);
		}

		const handlers = this.hooks.get(hookName);
		this.incrementFireCount(hookName);

		if (!handlers || handlers.length === 0) return value;

		const stackEntry: HookStackEntry = { name: hookName, currentIndex: 0 };
		this.currentStack.push(stackEntry);

		let filteredValue = value;

		try {
			for (let i = 0; i < handlers.length; i++) {
				stackEntry.currentIndex = i;
				const handler = handlers[i];
				const callArgs = [filteredValue, ...args].slice(0, handler.acceptedArgs);
				filteredValue = handler.callback(filteredValue, ...callArgs.slice(1));
			}
		} finally {
			this.currentStack.pop();
		}

		return filteredValue;
	}

	/**
	 * Get how many times a hook has been fired.
	 */
	getFireCount(hookName: string): number {
		return this.fireCount.get(hookName) ?? 0;
	}

	/**
	 * Check if a specific hook is currently being executed.
	 */
	isDoingHook(hookName?: string): boolean {
		if (hookName === undefined) {
			return this.currentStack.length > 0;
		}
		return this.currentStack.some((entry) => entry.name === hookName);
	}

	/**
	 * Get the name of the hook currently being executed (top of stack).
	 * Returns undefined if no hook is executing.
	 */
	currentHook(): string | undefined {
		if (this.currentStack.length === 0) return undefined;
		return this.currentStack[this.currentStack.length - 1].name;
	}

	/**
	 * Get a snapshot of the current execution stack.
	 */
	getExecutionStack(): readonly HookStackEntry[] {
		return [...this.currentStack];
	}

	/**
	 * Check if a hook has ever been fired (fire count > 0).
	 */
	didHook(hookName: string): boolean {
		return this.getFireCount(hookName) > 0;
	}

	/**
	 * Get the number of handlers registered for a hook.
	 */
	getHandlerCount(hookName: string): number {
		return this.hooks.get(hookName)?.length ?? 0;
	}

	/**
	 * Reset the engine — useful for testing.
	 */
	reset(): void {
		this.hooks.clear();
		this.currentStack = [];
		this.fireCount.clear();
		anonymousCounter = 0;
	}

	// --- Convenience aliases matching WordPress API names ---

	addAction(hookName: string, callback: HookCallback, options?: AddHookOptions): string {
		return this.addHook(hookName, callback, options);
	}

	addFilter(hookName: string, callback: HookCallback, options?: AddHookOptions): string {
		return this.addHook(hookName, callback, options);
	}

	removeAction(hookName: string, callback: HookCallback, priority?: number): boolean {
		return this.removeHook(hookName, callback, priority);
	}

	removeFilter(hookName: string, callback: HookCallback, priority?: number): boolean {
		return this.removeHook(hookName, callback, priority);
	}

	hasAction(hookName: string, callback?: HookCallback): HasHookResult {
		return this.hasHook(hookName, callback);
	}

	hasFilter(hookName: string, callback?: HookCallback): HasHookResult {
		return this.hasHook(hookName, callback);
	}

	didAction(hookName: string): boolean {
		return this.didHook(hookName);
	}

	didFilter(hookName: string): boolean {
		return this.didHook(hookName);
	}

	// --- Private helpers ---

	private incrementFireCount(hookName: string): void {
		this.fireCount.set(hookName, (this.fireCount.get(hookName) ?? 0) + 1);
	}

	private async fireUniversalHook(hookName: string, args: unknown[]): Promise<void> {
		const allHandlers = this.hooks.get('all');
		if (!allHandlers || allHandlers.length === 0) return;

		const stackEntry: HookStackEntry = { name: 'all', currentIndex: 0 };
		this.currentStack.push(stackEntry);

		try {
			for (let i = 0; i < allHandlers.length; i++) {
				stackEntry.currentIndex = i;
				const handler = allHandlers[i];
				await handler.callback(hookName, ...args);
			}
		} finally {
			this.currentStack.pop();
		}
	}

	private fireUniversalHookSync(hookName: string, args: unknown[]): void {
		const allHandlers = this.hooks.get('all');
		if (!allHandlers || allHandlers.length === 0) return;

		const stackEntry: HookStackEntry = { name: 'all', currentIndex: 0 };
		this.currentStack.push(stackEntry);

		try {
			for (let i = 0; i < allHandlers.length; i++) {
				stackEntry.currentIndex = i;
				const handler = allHandlers[i];
				handler.callback(hookName, ...args);
			}
		} finally {
			this.currentStack.pop();
		}
	}
}
