import type { HookEngine } from './hook-engine';

/**
 * The 17 bootstrap phases as defined in the spec.
 * Each phase is a named step executed in strict order during startup.
 */
export const BOOTSTRAP_PHASES = [
	'entry_point', // 1. HTTP request received
	'configuration', // 2. Load config (DB, keys, flags)
	'initial_constants', // 3. Define constants, memory limits
	'environment_check', // 4. Validate runtime versions
	'error_handling', // 5. Register fatal error handler + recovery mode
	'core_functions', // 6. Load core utility modules
	'database_connect', // 7. Connect to database (+ drop-in check)
	'object_cache', // 8. Initialize cache system (+ drop-in check)
	'default_filters', // 9. Register all core hooks/filters
	'must_use_extensions', // 10. Load must-use extensions (alphabetical)
	'regular_extensions', // 11. Load active extensions (skip paused)
	'overridable_functions', // 12. Load auth/hash/nonce functions (skip if overridden)
	'extensions_loaded', // 13. Fire "extensions_loaded" hook
	'global_objects', // 14. Create query engine, rewrite, widgets, roles
	'theme', // 15. Load active theme (child → parent)
	'init', // 16. Fire "init" hook (register types, taxonomies, etc.)
	'system_loaded', // 17. Fire "cms_loaded" hook
] as const;

export type BootstrapPhase = (typeof BOOTSTRAP_PHASES)[number];

/**
 * Callback for a bootstrap phase.
 */
export type PhaseHandler = () => void | Promise<void>;

/**
 * Orchestrates the CMS bootstrap process through 17 ordered phases.
 *
 * Each phase can have multiple handlers registered. Handlers within a phase
 * run in registration order. Phases are always executed in the order defined
 * by BOOTSTRAP_PHASES.
 *
 * The HookEngine fires a hook for each phase, allowing extensions to tap in.
 */
export class BootstrapManager {
	private phaseHandlers: Map<BootstrapPhase, PhaseHandler[]> = new Map();
	private completedPhases: Set<BootstrapPhase> = new Set();
	private currentPhase: BootstrapPhase | null = null;

	constructor(private hooks: HookEngine) {
		for (const phase of BOOTSTRAP_PHASES) {
			this.phaseHandlers.set(phase, []);
		}
	}

	/**
	 * Register a handler for a bootstrap phase.
	 */
	on(phase: BootstrapPhase, handler: PhaseHandler): void {
		const handlers = this.phaseHandlers.get(phase);
		if (!handlers) throw new Error(`Unknown bootstrap phase: "${phase}"`);
		handlers.push(handler);
	}

	/**
	 * Execute all 17 bootstrap phases in order.
	 * For short-init mode, pass a phase to stop at.
	 */
	async run(stopAfter?: BootstrapPhase): Promise<void> {
		for (const phase of BOOTSTRAP_PHASES) {
			this.currentPhase = phase;

			// Execute registered handlers for this phase
			const handlers = this.phaseHandlers.get(phase) ?? [];
			for (const handler of handlers) {
				await handler();
			}

			// Fire the hook for this phase
			await this.hooks.doAction(`bootstrap:${phase}`);

			this.completedPhases.add(phase);
			this.currentPhase = null;

			// Short-init: stop early if requested
			if (stopAfter === phase) break;
		}

		// Fire the final "system loaded" action if we completed all phases
		if (!stopAfter || stopAfter === 'system_loaded') {
			await this.hooks.doAction('cms_loaded');
		}
	}

	/**
	 * Check if a phase has been completed.
	 */
	isPhaseComplete(phase: BootstrapPhase): boolean {
		return this.completedPhases.has(phase);
	}

	/**
	 * Get the phase currently being executed.
	 */
	getCurrentPhase(): BootstrapPhase | null {
		return this.currentPhase;
	}

	/**
	 * Get all completed phases.
	 */
	getCompletedPhases(): BootstrapPhase[] {
		return [...this.completedPhases];
	}

	/**
	 * Reset — for testing.
	 */
	reset(): void {
		this.completedPhases.clear();
		this.currentPhase = null;
		for (const phase of BOOTSTRAP_PHASES) {
			this.phaseHandlers.set(phase, []);
		}
	}
}
