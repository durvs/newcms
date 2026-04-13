'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Edit post redirects to the visual editor — the builder is the primary editing mode.
 */
export default function EditPostPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id;

	useEffect(() => {
		router.replace(`/editor/${id}`);
	}, [id, router]);

	return (
		<div className="flex items-center justify-center py-20">
			<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
		</div>
	);
}
