'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Post, PostsResponse } from '@/types/api';

interface PostsParams {
	page?: number;
	perPage?: number;
	status?: string;
	search?: string;
	type?: string;
}

export function usePosts(params: PostsParams = {}) {
	const { page = 1, perPage = 20, status = 'publish', search, type = 'post' } = params;
	const qs = new URLSearchParams({
		page: String(page),
		per_page: String(perPage),
		status,
		type,
	});
	if (search) qs.set('search', search);

	return useQuery({
		queryKey: ['posts', params],
		queryFn: () => api.get<PostsResponse>(`/posts?${qs}`),
	});
}

export function usePost(id: number) {
	return useQuery({
		queryKey: ['post', id],
		queryFn: () => api.get<Post>(`/posts/${id}`),
		enabled: id > 0,
	});
}

export function useCreatePost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			title: string;
			content?: string;
			excerpt?: string;
			status?: string;
			type?: string;
			slug?: string;
		}) => api.post<Post>('/posts', data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['posts'] });
		},
	});
}

export function useUpdatePost(id: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			title?: string;
			content?: string;
			excerpt?: string;
			status?: string;
			slug?: string;
		}) => api.put<Post>(`/posts/${id}`, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['posts'] });
			qc.invalidateQueries({ queryKey: ['post', id] });
		},
	});
}

export function useDeletePost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, force = false }: { id: number; force?: boolean }) =>
			api.delete<{ deleted?: boolean } & Post>(`/posts/${id}${force ? '?force=true' : ''}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['posts'] });
		},
	});
}
