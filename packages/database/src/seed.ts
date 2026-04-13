import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from './connection.js';
import { users, options, posts, terms, termTaxonomy } from './schema/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function seed() {
	const { db, client } = createConnection();

	console.log('Seeding database...');

	// Create admin user
	const [admin] = await db
		.insert(users)
		.values({
			userLogin: 'admin',
			userPass: '$2b$10$placeholder_hash_replace_on_first_login',
			userNicename: 'admin',
			userEmail: 'admin@example.com',
			displayName: 'Administrator',
			userStatus: 'active',
		})
		.returning();

	console.log(`Created admin user (id: ${admin.id})`);

	// Create default options
	const defaultOptions = [
		{ optionName: 'siteurl', optionValue: 'http://localhost:3000', autoload: true },
		{ optionName: 'home', optionValue: 'http://localhost:3000', autoload: true },
		{ optionName: 'blogname', optionValue: 'My CMS Site', autoload: true },
		{
			optionName: 'blogdescription',
			optionValue: 'Just another CMS site',
			autoload: true,
		},
		{ optionName: 'admin_email', optionValue: 'admin@example.com', autoload: true },
		{ optionName: 'posts_per_page', optionValue: '10', autoload: true },
		{ optionName: 'date_format', optionValue: 'Y-m-d', autoload: true },
		{ optionName: 'time_format', optionValue: 'H:i', autoload: true },
		{ optionName: 'start_of_week', optionValue: '1', autoload: true },
		{ optionName: 'permalink_structure', optionValue: '/%year%/%monthnum%/%postname%/', autoload: true },
		{ optionName: 'default_comment_status', optionValue: 'open', autoload: true },
		{ optionName: 'default_ping_status', optionValue: 'open', autoload: true },
		{ optionName: 'comment_moderation', optionValue: '0', autoload: true },
		{ optionName: 'comment_registration', optionValue: '0', autoload: true },
		{ optionName: 'thread_comments', optionValue: '1', autoload: true },
		{ optionName: 'thread_comments_depth', optionValue: '5', autoload: true },
		{ optionName: 'comments_per_page', optionValue: '50', autoload: true },
		{ optionName: 'users_can_register', optionValue: '0', autoload: true },
		{ optionName: 'default_role', optionValue: 'subscriber', autoload: true },
		{
			optionName: 'user_roles',
			optionValue: JSON.stringify({
				administrator: {
					name: 'Administrator',
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
					name: 'Editor',
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
					name: 'Author',
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
					name: 'Contributor',
					capabilities: {
						edit_posts: true,
						read: true,
						delete_posts: true,
					},
				},
				subscriber: {
					name: 'Subscriber',
					capabilities: {
						read: true,
					},
				},
			}),
			optionValueJson: {
				administrator: { name: 'Administrator', capabilities: { switch_themes: true, edit_themes: true, manage_options: true, edit_posts: true, read: true } },
				editor: { name: 'Editor', capabilities: { moderate_comments: true, edit_posts: true, read: true } },
				author: { name: 'Author', capabilities: { upload_files: true, edit_posts: true, read: true } },
				contributor: { name: 'Contributor', capabilities: { edit_posts: true, read: true } },
				subscriber: { name: 'Subscriber', capabilities: { read: true } },
			},
			autoload: true,
		},
		{ optionName: 'active_plugins', optionValue: '[]', optionValueJson: [], autoload: true },
		{ optionName: 'current_theme', optionValue: 'default', autoload: true },
	];

	await db.insert(options).values(defaultOptions);
	console.log(`Created ${defaultOptions.length} default options`);

	// Create default "Uncategorized" category
	const [uncategorizedTerm] = await db
		.insert(terms)
		.values({ name: 'Uncategorized', slug: 'uncategorized' })
		.returning();

	await db.insert(termTaxonomy).values({
		termId: uncategorizedTerm.termId,
		taxonomy: 'category',
		description: '',
		parent: 0,
		count: 0,
	});

	console.log('Created default category: Uncategorized');

	// Create "Hello World" post
	await db.insert(posts).values({
		postAuthor: admin.id,
		postTitle: 'Hello World!',
		postContent:
			'<!-- cms:paragraph -->\n<p>Welcome to your new CMS. This is your first post. Edit or delete it, then start writing!</p>\n<!-- /cms:paragraph -->',
		postExcerpt: '',
		postStatus: 'publish',
		postName: 'hello-world',
		postType: 'post',
	});

	console.log('Created "Hello World" post');

	// Create "Sample Page"
	await db.insert(posts).values({
		postAuthor: admin.id,
		postTitle: 'Sample Page',
		postContent:
			'<!-- cms:paragraph -->\n<p>This is an example page. It\'s different from a blog post because it will stay in one place.</p>\n<!-- /cms:paragraph -->',
		postExcerpt: '',
		postStatus: 'publish',
		postName: 'sample-page',
		postType: 'page',
	});

	console.log('Created "Sample Page"');

	await client.end();
	console.log('Seed completed!');
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
