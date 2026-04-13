import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '../connection';
import { posts, postmeta } from '../schema/index';
import { MetaRepository, type MetaTableColumns, type MetaColumnNames } from './meta-repository';

export interface CreatePostInput {
	postAuthor: number;
	postTitle: string;
	postContent?: string;
	postExcerpt?: string;
	postStatus?: string;
	postName?: string;
	postType?: string;
	postParent?: number;
	postPassword?: string;
	commentStatus?: string;
	pingStatus?: string;
	postMimeType?: string;
	menuOrder?: number;
	guid?: string;
}

export interface UpdatePostInput {
	postTitle?: string;
	postContent?: string;
	postExcerpt?: string;
	postStatus?: string;
	postName?: string;
	postType?: string;
	postParent?: number;
	postPassword?: string;
	commentStatus?: string;
	pingStatus?: string;
	menuOrder?: number;
}

export interface PostRow {
	id: number;
	postAuthor: number;
	postDate: Date;
	postDateGmt: Date;
	postContent: string;
	postTitle: string;
	postExcerpt: string;
	postStatus: string;
	commentStatus: string;
	pingStatus: string;
	postPassword: string;
	postName: string;
	toPing: string;
	pinged: string;
	postModified: Date;
	postModifiedGmt: Date;
	postContentFiltered: string;
	postParent: number;
	guid: string;
	menuOrder: number;
	postType: string;
	postMimeType: string;
	commentCount: number;
}

/**
 * Repository for posts (all content types).
 *
 * Handles CRUD, slug generation, sticky posts, and provides
 * a MetaRepository instance for post metadata operations.
 */
export class PostRepository {
	readonly meta: MetaRepository;

	constructor(private db: Database) {
		const metaCols: MetaTableColumns = {
			metaId: postmeta.metaId,
			objectId: postmeta.postId,
			metaKey: postmeta.metaKey,
			metaValue: postmeta.metaValue,
			metaValueJson: postmeta.metaValueJson,
		};
		const colNames: MetaColumnNames = {
			table: 'postmeta',
			sql: { metaId: 'meta_id', objectId: 'post_id', metaKey: 'meta_key', metaValue: 'meta_value', metaValueJson: 'meta_value_json' },
			ts: { metaId: 'metaId', objectId: 'postId', metaKey: 'metaKey', metaValue: 'metaValue', metaValueJson: 'metaValueJson' },
		};
		this.meta = new MetaRepository(db, postmeta, metaCols, colNames);
	}

	/**
	 * Create a new post.
	 */
	async create(input: CreatePostInput): Promise<PostRow> {
		const postName = input.postName || this.generateSlug(input.postTitle);
		const uniqueSlug = await this.ensureUniqueSlug(
			postName,
			input.postType ?? 'post',
		);

		const now = new Date();
		const [row] = await this.db
			.insert(posts)
			.values({
				postAuthor: input.postAuthor,
				postTitle: input.postTitle,
				postContent: input.postContent ?? '',
				postExcerpt: input.postExcerpt ?? '',
				postStatus: input.postStatus ?? 'draft',
				postName: uniqueSlug,
				postType: input.postType ?? 'post',
				postParent: input.postParent ?? 0,
				postPassword: input.postPassword ?? '',
				commentStatus: input.commentStatus ?? 'open',
				pingStatus: input.pingStatus ?? 'open',
				postMimeType: input.postMimeType ?? '',
				menuOrder: input.menuOrder ?? 0,
				guid: input.guid ?? '',
				postDate: now,
				postDateGmt: now,
				postModified: now,
				postModifiedGmt: now,
			})
			.returning();

		return row as PostRow;
	}

	/**
	 * Get a post by ID.
	 */
	async getById(id: number): Promise<PostRow | undefined> {
		const rows = await this.db.select().from(posts).where(eq(posts.id, id)).limit(1);
		return rows[0] as PostRow | undefined;
	}

	/**
	 * Get a post by slug and type.
	 */
	async getBySlug(slug: string, postType: string = 'post'): Promise<PostRow | undefined> {
		const rows = await this.db
			.select()
			.from(posts)
			.where(and(eq(posts.postName, slug), eq(posts.postType, postType)))
			.limit(1);
		return rows[0] as PostRow | undefined;
	}

