'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePost, useUpdatePost } from '@/hooks/use-posts';
import { ArrowLeft, Save, Eye, Globe, Code2, Palette } from 'lucide-react';
import { BlockPreview } from './block-preview';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Post } from '@/types/api';

interface PostEditorProps {
	post?: Post;
}

export function PostEditor({ post }: PostEditorProps) {
	const router = useRouter();
	const isNew = !post;
	const createMut = useCreatePost();
	const updateMut = useUpdatePost(post?.id ?? 0);

	const [title, setTitle] = useState(post?.postTitle ?? '');
	const [content, setContent] = useState(post?.postContent ?? '');
	const [excerpt, setExcerpt] = useState(post?.postExcerpt ?? '');
	const [status, setStatus] = useState(post?.postStatus ?? 'draft');
	const [slug, setSlug] = useState(post?.postName ?? '');
	const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

	const saving = createMut.isPending || updateMut.isPending;

	async function handleSave(publishStatus?: string) {
		const saveStatus = publishStatus ?? status;

		if (isNew) {
			createMut.mutate(
				{ title, content, excerpt, status: saveStatus, slug: slug || undefined },
				{
					onSuccess: (data) => {
						toast.success(saveStatus === 'publish' ? 'Post published' : 'Draft saved');
						router.push(`/editor/${data.id}`);
					},
					onError: (err) => toast.error(err.message),
				},
			);
		} else {
			updateMut.mutate(
				{ title, content, excerpt, status: saveStatus, slug: slug || undefined },
				{
					onSuccess: () => toast.success('Post updated'),
					onError: (err) => toast.error(err.message),
				},
			);
		}
	}

	return (
		<div>
			{/* Header */}
			<div className="mb-6 flex items-center justify-between animate-fade-in-up">
				<div className="flex items-center gap-3">
					<Link
						href="/posts"
						className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-elevated hover:text-text"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div>
						<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">
							{isNew ? 'New post' : 'Editing'}
						</p>
						<h1 className="mt-0.5 text-lg font-bold tracking-tight text-text">
							{isNew ? 'Create Post' : (title || '(untitled)')}
						</h1>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{!isNew && (
						<Link
							href={`/editor/${post?.id}`}
							className="flex items-center gap-2 rounded-lg border border-accent/30 px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
						>
							<Palette className="h-3.5 w-3.5" />
							Visual Editor
						</Link>
					)}
					{status !== 'publish' && (
						<button
							onClick={() => handleSave('draft')}
							disabled={saving}
							className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface-elevated hover:text-text disabled:opacity-50"
						>
							<Save className="h-3.5 w-3.5" />
							Save Draft
						</button>
					)}
					<button
						onClick={() => handleSave('publish')}
						disabled={saving || !title.trim()}
						className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-surface transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
					>
						<Globe className="h-3.5 w-3.5" />
						{status === 'publish' ? 'Update' : 'Publish'}
					</button>
				</div>
			</div>

			{/* Editor */}
			<div className="grid gap-6 lg:grid-cols-[1fr_280px] animate-fade-in-up-delay-1">
				{/* Main content */}
				<div className="space-y-4">
					<input
						type="text"
						placeholder="Post title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full bg-transparent text-2xl font-bold tracking-tight text-text placeholder:text-text-faint outline-none"
					/>

					{/* View mode toggle */}
					<div className="flex gap-1 rounded-lg bg-surface-elevated p-1 w-fit">
						<button
							onClick={() => setViewMode('code')}
							className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
								viewMode === 'code' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
							}`}
						>
							<Code2 className="h-3.5 w-3.5" />
							Code
						</button>
						<button
							onClick={() => setViewMode('preview')}
							className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
								viewMode === 'preview' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
							}`}
						>
							<Eye className="h-3.5 w-3.5" />
							Preview
						</button>
					</div>

					{viewMode === 'code' ? (
						<textarea
							placeholder="Write your content using block syntax...&#10;&#10;<!-- cms:paragraph -->&#10;<p>Your text here</p>&#10;<!-- /cms:paragraph -->"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={20}
							className="w-full resize-none rounded-xl border border-border bg-surface-elevated px-5 py-4 font-mono text-sm leading-relaxed text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
						/>
					) : (
						<BlockPreview content={content} />
					)}
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					{/* Status */}
					<div className="rounded-xl border border-border bg-surface-elevated p-4">
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</h3>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent/50"
						>
							<option value="draft">Draft</option>
							<option value="publish">Published</option>
							<option value="pending">Pending Review</option>
							<option value="private">Private</option>
						</select>
					</div>

					{/* Slug */}
					<div className="rounded-xl border border-border bg-surface-elevated p-4">
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">URL Slug</h3>
						<input
							type="text"
							placeholder="auto-generated"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent/50 font-mono"
						/>
					</div>

					{/* Excerpt */}
					<div className="rounded-xl border border-border bg-surface-elevated p-4">
						<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Excerpt</h3>
						<textarea
							placeholder="Brief summary..."
							value={excerpt}
							onChange={(e) => setExcerpt(e.target.value)}
							rows={3}
							className="w-full resize-none rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent/50"
						/>
					</div>

					{/* Info */}
					{post && (
						<div className="rounded-xl border border-border-subtle bg-surface-elevated p-4">
							<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Info</h3>
							<div className="space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-text-muted">ID</span>
									<span className="font-mono text-text-faint">{post.id}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted">Created</span>
									<span className="font-mono text-text-faint">{new Date(post.postDate).toLocaleDateString()}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted">Modified</span>
									<span className="font-mono text-text-faint">{new Date(post.postModified).toLocaleDateString()}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
