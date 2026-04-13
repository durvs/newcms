'use client';

import { useState } from 'react';
import { usePosts, useDeletePost } from '@/hooks/use-posts';
import Link from 'next/link';
import { Plus, Search, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const statusTabs = [
	{ label: 'Published', value: 'publish' },
	{ label: 'Drafts', value: 'draft' },
	{ label: 'Trash', value: 'trash' },
];

const statusBadge: Record<string, string> = {
	publish: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
	draft: 'bg-accent/10 text-accent ring-1 ring-accent/20',
	pending: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
	trash: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
	private: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
};

export default function PostsPage() {
	const [status, setStatus] = useState('publish');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);

	const { data, isLoading } = usePosts({ page, status, search: search || undefined });
	const deleteMut = useDeletePost();

	function handleTrash(id: number) {
		deleteMut.mutate({ id }, {
			onSuccess: () => toast.success('Post moved to trash'),
		});
	}

	return (
		<div>
			{/* Header */}
			<div className="mb-6 flex items-end justify-between animate-fade-in-up">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">Content</p>
					<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Posts</h1>
				</div>
				<Link
					href="/posts/new"
					className="group flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-surface transition-all hover:bg-accent-hover active:scale-[0.98]"
				>
					<Plus className="h-4 w-4" />
					New Post
				</Link>
			</div>

			{/* Toolbar */}
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up-delay-1">
				{/* Status tabs */}
				<div className="flex gap-1 rounded-lg bg-surface-elevated p-1">
					{statusTabs.map((tab) => (
						<button
							key={tab.value}
							onClick={() => { setStatus(tab.value); setPage(1); }}
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

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
					<input
						type="text"
						placeholder="Search posts..."
						value={search}
						onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						className="h-9 w-full rounded-lg border border-border bg-input-bg pl-9 pr-3 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20 sm:w-64"
					/>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl border border-border bg-surface-elevated animate-fade-in-up-delay-2">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-border">
								<th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Title</th>
								<th className="hidden px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted sm:table-cell">Status</th>
								<th className="hidden px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted md:table-cell">Date</th>
								<th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{isLoading && (
								<tr>
									<td colSpan={4} className="px-5 py-12 text-center">
										<div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
									</td>
								</tr>
							)}
							{data?.posts.map((post) => (
								<tr key={post.id} className="group transition-colors hover:bg-surface-overlay/50">
									<td className="px-5 py-3">
										<Link href={`/editor/${post.id}`} className="block">
											<p className="text-[13px] font-medium text-text group-hover:text-accent transition-colors">
												{post.postTitle || '(no title)'}
											</p>
											<p className="mt-0.5 text-[11px] text-text-faint font-mono">/{post.postName}</p>
										</Link>
									</td>
									<td className="hidden px-5 py-3 sm:table-cell">
										<span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[post.postStatus] ?? statusBadge['draft']}`}>
											{post.postStatus}
										</span>
									</td>
									<td className="hidden px-5 py-3 md:table-cell">
										<span className="text-xs text-text-muted font-mono">
											{new Date(post.postDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</span>
									</td>
									<td className="px-5 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											<a
												href={`/${post.postName}`}
												target="_blank"
												rel="noopener noreferrer"
												className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface hover:text-accent"
												title="View"
											>
												<ExternalLink className="h-3.5 w-3.5" />
											</a>
											<Link
												href={`/editor/${post.id}`}
												className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface hover:text-text"
												title="Edit"
											>
												<Pencil className="h-3.5 w-3.5" />
											</Link>
											{post.postStatus !== 'trash' && (
												<button
													onClick={() => handleTrash(post.id)}
													className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-error-soft/10 hover:text-error-soft"
													title="Trash"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
							{!isLoading && data?.posts.length === 0 && (
								<tr>
									<td colSpan={4} className="px-5 py-12 text-center text-sm text-text-muted">
										No posts found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{data && data.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-border px-5 py-3">
						<p className="text-xs text-text-muted">
							Page {data.page} of {data.totalPages} ({data.total} total)
						</p>
						<div className="flex gap-1">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1}
								className="rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
							>
								Previous
							</button>
							<button
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.totalPages}
								className="rounded-md px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
