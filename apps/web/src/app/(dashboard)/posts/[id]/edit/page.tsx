'use client';

import { useParams } from 'next/navigation';
import { usePost } from '@/hooks/use-posts';
import { PostEditor } from '@/components/posts/post-editor';

export default function EditPostPage() {
	const params = useParams();
	const id = Number(params.id);
	const { data: post, isLoading } = usePost(id);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
			</div>
		);
	}

	if (!post) {
		return (
			<div className="py-20 text-center text-sm text-text-muted">Post not found</div>
		);
	}

	return <PostEditor post={post} />;
}
