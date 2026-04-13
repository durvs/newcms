'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RenderElements } from '@/components/frontend/element-renderer';
import type { Post } from '@/types/api';

interface ElementNode { id: string; elType: string; widgetType?: string; settings: Record<string, unknown>; elements: ElementNode[] }
interface KitData { colors?: { id: string; color: string }[]; typography?: Record<string, unknown>[]; bodyFontFamily?: string }

export default function PublicPage() {
	const params = useParams();
	const slugParts = params.slug as string[];
	const slug = slugParts?.join('/') ?? '';

	const { data: postsData, isLoading } = useQuery({
		queryKey: ['public-page', slug],
		queryFn: async () => {
			const pages = await api.get<{ posts: Post[] }>(`/posts?slug=${slug}&type=page&status=publish`);
			if (pages.posts.length > 0) return pages.posts[0];
			const posts = await api.get<{ posts: Post[] }>(`/posts?slug=${slug}&type=post&status=publish`);
			if (posts.posts.length > 0) return posts.posts[0];
			return null;
		},
		staleTime: 30000,
	});

	const postId = postsData?.id;
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

	const { data: designKit } = useQuery({
		queryKey: ['design-kit'],
		queryFn: () => api.get<Record<string, unknown>>('/templates/design-kit'),
		staleTime: 60000,
	});

	if (isLoading) {
		return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
			<div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
		</div>;
	}

	if (!postsData) {
		return <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
			<h1 style={{ fontSize: 64, fontWeight: 700, margin: 0, color: '#e5e7eb' }}>404</h1>
			<p style={{ fontSize: 18, color: '#64748b', marginTop: 8 }}>Page not found</p>
			<a href="/" style={{ color: '#6366f1', fontSize: 14, textDecoration: 'none' }}>← Back to home</a>
		</div>;
	}

	const kitCSS = designKit ? buildKitCSS(designKit as KitData) : '';

	if (builderData && Array.isArray(builderData) && builderData.length > 0) {
		return <article>
			{kitCSS && <style>{kitCSS}</style>}
			<div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
				<RenderElements elements={builderData as ElementNode[]} />
			</div>
		</article>;
	}

	// Fallback: render postContent as HTML — admin-authored CMS content (nosemgrep)
	return <article style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
		<h1 style={{ fontSize: '2em', fontWeight: 700, marginBottom: 16 }}>{postsData.postTitle}</h1>
		<div style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: postsData.postContent }} />
	</article>;
}

function buildKitCSS(kit: KitData): string {
	const lines: string[] = [];
	if (kit.colors) for (const c of kit.colors) lines.push(`--e-global-color-${c.id}:${c.color};`);
	if (kit.typography) for (const t of kit.typography) {
		const id = String((t as Record<string, unknown>).id ?? '');
		const ff = (t as Record<string, unknown>).fontFamily;
		if (ff) lines.push(`--e-global-typography-${id}-font-family:${ff};`);
	}
	const root = lines.length > 0 ? `:root{${lines.join('')}}` : '';
	const bodyFont = kit.bodyFontFamily ?? ((kit.typography?.[0] as Record<string, unknown>)?.fontFamily as string);
	const body = bodyFont ? `body{font-family:${bodyFont},system-ui,sans-serif}` : '';
	const fonts = new Set<string>();
	if (kit.typography) for (const t of kit.typography) { const ff = (t as Record<string, unknown>).fontFamily; if (typeof ff === 'string') fonts.add(ff); }
	const imp = fonts.size > 0 ? `@import url('https://fonts.googleapis.com/css2?${[...fonts].map((f) => `family=${f.replace(/\s/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap');` : '';
	return [imp, root, body].filter(Boolean).join('\n');
}
