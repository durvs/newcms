'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EditorShell } from '@newcms/editor-ui';
import { api } from '@/lib/api';
import type { Post } from '@/types/api';
import type { ElementNode } from '@newcms/editor';
import { toast } from 'sonner';

/**
 * Serialize builder elements to simple HTML for postContent storage.
 * This ensures the content field has a readable HTML fallback.
 */
function serializeToHtml(elements: ElementNode[]): string {
	return elements.map((el) => {
		if (el.elType === 'container') {
			return `<div>${serializeToHtml(el.elements)}</div>`;
		}
		const s = el.settings;
		switch (el.widgetType) {
			case 'heading': {
				const tag = `h${s.level ?? 2}`;
				return `<${tag}>${String(s.content ?? '')}</${tag}>`;
			}
			case 'paragraph': return `<p>${String(s.content ?? '')}</p>`;
			case 'image': return s.url ? `<img src="${String(s.url)}" alt="${String(s.alt ?? '')}" />` : '';
			case 'button': return `<a href="${String(s.url ?? '#')}">${String(s.text ?? 'Button')}</a>`;
			case 'separator': return '<hr />';
			case 'spacer': return `<div style="height:${String(s.height ?? '40px')}"></div>`;
			case 'code': return `<pre><code>${String(s.content ?? '')}</code></pre>`;
			case 'quote': return `<blockquote><p>${String(s.content ?? '')}</p>${s.citation ? `<cite>${String(s.citation)}</cite>` : ''}</blockquote>`;
			case 'list': {
				const items = Array.isArray(s.items) ? s.items : [];
				return `<ul>${items.map((i: unknown) => `<li>${String(i)}</li>`).join('')}</ul>`;
			}
			case 'html': return String(s.content ?? '');
			default: return '';
		}
	}).join('\n');
}

export default function VisualEditorPage() {
	const params = useParams();
	const router = useRouter();
	const qc = useQueryClient();
	const id = Number(params.id);

	const { data: post, isLoading } = useQuery({
		queryKey: ['post', id],
		queryFn: () => api.get<Post>(`/posts/${id}`),
		enabled: id > 0,
	});

	const { data: builderData } = useQuery({
		queryKey: ['builder-data', id],
		queryFn: async () => {
			try {
				const meta = await api.get<{ key: string; value: unknown }>(`/posts/${id}/meta/_builder_data`);
				return (meta.value as ElementNode[]) ?? [];
			} catch {
				return [] as ElementNode[];
			}
		},
		enabled: id > 0,
	});

	async function handleSave(elements: ElementNode[]) {
		try {
			// Save builder data to postmeta
			await api.put(`/posts/${id}/meta/_builder_data`, { value: elements });

			// Also update postContent with HTML serialization for search/RSS/fallback
			const html = serializeToHtml(elements);
			await api.put(`/posts/${id}`, { content: html });

			qc.invalidateQueries({ queryKey: ['post', id] });
			toast.success('Saved');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save');
		}
	}

	if (isLoading) {
		return (
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cm-surface)' }}>
				<div style={{ width: 24, height: 24, border: '2px solid var(--cm-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
			</div>
		);
	}

	return (
		<EditorShell
			documentId={id}
			documentType="post"
			initialElements={builderData ?? []}
			title={post?.postTitle}
			onSave={handleSave}
			onBack={() => router.push('/posts')}
		/>
	);
}
