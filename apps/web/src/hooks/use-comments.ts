'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comment {
	commentId: number;
	commentPostId: number;
	commentAuthor: string;
	commentAuthorEmail: string;
	commentContent: string;
	commentDate: string;
	commentApproved: string;
	commentParent: number;
	commentType: string;
}

export function useComments(postId?: number, status?: string) {
	const qs = new URLSearchParams();
	if (postId) qs.set('post', String(postId));
	if (status) qs.set('status', status);

	return useQuery({
		queryKey: ['comments', postId, status],
		queryFn: () => api.get<Comment[]>(`/comments?${qs}`),
	});
}

export function useModerateComment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, action }: { id: number; action: 'approve' | 'unapprove' | 'spam' }) =>
			api.put(`/comments/${id}/${action}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
	});
}

export function useDeleteComment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, force = false }: { id: number; force?: boolean }) =>
			api.delete(`/comments/${id}${force ? '?force=true' : ''}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
	});
}
