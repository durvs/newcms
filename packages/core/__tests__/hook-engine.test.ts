import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HookEngine } from '../src/hook-engine.js';

describe('HookEngine', () => {
	let engine: HookEngine;

	beforeEach(() => {
		engine = new HookEngine();
	});

	// ─── Registration ────────────────────────────────────────────

	describe('addHook / addAction / addFilter', () => {
		it('should register a callback and return an ID', () => {
			const cb = vi.fn();
			const id = engine.addHook('init', cb);
			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
		});

		it('should default priority to 10', () => {
			const cb = vi.fn();
			engine.addHook('init', cb);
			expect(engine.hasHook('init', cb)).toBe(10);
		});

		it('should respect custom priority', () => {
			const cb = vi.fn();
			engine.addHook('init', cb, { priority: 5 });
			expect(engine.hasHook('init', cb)).toBe(5);
		});

		it('addAction is an alias for addHook', () => {
			const cb = vi.fn();
			engine.addAction('init', cb);
			expect(engine.hasAction('init', cb)).toBe(10);
		});

		it('addFilter is an alias for addHook', () => {
			const cb = vi.fn();
			engine.addFilter('the_title', cb);
			expect(engine.hasFilter('the_title', cb)).toBe(10);
		});
	});

	// ─── Priority execution order ────────────────────────────────

	describe('priority ordering', () => {
		it('should execute callbacks in priority order (lower first)', async () => {
			const order: number[] = [];

			engine.addHook('init', () => order.push(3), { priority: 20 });
			engine.addHook('init', () => order.push(1), { priority: 5 });
			engine.addHook('init', () => order.push(2), { priority: 10 });

			await engine.doAction('init');

			expect(order).toEqual([1, 2, 3]);
		});

		it('should preserve insertion order for same priority', async () => {
			const order: number[] = [];

			engine.addHook('init', () => order.push(1), { priority: 10 });
			engine.addHook('init', () => order.push(2), { priority: 10 });
			engine.addHook('init', () => order.push(3), { priority: 10 });

			await engine.doAction('init');

			expect(order).toEqual([1, 2, 3]);
		});
	});

	// ─── Actions ─────────────────────────────────────────────────

	describe('doAction', () => {
		it('should call registered callbacks', async () => {
			const cb = vi.fn();
			engine.addAction('init', cb);

			await engine.doAction('init');

			expect(cb).toHaveBeenCalledOnce();
		});

		it('should pass arguments to callbacks', async () => {
			const cb = vi.fn();
			engine.addAction('save_post', cb, { acceptedArgs: 3 });

			await engine.doAction('save_post', 42, { title: 'Hello' }, true);

			expect(cb).toHaveBeenCalledWith(42, { title: 'Hello' }, true);
		});

		it('should slice arguments to acceptedArgs count', async () => {
			const cb = vi.fn();
			engine.addAction('save_post', cb, { acceptedArgs: 1 });

			await engine.doAction('save_post', 42, 'extra', 'more');

			expect(cb).toHaveBeenCalledWith(42);
		});

		it('should handle no registered handlers gracefully', async () => {
			await expect(engine.doAction('nonexistent')).resolves.toBeUndefined();
		});

		it('should handle async callbacks', async () => {
			const order: number[] = [];

			engine.addAction(
				'async_hook',
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					order.push(1);
				},
				{ priority: 5 },
			);
			engine.addAction('async_hook', () => order.push(2), { priority: 10 });

			await engine.doAction('async_hook');

			expect(order).toEqual([1, 2]);
		});
	});

	describe('doActionSync', () => {
		it('should call registered callbacks synchronously', () => {
			const cb = vi.fn();
			engine.addAction('init', cb);

			engine.doActionSync('init');

			expect(cb).toHaveBeenCalledOnce();
		});

		it('should pass arguments correctly', () => {
			const cb = vi.fn();
			engine.addAction('test', cb, { acceptedArgs: 2 });

			engine.doActionSync('test', 'a', 'b', 'c');

			expect(cb).toHaveBeenCalledWith('a', 'b');
		});
	});

	// ─── Filters ─────────────────────────────────────────────────

	describe('applyFilters', () => {
		it('should return original value when no handlers registered', async () => {
			const result = await engine.applyFilters('the_title', 'Hello World');
			expect(result).toBe('Hello World');
		});

		it('should pipe value through filter chain', async () => {
			engine.addFilter('the_title', (value: unknown) => `${value}!`);
			engine.addFilter('the_title', (value: unknown) => `<b>${value}</b>`);

			const result = await engine.applyFilters('the_title', 'Hello');

			expect(result).toBe('<b>Hello!</b>');
		});

		it('should pass extra arguments to each filter', async () => {
			const cb = vi.fn((value: unknown) => value);
			engine.addFilter('the_content', cb, { acceptedArgs: 3 });

			await engine.applyFilters('the_content', 'text', 42, true);

			expect(cb).toHaveBeenCalledWith('text', 42, true);
		});

		it('should respect priority ordering in filter chain', async () => {
			engine.addFilter('the_title', (v: unknown) => `${v}-late`, { priority: 20 });
			engine.addFilter('the_title', (v: unknown) => `${v}-early`, { priority: 5 });

			const result = await engine.applyFilters('the_title', 'start');

			expect(result).toBe('start-early-late');
		});

		it('should handle async filters', async () => {
			engine.addFilter('the_title', async (value: unknown) => {
				await new Promise((resolve) => setTimeout(resolve, 5));
				return `${value}!`;
			});

			const result = await engine.applyFilters('the_title', 'Hello');

			expect(result).toBe('Hello!');
		});
	});

	describe('applyFiltersSync', () => {
		it('should pipe value through filter chain synchronously', () => {
			engine.addFilter('the_title', (value: unknown) => `${value}!`);
			engine.addFilter('the_title', (value: unknown) => `<b>${value}</b>`);

			const result = engine.applyFiltersSync('the_title', 'Hello');

			expect(result).toBe('<b>Hello!</b>');
		});
	});

	// ─── Removal ─────────────────────────────────────────────────

	describe('removeHook / removeAction / removeFilter', () => {
		it('should remove a specific callback by reference + priority', () => {
			const cb = vi.fn();
			engine.addHook('init', cb, { priority: 10 });

			const removed = engine.removeHook('init', cb, 10);

			expect(removed).toBe(true);
			expect(engine.hasHook('init')).toBe(false);
		});

		it('should NOT remove if priority does not match', () => {
			const cb = vi.fn();
			engine.addHook('init', cb, { priority: 10 });

			const removed = engine.removeHook('init', cb, 5);

			expect(removed).toBe(false);
			expect(engine.hasHook('init', cb)).toBe(10);
		});

		it('should NOT remove if callback reference does not match', () => {
			const cb1 = vi.fn();
			const cb2 = vi.fn();
			engine.addHook('init', cb1);

			const removed = engine.removeHook('init', cb2);

			expect(removed).toBe(false);
			expect(engine.hasHook('init', cb1)).toBe(10);
		});

		it('should return false for non-existent hook', () => {
			expect(engine.removeHook('nonexistent', vi.fn())).toBe(false);
		});

		it('removeAction is an alias for removeHook', () => {
			const cb = vi.fn();
			engine.addAction('init', cb);
			expect(engine.removeAction('init', cb)).toBe(true);
		});

		it('removeFilter is an alias for removeHook', () => {
			const cb = vi.fn();
			engine.addFilter('the_title', cb);
			expect(engine.removeFilter('the_title', cb)).toBe(true);
		});
	});

	describe('removeAllHooks', () => {
		it('should remove all handlers for a hook', () => {
			engine.addHook('init', vi.fn(), { priority: 5 });
			engine.addHook('init', vi.fn(), { priority: 10 });
			engine.addHook('init', vi.fn(), { priority: 15 });

			const removed = engine.removeAllHooks('init');

			expect(removed).toBe(true);
			expect(engine.hasHook('init')).toBe(false);
		});

		it('should remove only handlers at a specific priority', () => {
			const cb5 = vi.fn();
			const cb10a = vi.fn();
			const cb10b = vi.fn();

			engine.addHook('init', cb5, { priority: 5 });
			engine.addHook('init', cb10a, { priority: 10 });
			engine.addHook('init', cb10b, { priority: 10 });

			const removed = engine.removeAllHooks('init', 10);

			expect(removed).toBe(true);
			expect(engine.hasHook('init', cb5)).toBe(5);
			expect(engine.hasHook('init', cb10a)).toBe(false);
			expect(engine.hasHook('init', cb10b)).toBe(false);
		});

		it('should return false for non-existent hook', () => {
			expect(engine.removeAllHooks('nonexistent')).toBe(false);
		});
	});

	// ─── hasHook ─────────────────────────────────────────────────

	describe('hasHook / hasAction / hasFilter', () => {
		it('should return false when no handlers registered', () => {
			expect(engine.hasHook('init')).toBe(false);
		});

		it('should return lowest priority when handlers exist', () => {
			engine.addHook('init', vi.fn(), { priority: 15 });
			engine.addHook('init', vi.fn(), { priority: 5 });

			expect(engine.hasHook('init')).toBe(5);
		});

		it('should return priority of a specific callback', () => {
			const cb = vi.fn();
			engine.addHook('init', cb, { priority: 7 });

			expect(engine.hasHook('init', cb)).toBe(7);
		});

		it('should return false for unregistered callback', () => {
			engine.addHook('init', vi.fn());
			expect(engine.hasHook('init', vi.fn())).toBe(false);
		});
	});

	// ─── Fire count ──────────────────────────────────────────────

	describe('getFireCount / didHook / didAction', () => {
		it('should return 0 for never-fired hook', () => {
			expect(engine.getFireCount('init')).toBe(0);
		});

		it('should increment fire count on each doAction', async () => {
			engine.addAction('init', vi.fn());

			await engine.doAction('init');
			expect(engine.getFireCount('init')).toBe(1);

			await engine.doAction('init');
			expect(engine.getFireCount('init')).toBe(2);
		});

		it('should increment fire count on each applyFilters', async () => {
			engine.addFilter('the_title', (v: unknown) => v);

			await engine.applyFilters('the_title', 'test');
			await engine.applyFilters('the_title', 'test');

			expect(engine.getFireCount('the_title')).toBe(2);
		});

		it('should increment even with no handlers', async () => {
			await engine.doAction('empty_hook');
			expect(engine.getFireCount('empty_hook')).toBe(1);
		});

		it('didHook returns true after firing', async () => {
			expect(engine.didHook('init')).toBe(false);
			await engine.doAction('init');
			expect(engine.didHook('init')).toBe(true);
		});

		it('didAction is an alias for didHook', async () => {
			await engine.doAction('init');
			expect(engine.didAction('init')).toBe(true);
		});

		it('didFilter is an alias for didHook', async () => {
			await engine.applyFilters('the_title', 'x');
			expect(engine.didFilter('the_title')).toBe(true);
		});
	});

	// ─── Execution stack ─────────────────────────────────────────

	describe('isDoingHook / currentHook / getExecutionStack', () => {
		it('should return false when no hook is executing', () => {
			expect(engine.isDoingHook()).toBe(false);
			expect(engine.isDoingHook('init')).toBe(false);
			expect(engine.currentHook()).toBeUndefined();
		});

		it('should track the currently executing hook', async () => {
			let isDoingInit = false;
			let currentName: string | undefined;

			engine.addAction('init', () => {
				isDoingInit = engine.isDoingHook('init');
				currentName = engine.currentHook();
			});

			await engine.doAction('init');

			expect(isDoingInit).toBe(true);
			expect(currentName).toBe('init');
		});

		it('should return false after hook finishes executing', async () => {
			engine.addAction('init', vi.fn());
			await engine.doAction('init');

			expect(engine.isDoingHook('init')).toBe(false);
			expect(engine.isDoingHook()).toBe(false);
		});

		it('isDoingHook(undefined) returns true if any hook is executing', async () => {
			let anyHookRunning = false;

			engine.addAction('init', () => {
				anyHookRunning = engine.isDoingHook();
			});

			await engine.doAction('init');

			expect(anyHookRunning).toBe(true);
		});

		it('should maintain stack during recursive hook calls', async () => {
			const stackSnapshots: string[][] = [];

			engine.addAction('outer', async () => {
				stackSnapshots.push(engine.getExecutionStack().map((e) => e.name));
				await engine.doAction('inner');
				stackSnapshots.push(engine.getExecutionStack().map((e) => e.name));
			});

			engine.addAction('inner', () => {
				stackSnapshots.push(engine.getExecutionStack().map((e) => e.name));
			});

			await engine.doAction('outer');

			expect(stackSnapshots[0]).toEqual(['outer']);
			expect(stackSnapshots[1]).toEqual(['outer', 'inner']);
			expect(stackSnapshots[2]).toEqual(['outer']);
		});

		it('should clean up stack even if callback throws', async () => {
			engine.addAction('failing', () => {
				throw new Error('test error');
			});

			await expect(engine.doAction('failing')).rejects.toThrow('test error');
			expect(engine.isDoingHook()).toBe(false);
			expect(engine.currentHook()).toBeUndefined();
		});
	});

	// ─── Universal "all" hook ────────────────────────────────────

	describe('universal "all" hook', () => {
		it('should fire "all" hook before every action', async () => {
			const allCalls: string[] = [];
			engine.addHook('all', (hookName: unknown) => {
				allCalls.push(hookName as string);
			});

			await engine.doAction('init');
			await engine.doAction('save_post');

			expect(allCalls).toEqual(['init', 'save_post']);
		});

		it('should fire "all" hook before every filter', async () => {
			const allCalls: string[] = [];
			engine.addHook('all', (hookName: unknown) => {
				allCalls.push(hookName as string);
			});

			await engine.applyFilters('the_title', 'Hello');

			expect(allCalls).toEqual(['the_title']);
		});

		it('should pass hook name and all arguments to "all" handler', async () => {
			const allArgs: unknown[][] = [];
			engine.addHook(
				'all',
				(...args: unknown[]) => {
					allArgs.push(args);
				},
				{ acceptedArgs: 10 },
			);

			await engine.doAction('save_post', 42, true);

			expect(allArgs[0]).toEqual(['save_post', 42, true]);
		});

		it('should NOT fire "all" recursively when "all" itself fires', async () => {
			let count = 0;
			engine.addHook('all', () => {
				count++;
			});

			await engine.doAction('init');

			// "all" should fire once for "init", not recursively
			expect(count).toBe(1);
		});

		it('should work with doActionSync too', () => {
			const allCalls: string[] = [];
			engine.addHook('all', (hookName: unknown) => {
				allCalls.push(hookName as string);
			});

			engine.doActionSync('init');

			expect(allCalls).toEqual(['init']);
		});
	});

	// ─── Recursive hooks ─────────────────────────────────────────

	describe('recursive hook execution', () => {
		it('should allow hooks to fire other hooks', async () => {
			const order: string[] = [];

			engine.addAction('outer', async () => {
				order.push('outer-start');
				await engine.doAction('inner');
				order.push('outer-end');
			});

			engine.addAction('inner', () => {
				order.push('inner');
			});

			await engine.doAction('outer');

			expect(order).toEqual(['outer-start', 'inner', 'outer-end']);
		});

		it('should correctly track fire count for recursive hooks', async () => {
			engine.addAction('outer', async () => {
				await engine.doAction('inner');
			});
			engine.addAction('inner', vi.fn());

			await engine.doAction('outer');

			expect(engine.getFireCount('outer')).toBe(1);
			expect(engine.getFireCount('inner')).toBe(1);
		});

		it('should handle a filter calling doAction internally', async () => {
			const sideEffects: string[] = [];

			engine.addAction('side_effect', () => {
				sideEffects.push('effect');
			});

			engine.addFilter('the_title', async (value: unknown) => {
				await engine.doAction('side_effect');
				return `${value}!`;
			});

			const result = await engine.applyFilters('the_title', 'Hello');

			expect(result).toBe('Hello!');
			expect(sideEffects).toEqual(['effect']);
		});
	});

	// ─── Handler count ───────────────────────────────────────────

	describe('getHandlerCount', () => {
		it('should return 0 for non-existent hook', () => {
			expect(engine.getHandlerCount('init')).toBe(0);
		});

		it('should return correct count', () => {
			engine.addHook('init', vi.fn());
			engine.addHook('init', vi.fn());
			engine.addHook('init', vi.fn());

			expect(engine.getHandlerCount('init')).toBe(3);
		});

		it('should decrease after removal', () => {
			const cb = vi.fn();
			engine.addHook('init', cb);
			engine.addHook('init', vi.fn());

			engine.removeHook('init', cb);

			expect(engine.getHandlerCount('init')).toBe(1);
		});
	});

	// ─── Reset ───────────────────────────────────────────────────

	describe('reset', () => {
		it('should clear all hooks, stack, and fire counts', async () => {
			engine.addHook('init', vi.fn());
			await engine.doAction('init');

			engine.reset();

			expect(engine.hasHook('init')).toBe(false);
			expect(engine.getFireCount('init')).toBe(0);
			expect(engine.isDoingHook()).toBe(false);
		});
	});

	// ─── Edge cases ──────────────────────────────────────────────

	describe('edge cases', () => {
		it('should handle the same callback at different priorities', async () => {
			const order: number[] = [];
			const cb = () => order.push(order.length + 1);

			engine.addHook('init', cb, { priority: 20 });
			engine.addHook('init', cb, { priority: 5 });

			await engine.doAction('init');

			expect(order).toEqual([1, 2]);
			expect(engine.getHandlerCount('init')).toBe(2);
		});

		it('should handle removing one priority of a multi-priority callback', () => {
			const cb = vi.fn();

			engine.addHook('init', cb, { priority: 5 });
			engine.addHook('init', cb, { priority: 10 });

			engine.removeHook('init', cb, 5);

			expect(engine.getHandlerCount('init')).toBe(1);
			expect(engine.hasHook('init', cb)).toBe(10);
		});

		it('should handle large number of handlers efficiently', async () => {
			for (let i = 0; i < 1000; i++) {
				engine.addHook('stress', vi.fn(), { priority: Math.floor(Math.random() * 100) });
			}

			expect(engine.getHandlerCount('stress')).toBe(1000);
			await engine.doAction('stress');
			expect(engine.getFireCount('stress')).toBe(1);
		});

		it('should handle empty string hook name', async () => {
			const cb = vi.fn();
			engine.addHook('', cb);
			await engine.doAction('');
			expect(cb).toHaveBeenCalledOnce();
		});
	});
});
