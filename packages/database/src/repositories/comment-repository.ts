import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '../connection';
import { comments, commentmeta, posts } from '../schema/index';
import { MetaRepository, type MetaTableColumns, type MetaColumnNames } from './meta-repository';

export interface CreateCommentInput {
	commentPostId: number;
	commentAuthor: string;
	commentAuthorEmail?: string;
	commentAuthorUrl?: string;
	commentAuthorIp?: string;
	commentContent: string;
	commentType?: string;
	commentParent?: number;
	userId?: number;
	commentApproved?: string;
}

export interface CommentRow {
	commentId: number;
	commentPostId: number;
	commentAuthor: string;
	commentAuthorEmail: string;
	commentAuthorUrl: string;
	commentAuthorIp: string;
	commentDate: Date;
	commentDateGmt: Date;
	commentContent: string;
	commentKarma: number;
	commentApproved: string;
	commentAgent: string;
	commentType: string;
	commentParent: number;
	userId: number;
}

export interface CommentModerationRules {
	blockedWords?: string[];
	moderationWords?: string[];
	maxLinks?: number;
	floodSeconds?: number;
}

export class CommentRepository {
	readonly meta: MetaRepository;

	constructor(private db: Database) {
		const metaCols: MetaTableColumns = {
			metaId: commentmeta.metaId,
			objectId: commentmeta.commentId,
			metaKey: commentmeta.metaKey,
			metaValue: commentmeta.metaValue,
			metaValueJson: commentmeta.metaValueJson,
		};
		const colNames: MetaColumnNames = {
			table: 'commentmeta',
			sql: { metaId: 'meta_id', objectId: 'comment_id', metaKey: 'meta_key', metaValue: 'meta_value', metaValueJson: 'meta_value_json' },
			ts: { metaId: 'metaId', objectId: 'commentId', metaKey: 'metaKey', metaValue: 'metaValue', metaValueJson: 'metaValueJson' },
		};
		this.meta = new MetaRepository(db, commentmeta, metaCols, colNames);
	}

	async create(input: CreateCommentInput): Promise<CommentRow> {
		const now = new Date();
		const [row] = await this.db
			.insert(comments)
			.values({
				commentPostId: input.commentPostId,
				commentAuthor: input.commentAuthor,
				commentAuthorEmail: input.commentAuthorEmail ?? '',
				commentAuthorUrl: input.commentAuthorUrl ?? '',
				commentAuthorIp: input.commentAuthorIp ?? '',
				commentContent: input.commentContent,
				commentType: input.commentType ?? 'comment',
				commentParent: input.commentParent ?? 0,
				userId: input.userId ?? 0,
				commentApproved: input.commentApproved ?? '1',
				commentDate: now,
				commentDateGmt: now,
			})
			.returning();

		// Update comment count on post
		await this.updatePostCommentCount(input.commentPostId);

		return row as CommentRow;
	}

	async getById(id: number): Promise<CommentRow | undefined> {
		const rows = await this.db.select().from(comments).where(eq(comments.commentId, id)).limit(1);
		return rows[0] as CommentRow | undefined;
	}

	async getByPost(postId: number, status?: string): Promise<CommentRow[]> {
		const conditions = [eq(comments.commentPostId, postId)];
		if (status) conditions.push(eq(comments.commentApproved, status));

		return (await this.db
			.select()
			.from(comments)
			.where(and(...conditions))
			.orderBy(comments.commentDate)) as CommentRow[];
	}

	/**
	 * Get threaded comments — returns flat list, client builds the tree
	 * using commentParent references.
	 */
	async getThreaded(postId: number, _depth: number = 5): Promise<CommentRow[]> {
		return this.getByPost(postId, '1');
	}

	async approve(id: number): Promise<boolean> {
		const comment = await this.getById(id);
		if (!comment) return false;
		await this.db.update(comments).set({ commentApproved: '1' }).where(eq(comments.commentId, id));
		await this.updatePostCommentCount(comment.commentPostId);
		return true;
	}

