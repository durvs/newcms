'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { EditorShell } from '@newcms/editor-ui';
import { api } from '@/lib/api';
import type { Post } from '@/types/api';
import type { ElementNode } from '@newcms/editor';
import { toast } from 'sonner';

export default function VisualEditorPage() {
	const params = useParams();
	const router = useRouter();
	const id = Number(params.id);

	const { data: post, isLoading } = useQuery({
		queryKey: ['post', id],
		queryFn: () => api.get<Post>(`/posts/${id}`),
		enabled: id > 0,
	});

	// Load builder data from postmeta (falls back to empty array)
	const { data: builderData } = useQuery({
		queryKey: ['builder-data', id],
		queryFn: async () => {
			try {
				const meta = await api.get<{ name: string; value: unknown }>(`/settings/_builder_data_${id}`);
				return (meta.value as ElementNode[]) ?? [];
			} catch {
				return [] as ElementNode[];
			}
		},
		enabled: id > 0,
	});

	async function handleSave(elements: ElementNode[]) {
		try {
			await api.put(`/settings/_builder_data_${id}`, { value: elements });
			toast.success('Saved');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save');
		}
	}

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-[var(--cm-surface)]">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--cm-border)] border-t-[var(--color-accent)]" />
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
			onBack={() => router.push(`/posts/${id}/edit`)}
		/>
	);
}
