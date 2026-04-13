'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RenderElements } from '@/components/frontend/element-renderer';
import type { Post } from '@/types/api';
import Link from 'next/link';

interface ElementNode { id: string; elType: string; widgetType?: string; settings: Record<string, unknown>; elements: ElementNode[] }

export default function HomePage() {
	// Try to load the "Home" page by slug
	const { data: homePost } = useQuery({
		queryKey: ['public-home'],
		queryFn: async () => {
			// Try builder_page "Home" first
			const pages = await api.get<{ posts: Post[] }>('/posts?slug=home&status=publish&per_page=1');
			if (pages.posts.length > 0) return pages.posts[0];
			// Try any page set as front page
			const allPages = await api.get<{ posts: Post[] }>('/posts?type=page&status=publish&per_page=1');
			if (allPages.posts.length > 0) return allPages.posts[0];
			return null;
		},
		staleTime: 30000,
	});

	const postId = homePost?.id;
	const { data: builderData } = useQuery({
		queryKey: ['public-builder', postId],
		queryFn: async () => {
			try {
				const meta = await api.get<{ key: string; value: unknown }>(`/posts/${postId}/meta/_builder_data`);
				return meta.value as ElementNode[] | null;
			} catch { return null; }
		},
		enabled: !!postId,
		staleTime: 30000,
	});

	// If we have builder data, render it
	if (builderData && Array.isArray(builderData) && builderData.length > 0) {
		return (
			<div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
				<RenderElements elements={builderData as ElementNode[]} />
			</div>
		);
	}

	// Default homepage — list of recent posts
	return <RecentPosts />;
}

function RecentPosts() {
	const { data } = useQuery({
		queryKey: ['public-recent-posts'],
		queryFn: () => api.get<{ posts: Post[] }>('/posts?status=publish&per_page=10'),
		staleTime: 30000,
	});

	return (
		<div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
			<h1 style={{ fontSize: '2em', fontWeight: 700, marginBottom: 32 }}>Recent Posts</h1>
			{data?.posts.map((post) => (
				<article key={post.id} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid #f1f5f9' }}>
					<Link href={`/${post.postName}`} style={{ textDecoration: 'none' }}>
						<h2 style={{ fontSize: '1.5em', fontWeight: 600, color: '#1e293b', margin: 0 }}>
							{post.postTitle}
						</h2>
					</Link>
					<time style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginTop: 4 }}>
						{new Date(post.postDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
					</time>
					{post.postExcerpt && (
						<p style={{ color: '#64748b', lineHeight: 1.7, marginTop: 8 }}>{post.postExcerpt}</p>
					)}
				</article>
			))}
			{(!data?.posts || data.posts.length === 0) && (
				<p style={{ color: '#94a3b8', textAlign: 'center', padding: 48 }}>No posts yet</p>
			)}
		</div>
	);
}