	async unapprove(id: number): Promise<boolean> {
		const comment = await this.getById(id);
		if (!comment) return false;
		await this.db.update(comments).set({ commentApproved: '0' }).where(eq(comments.commentId, id));
		await this.updatePostCommentCount(comment.commentPostId);
		return true;
	}

	async spam(id: number): Promise<boolean> {
		const comment = await this.getById(id);
		if (!comment) return false;
		await this.db.update(comments).set({ commentApproved: 'spam' }).where(eq(comments.commentId, id));
		await this.updatePostCommentCount(comment.commentPostId);
		return true;
	}

	async trash(id: number): Promise<boolean> {
		const comment = await this.getById(id);
		if (!comment) return false;
		await this.meta.update(id, '_trash_status', comment.commentApproved);
		await this.db.update(comments).set({ commentApproved: 'trash' }).where(eq(comments.commentId, id));
		await this.updatePostCommentCount(comment.commentPostId);
		return true;
	}

	async deletePermanently(id: number): Promise<boolean> {
		const comment = await this.getById(id);
		if (!comment) return false;
		await this.meta.deleteAllForObject(id);
		const result = await this.db.delete(comments).where(eq(comments.commentId, id)).returning({ commentId: comments.commentId });
		if (result.length > 0) await this.updatePostCommentCount(comment.commentPostId);
		return result.length > 0;
	}

	/**
	 * Check moderation rules before approving a comment.
	 */
	moderate(content: string, _authorEmail: string, rules: CommentModerationRules): 'approve' | 'hold' | 'spam' {
		const lower = content.toLowerCase();

		// Blocked words → spam
		if (rules.blockedWords) {
			for (const word of rules.blockedWords) {
				if (lower.includes(word.toLowerCase())) return 'spam';
			}
		}

		// Moderation words → hold
		if (rules.moderationWords) {
			for (const word of rules.moderationWords) {
				if (lower.includes(word.toLowerCase())) return 'hold';
			}
		}

		// Too many links → hold
		if (rules.maxLinks !== undefined) {
			const linkCount = (content.match(/https?:\/\//g) ?? []).length;
			if (linkCount > rules.maxLinks) return 'hold';
		}

		return 'approve';
	}

	/**
	 * Check for duplicate comment.
	 */
	async isDuplicate(postId: number, authorEmail: string, content: string): Promise<boolean> {
		const rows = await this.db
			.select({ commentId: comments.commentId })
			.from(comments)
			.where(
				and(
					eq(comments.commentPostId, postId),
					eq(comments.commentAuthorEmail, authorEmail),
					eq(comments.commentContent, content),
				),
			)
			.limit(1);
		return rows.length > 0;
	}

	/**
	 * Check flood protection — has user commented too recently?
	 */
	async isFlooding(authorIp: string, floodSeconds: number): Promise<boolean> {
		const cutoff = new Date(Date.now() - floodSeconds * 1000);
		const rows = await this.db
			.select({ commentId: comments.commentId })
			.from(comments)
			.where(
				and(
					eq(comments.commentAuthorIp, authorIp),
					sql`${comments.commentDate} > ${cutoff}`,
				),
			)
			.limit(1);
		return rows.length > 0;
	}

	async countByStatus(postId?: number): Promise<Record<string, number>> {
		const conditions = postId !== undefined ? [eq(comments.commentPostId, postId)] : [];
		const rows = await this.db
			.select({ status: comments.commentApproved, count: sql<number>`count(*)::int` })
			.from(comments)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.groupBy(comments.commentApproved);

		const result: Record<string, number> = {};
		for (const row of rows) result[row.status] = row.count;
		return result;
	}

	private async updatePostCommentCount(postId: number): Promise<void> {
		const [result] = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(comments)
			.where(and(eq(comments.commentPostId, postId), eq(comments.commentApproved, '1')));

		await this.db
			.update(posts)
			.set({ commentCount: result.count })
			.where(eq(posts.id, postId));
	}
}
