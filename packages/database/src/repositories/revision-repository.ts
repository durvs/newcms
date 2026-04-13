import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../connection';
import { posts } from '../schema/index';
import type { PostRow } from './post-repository';

/**
 * Fields that are tracked for revision diffing.
 * If none of these change, no revision is created.
 */
const REVISION_FIELDS = [
	'postTitle',
	'postContent',
	'postExcerpt',
] as const;

/**
 * Repository for post revisions.
 *
 * Revisions are stored as posts with type='revision' and
 * postParent pointing to the original post.
 */
export class RevisionRepository {
	constructor(private db: Database) {}

	/**
	 * Create a revision snapshot of a post.
	 * Returns undefined if nothing changed since the last revision.
	 *
	 * @param post - The current state of the post (before or after update)
	 * @param authorId - The user who made the change
	 */
	async createRevision(post: PostRow, authorId: number): Promise<PostRow | undefined> {
		// Check if anything actually changed
		const lastRevision = await this.getLatest(post.id);
		if (lastRevision && !this.hasChanges(post, lastRevision)) {
			return undefined;
		}

		const now = new Date();
		const [revision] = await this.db
			.insert(posts)
			.values({
				postAuthor: authorId,
				postDate: now,
				postDateGmt: now,
				postModified: now,
				postModifiedGmt: now,
				postTitle: post.postTitle,
				postContent: post.postContent,
				postExcerpt: post.postExcerpt,
				postStatus: 'inherit',
				postName: `${post.id}-revision-v1`,
				postType: 'revision',
				postParent: post.id,
			})
			.returning();

		return revision as PostRow;
	}

	/**
	 * Get all revisions for a post, newest first.
	 */
	async getRevisions(postId: number, limit?: number): Promise<PostRow[]> {
		let query = this.db
			.select()
			.from(posts)
			.where(and(eq(posts.postParent, postId), eq(posts.postType, 'revision')))
			.orderBy(desc(posts.postDate))
			.$dynamic();

		if (limit !== undefined) {
			query = query.limit(limit);
		}

		return (await query) as PostRow[];
	}

	/**
	 * Get the most recent revision for a post.
	 */
	async getLatest(postId: number): Promise<PostRow | undefined> {
		const rows = await this.getRevisions(postId, 1);
		return rows[0];
	}

	/**
	 * Get a specific revision by ID.
	 */
	async getById(revisionId: number): Promise<PostRow | undefined> {
		const rows = await this.db
			.select()
			.from(posts)
			.where(and(eq(posts.id, revisionId), eq(posts.postType, 'revision')))
			.limit(1);
		return rows[0] as PostRow | undefined;
	}

	/**
	 * Restore a post to a specific revision.
	 * Returns the updated post.
	 */
	async restore(postId: number, revisionId: number): Promise<PostRow | undefined> {
		const revision = await this.getById(revisionId);
		if (!revision || revision.postParent !== postId) return undefined;

		const now = new Date();
		const [updated] = await this.db
			.update(posts)
			.set({
				postTitle: revision.postTitle,
				postContent: revision.postContent,
				postExcerpt: revision.postExcerpt,
				postModified: now,
				postModifiedGmt: now,
			})
			.where(eq(posts.id, postId))
			.returning();

		return updated as PostRow;
	}

	/**
	 * Delete old revisions beyond the keep limit.
	 */
	async cleanup(postId: number, keepCount: number): Promise<number> {
		const revisions = await this.getRevisions(postId);
		if (revisions.length <= keepCount) return 0;

		const toDelete = revisions.slice(keepCount);
		const idsToDelete = toDelete.map((r) => r.id);

		if (idsToDelete.length === 0) return 0;

		const result = await this.db
			.delete(posts)
			.where(
				and(
					sql`${posts.id} IN (${sql.join(
						idsToDelete.map((id) => sql`${id}`),
						sql`, `,
					)})`,
					eq(posts.postType, 'revision'),
				),
			)
			.returning({ id: posts.id });

		return result.length;
	}

	/**
	 * Count revisions for a post.
	 */
	async count(postId: number): Promise<number> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(posts)
			.where(and(eq(posts.postParent, postId), eq(posts.postType, 'revision')));

		return result.count;
	}

	/**
	 * Check if any tracked field changed between two post states.
	 */
	private hasChanges(current: PostRow, previous: PostRow): boolean {
		for (const field of REVISION_FIELDS) {
			if (current[field] !== previous[field]) return true;
		}
		return false;
	}
}