	/**
	 * Update a post. Returns the updated row or undefined if not found.
	 */
	async update(id: number, input: UpdatePostInput): Promise<PostRow | undefined> {
		const existing = await this.getById(id);
		if (!existing) return undefined;

		const now = new Date();
		const updateData: Record<string, unknown> = {
			postModified: now,
			postModifiedGmt: now,
		};

		if (input.postTitle !== undefined) updateData['postTitle'] = input.postTitle;
		if (input.postContent !== undefined) updateData['postContent'] = input.postContent;
		if (input.postExcerpt !== undefined) updateData['postExcerpt'] = input.postExcerpt;
		if (input.postStatus !== undefined) updateData['postStatus'] = input.postStatus;
		if (input.postType !== undefined) updateData['postType'] = input.postType;
		if (input.postParent !== undefined) updateData['postParent'] = input.postParent;
		if (input.postPassword !== undefined) updateData['postPassword'] = input.postPassword;
		if (input.commentStatus !== undefined) updateData['commentStatus'] = input.commentStatus;
		if (input.pingStatus !== undefined) updateData['pingStatus'] = input.pingStatus;
		if (input.menuOrder !== undefined) updateData['menuOrder'] = input.menuOrder;

		if (input.postName !== undefined) {
			updateData['postName'] = await this.ensureUniqueSlug(
				input.postName,
				input.postType ?? existing.postType,
				id,
			);
		}

		const [row] = await this.db
			.update(posts)
			.set(updateData)
			.where(eq(posts.id, id))
			.returning();

		return row as PostRow;
	}

	/**
	 * Trash a post (move to trash status, preserving original status in meta).
	 */
	async trash(id: number): Promise<PostRow | undefined> {
		const existing = await this.getById(id);
		if (!existing) return undefined;
		if (existing.postStatus === 'trash') return existing;

		// Save original status so it can be restored
		await this.meta.update(id, '_trash_meta_status', existing.postStatus);

		return this.update(id, { postStatus: 'trash' });
	}

	/**
	 * Restore a trashed post to its original status.
	 */
	async untrash(id: number): Promise<PostRow | undefined> {
		const existing = await this.getById(id);
		if (!existing || existing.postStatus !== 'trash') return existing;

		const originalStatus = await this.meta.get<string>(id, '_trash_meta_status');
		await this.meta.delete(id, '_trash_meta_status');

		return this.update(id, { postStatus: originalStatus ?? 'draft' });
	}

	/**
	 * Permanently delete a post and all its metadata.
	 */
	async deletePermanently(id: number): Promise<boolean> {
		// Delete meta first (cascade should handle it but be explicit)
		await this.meta.deleteAllForObject(id);

		const result = await this.db
			.delete(posts)
			.where(eq(posts.id, id))
			.returning({ id: posts.id });

		return result.length > 0;
	}

	/**
	 * Get sticky post IDs.
	 */
	async getStickyIds(): Promise<number[]> {
		const rows = await this.db
			.select({ postId: postmeta.postId })
			.from(postmeta)
			.where(and(eq(postmeta.metaKey, '_sticky'), eq(postmeta.metaValue, '1')));

		return rows.map((r) => r.postId);
	}

	/**
	 * Set a post as sticky or not.
	 */
	async setSticky(id: number, sticky: boolean): Promise<void> {
		if (sticky) {
			await this.meta.update(id, '_sticky', '1');
		} else {
			await this.meta.delete(id, '_sticky');
		}
	}

	/**
	 * Check if a post is sticky.
	 */
	async isSticky(id: number): Promise<boolean> {
		const value = await this.meta.get(id, '_sticky');
		return value === '1' || value === 1;
	}

	/**
	 * Count posts by type and status.
	 */
	async countByStatus(
		postType: string = 'post',
	): Promise<Record<string, number>> {
		const rows = await this.db
			.select({
				status: posts.postStatus,
				count: sql<number>`count(*)::int`,
			})
			.from(posts)
			.where(eq(posts.postType, postType))
			.groupBy(posts.postStatus);

		const result: Record<string, number> = {};
		for (const row of rows) {
			result[row.status] = row.count;
		}
		return result;
	}

	/**
	 * Generate a URL-safe slug from a title.
	 */
	private generateSlug(title: string): string {
		return title
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // remove diacritics
			.replace(/[^a-z0-9_\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.substring(0, 200);
	}

	/**
	 * Ensure a slug is unique within a post type.
	 * Appends -2, -3, etc. if needed.
	 */
	private async ensureUniqueSlug(
		slug: string,
		postType: string,
		excludeId?: number,
	): Promise<string> {
		let candidate = slug;
		let suffix = 2;

		while (true) {
			const conditions = [eq(posts.postName, candidate), eq(posts.postType, postType)];
			if (excludeId !== undefined) {
				conditions.push(sql`${posts.id} != ${excludeId}`);
			}

			const existing = await this.db
				.select({ id: posts.id })
				.from(posts)
				.where(and(...conditions))
				.limit(1);

			if (existing.length === 0) return candidate;
			candidate = `${slug}-${suffix}`;
			suffix++;
		}
	}
}
