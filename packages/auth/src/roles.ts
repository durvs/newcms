/**
 * Default roles and their capabilities.
 */
export interface Role {
	name: string;
	displayName: string;
	capabilities: Record<string, boolean>;
}

export const DEFAULT_ROLES: Record<string, Role> = {
	administrator: {
		name: 'administrator',
		displayName: 'Administrator',
		capabilities: {
			switch_themes: true,
			edit_themes: true,
			activate_plugins: true,
			edit_plugins: true,
			edit_users: true,
			edit_files: true,
			manage_options: true,
			moderate_comments: true,
			manage_categories: true,
			manage_links: true,
			upload_files: true,
			import: true,
			unfiltered_html: true,
			edit_posts: true,
			edit_others_posts: true,
			edit_published_posts: true,
			publish_posts: true,
			edit_pages: true,
			read: true,
			edit_others_pages: true,
			edit_published_pages: true,
			publish_pages: true,
			delete_pages: true,
			delete_others_pages: true,
			delete_published_pages: true,
			delete_posts: true,
			delete_others_posts: true,
			delete_published_posts: true,
			delete_private_posts: true,
			edit_private_posts: true,
			read_private_posts: true,
			delete_private_pages: true,
			edit_private_pages: true,
			read_private_pages: true,
			delete_users: true,
			create_users: true,
			unfiltered_upload: true,
			edit_dashboard: true,
			update_plugins: true,
			delete_plugins: true,
			install_plugins: true,
			update_themes: true,
			install_themes: true,
			update_core: true,
			list_users: true,
			remove_users: true,
			promote_users: true,
			edit_theme_options: true,
			delete_themes: true,
			export: true,
		},
	},
	editor: {
		name: 'editor',
		displayName: 'Editor',
		capabilities: {
			moderate_comments: true,
			manage_categories: true,
			manage_links: true,
			upload_files: true,
			unfiltered_html: true,
			edit_posts: true,
			edit_others_posts: true,
			edit_published_posts: true,
			publish_posts: true,
			edit_pages: true,
			read: true,
			edit_others_pages: true,
			edit_published_pages: true,
			publish_pages: true,
			delete_pages: true,
			delete_others_pages: true,
			delete_published_pages: true,
			delete_posts: true,
			delete_others_posts: true,
			delete_published_posts: true,
			delete_private_posts: true,
			edit_private_posts: true,
			read_private_posts: true,
			delete_private_pages: true,
			edit_private_pages: true,
			read_private_pages: true,
		},
	},
	author: {
		name: 'author',
		displayName: 'Author',
		capabilities: {
			upload_files: true,
			edit_posts: true,
			edit_published_posts: true,
			publish_posts: true,
			read: true,
			delete_posts: true,
			delete_published_posts: true,
		},
	},
	contributor: {
		name: 'contributor',
		displayName: 'Contributor',
		capabilities: {
			edit_posts: true,
			read: true,
			delete_posts: true,
		},
	},
	subscriber: {
		name: 'subscriber',
		displayName: 'Subscriber',
		capabilities: {
			read: true,
		},
	},
};

/**
 * Check if a role has a specific capability.
 */
export function roleHasCapability(roleName: string, capability: string): boolean {
	const role = DEFAULT_ROLES[roleName];
	if (!role) return false;
	return role.capabilities[capability] === true;
}

/**
 * Check if a user (by their roles array) has a capability.
 */
export function userHasCapability(
	userRoles: string[],
	capability: string,
	extraCapabilities?: Record<string, boolean>,
): boolean {
	// Check extra user-level capabilities first
	if (extraCapabilities?.[capability] === true) return true;
	if (extraCapabilities?.[capability] === false) return false;

	// Check each role
	for (const roleName of userRoles) {
		if (roleHasCapability(roleName, capability)) return true;
	}
	return false;
}
