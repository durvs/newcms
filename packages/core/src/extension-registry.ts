/**
 * Extension manifest — equivalent to plugin headers in the spec.
 * Found in the extension's manifest.json file.
 */
export interface ExtensionManifest {
	/** Unique slug identifier */
	slug: string;
	/** Display name */
	name: string;
	/** Semantic version */
	version: string;
	/** Short description */
	description?: string;
	/** Author name */
	author?: string;
	/** Author URL */
	authorUri?: string;
	/** Minimum CMS version required */
	minCmsVersion?: string;
	/** Minimum Node.js version required */
	minNodeVersion?: string;
	/** Dependencies (slugs of other extensions) */
	dependencies?: string[];
	/** Text domain for i18n */
	textDomain?: string;
	/** Whether this is a network-wide extension (multisite) */
	network?: boolean;
	/** Entry point file (relative to extension dir). Default: index.ts */
	main?: string;
}

export type ExtensionStatus = 'active' | 'inactive' | 'paused' | 'must-use';

export interface ExtensionEntry {
	manifest: ExtensionManifest;
	status: ExtensionStatus;
	/** Absolute path to the extension directory */
	path: string;
	/** Error that caused the extension to be paused */
	pauseReason?: string;
	/** When the extension was activated */
	activatedAt?: Date;
}

/**
 * Registry that tracks all discovered and active extensions.
 *
 * Extensions go through these states:
 *   discovered → activated → loaded → running
 *   activated → paused (on fatal error, via recovery mode)
 *   running → deactivated → inactive
 */
export class ExtensionRegistry {
	private extensions: Map<string, ExtensionEntry> = new Map();

	/**
	 * Register an extension manifest (discovery phase).
	 */
	register(manifest: ExtensionManifest, path: string, status: ExtensionStatus): void {
		this.extensions.set(manifest.slug, {
			manifest,
			status,
			path,
			activatedAt: status === 'active' ? new Date() : undefined,
		});
	}

	get(slug: string): ExtensionEntry | undefined {
		return this.extensions.get(slug);
	}

	has(slug: string): boolean {
		return this.extensions.has(slug);
	}

	/**
	 * Get all extensions by status.
	 */
	getByStatus(status: ExtensionStatus): ExtensionEntry[] {
		return [...this.extensions.values()].filter((e) => e.status === status);
	}

	getAll(): ExtensionEntry[] {
		return [...this.extensions.values()];
	}

	getActive(): ExtensionEntry[] {
		return this.getByStatus('active');
	}

	getMustUse(): ExtensionEntry[] {
		return this.getByStatus('must-use');
	}

	getPaused(): ExtensionEntry[] {
		return this.getByStatus('paused');
	}

	/**
	 * Activate an extension. Checks dependencies first.
	 *
	 * @throws If dependencies are not met
	 */
	activate(slug: string): void {
		const entry = this.extensions.get(slug);
		if (!entry) throw new Error(`Extension "${slug}" not found`);
		if (entry.status === 'active') return;

		// Check dependencies
		const unmet = this.getUnmetDependencies(slug);
		if (unmet.length > 0) {
			throw new Error(
				`Cannot activate "${slug}": missing dependencies: ${unmet.join(', ')}`,
			);
		}

		entry.status = 'active';
		entry.activatedAt = new Date();
		entry.pauseReason = undefined;
	}

	/**
	 * Deactivate an extension. Checks if other extensions depend on it.
	 *
	 * @throws If other active extensions depend on this one
	 */
	deactivate(slug: string): void {
		const entry = this.extensions.get(slug);
		if (!entry) throw new Error(`Extension "${slug}" not found`);
		if (entry.status === 'inactive') return;
		if (entry.status === 'must-use') {
			throw new Error(`Cannot deactivate must-use extension "${slug}"`);
		}

		// Check if other active extensions depend on this one
		const dependents = this.getDependents(slug);
		if (dependents.length > 0) {
			throw new Error(
				`Cannot deactivate "${slug}": required by: ${dependents.map((d) => d.manifest.slug).join(', ')}`,
			);
		}

		entry.status = 'inactive';
		entry.activatedAt = undefined;
	}

	/**
	 * Pause an extension due to a fatal error (recovery mode).
	 */
	pause(slug: string, reason: string): void {
		const entry = this.extensions.get(slug);
		if (!entry) return;
		entry.status = 'paused';
		entry.pauseReason = reason;
	}

	/**
	 * Unpause an extension (resume from recovery mode).
	 */
	unpause(slug: string): void {
		const entry = this.extensions.get(slug);
		if (!entry || entry.status !== 'paused') return;
		entry.status = 'active';
		entry.pauseReason = undefined;
	}

	/**
	 * Remove an extension from the registry entirely.
	 */
	unregister(slug: string): boolean {
		return this.extensions.delete(slug);
	}

	/**
	 * Get dependencies that are not active.
	 */
	getUnmetDependencies(slug: string): string[] {
		const entry = this.extensions.get(slug);
		if (!entry) return [];
		const deps = entry.manifest.dependencies ?? [];
		return deps.filter((dep) => {
			const depEntry = this.extensions.get(dep);
			return !depEntry || (depEntry.status !== 'active' && depEntry.status !== 'must-use');
		});
	}

	/**
	 * Get active extensions that depend on the given extension.
	 */
	getDependents(slug: string): ExtensionEntry[] {
		return this.getActive().filter((entry) =>
			entry.manifest.dependencies?.includes(slug),
		);
	}

	/**
	 * Check for circular dependencies starting from a slug.
	 */
	hasCircularDependency(slug: string, visited: Set<string> = new Set()): boolean {
		if (visited.has(slug)) return true;
		visited.add(slug);

		const entry = this.extensions.get(slug);
		if (!entry) return false;

		for (const dep of entry.manifest.dependencies ?? []) {
			if (this.hasCircularDependency(dep, new Set(visited))) return true;
		}

		return false;
	}

	reset(): void {
		this.extensions.clear();
	}
}
