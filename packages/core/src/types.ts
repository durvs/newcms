/**
 * Generic hook callback. Used for both actions and filters.
 * Actions ignore the return value; filters chain it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookCallback = (...args: any[]) => any;

/**
 * A registered hook handler with its metadata.
 */
export interface HookHandler {
	/** The callback function */
	callback: HookCallback;
	/** Execution priority (lower = earlier). Default: 10 */
	priority: number;
	/** Number of arguments the callback accepts */
	acceptedArgs: number;
	/** Unique identifier for this handler */
	id: string;
}

/**
 * Represents a hook currently being executed in the stack.
 */
export interface HookStackEntry {
	/** The hook name being executed */
	name: string;
	/** Current iteration index within the priority groups */
	currentIndex: number;
}

/**
 * Options for adding a hook.
 */
export interface AddHookOptions {
	/** Execution priority. Default: 10 */
	priority?: number;
	/** Number of arguments the callback accepts. Default: 1 */
	acceptedArgs?: number;
}

/**
 * Result of checking if a hook has handlers.
 * Returns false if no handlers, or the priority of the first matching handler.
 */
export type HasHookResult = false | number;

/**
 * Registered post type definition.
 */
export interface PostTypeDefinition {
	name: string;
	label: string;
	labels?: Record<string, string>;
	public?: boolean;
	hierarchical?: boolean;
	showInRest?: boolean;
	restBase?: string;
	supports?: string[];
	taxonomies?: string[];
	hasArchive?: boolean;
	rewrite?: { slug: string; withFront?: boolean } | false;
	menuPosition?: number;
	menuIcon?: string;
	capability_type?: string;
	capabilities?: Record<string, string>;
}

/**
 * Registered taxonomy definition.
 */
export interface TaxonomyDefinition {
	name: string;
	objectTypes: string[];
	label: string;
	labels?: Record<string, string>;
	public?: boolean;
	hierarchical?: boolean;
	showInRest?: boolean;
	restBase?: string;
	rewrite?: { slug: string; withFront?: boolean; hierarchical?: boolean } | false;
}

/**
 * User capability check context.
 */
export interface CapabilityContext {
	userId: number;
	capability: string;
	objectId?: number;
}

/**
 * Standard post statuses.
 */
export const POST_STATUS = {
	PUBLISH: 'publish',
	DRAFT: 'draft',
	PENDING: 'pending',
	PRIVATE: 'private',
	TRASH: 'trash',
	AUTO_DRAFT: 'auto-draft',
	INHERIT: 'inherit',
	FUTURE: 'future',
} as const;

/**
 * Default user roles.
 */
export const USER_ROLES = {
	ADMINISTRATOR: 'administrator',
	EDITOR: 'editor',
	AUTHOR: 'author',
	CONTRIBUTOR: 'contributor',
	SUBSCRIBER: 'subscriber',
} as const;

/**
 * Default hook priorities.
 */
export const HOOK_PRIORITY = {
	EARLIEST: 1,
	EARLY: 5,
	DEFAULT: 10,
	LATE: 15,
	LATEST: 20,
} as const;
