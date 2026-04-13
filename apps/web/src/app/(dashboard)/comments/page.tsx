'use client';

import { useState } from 'react';
import { useComments, useModerateComment, useDeleteComment } from '@/hooks/use-comments';
import { Check, X, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const statusTabs = [
	{ label: 'Approved', value: '1' },
	{ label: 'Pending', value: '0' },
	{ label: 'Spam', value: 'spam' },
	{ label: 'Trash', value: 'trash' },
];

export default function CommentsPage() {
	const [status, setStatus] = useState('1');
	const { data: comments, isLoading } = useComments(undefined, status);
	const moderateMut = useModerateComment();
	const deleteMut = useDeleteComment();

	function handleModerate(id: number, action: 'approve' | 'unapprove' | 'spam') {
		moderateMut.mutate({ id, action }, {
			onSuccess: () => toast.success(`Comment ${action}d`),
			onError: (err) => toast.error(err.message),
		});
	}

	function handleDelete(id: number, force: boolean) {
		deleteMut.mutate({ id, force }, {
			onSuccess: () => toast.success(force ? 'Comment deleted' : 'Comment trashed'),
			onError: (err) => toast.error(err.message),
		});
	}

	return (
		<div>
			<div className="mb-6 animate-fade-in-up">
				<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">Moderation</p>
				<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Comments</h1>
			</div>

			{/* Status tabs */}
			<div className="mb-4 animate-fade-in-up-delay-1">
				<div className="flex gap-1 rounded-lg bg-surface-elevated p-1 w-fit">
					{statusTabs.map((tab) => (
						<button
							key={tab.value}
							onClick={() => setStatus(tab.value)}
							className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
								status === tab.value
									? 'bg-surface text-text shadow-sm'
									: 'text-text-muted hover:text-text'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Comments list */}
			<div className="space-y-3 animate-fade-in-up-delay-2">
				{isLoading && (
					<div className="py-12 text-center">
						<div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
					</div>
				)}

				{!isLoading && Array.isArray(comments) && comments.map((comment) => (
					<div
						key={comment.commentId}
						className="rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-text-faint/20"
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-start gap-3 min-w-0 flex-1">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
									{comment.commentAuthor.charAt(0).toUpperCase()}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="text-[13px] font-semibold text-text">
											{comment.commentAuthor}
										</p>
										{comment.commentAuthorEmail && (
											<span className="text-[11px] text-text-faint">
												{comment.commentAuthorEmail}
											</span>
										)}
									</div>
									<p className="mt-1 text-sm leading-relaxed text-text-muted">
										{comment.commentContent}
									</p>
									<div className="mt-2 flex items-center gap-3">
										<span className="text-[11px] text-text-faint font-mono">
											Post #{comment.commentPostId}
										</span>
										<span className="text-[11px] text-text-faint font-mono">
											{new Date(comment.commentDate).toLocaleDateString('en-US', {
												month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
											})}
										</span>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex shrink-0 items-center gap-1">
								{status !== '1' && (
									<button
										onClick={() => handleModerate(comment.commentId, 'approve')}
										className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
										title="Approve"
									>
										<Check className="h-4 w-4" />
									</button>
								)}
								{status === '1' && (
									<button
										onClick={() => handleModerate(comment.commentId, 'unapprove')}
										className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-accent/10 hover:text-accent"
										title="Unapprove"
									>
										<X className="h-4 w-4" />
									</button>
								)}
								{status !== 'spam' && (
									<button
										onClick={() => handleModerate(comment.commentId, 'spam')}
										className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-amber-500/10 hover:text-amber-400"
										title="Spam"
									>
										<AlertTriangle className="h-4 w-4" />
									</button>
								)}
								<button
									onClick={() => handleDelete(comment.commentId, status === 'trash')}
									className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-error-soft/10 hover:text-error-soft"
									title={status === 'trash' ? 'Delete permanently' : 'Trash'}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				))}

				{!isLoading && (!Array.isArray(comments) || comments.length === 0) && (
					<div className="rounded-xl border border-border bg-surface-elevated py-12 text-center">
						<MessageSquare className="mx-auto h-8 w-8 text-text-faint" />
						<p className="mt-3 text-sm text-text-muted">No comments in this category</p>
					</div>
				)}
			</div>
		</div>
	);
}
