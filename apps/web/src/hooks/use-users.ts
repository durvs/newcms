'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types/api';

export function useUsers() {
	return useQuery({
		queryKey: ['users'],
		queryFn: () => api.get<User[]>('/users'),
	});
}

export function useUser(id: number) {
	return useQuery({
		queryKey: ['user', id],
		queryFn: () => api.get<User>(`/users/${id}`),
		enabled: id > 0,
	});
}
