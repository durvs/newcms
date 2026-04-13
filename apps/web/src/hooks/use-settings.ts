'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Settings } from '@/types/api';

export function useSettings() {
	return useQuery({
		queryKey: ['settings'],
		queryFn: () => api.get<Settings>('/settings'),
	});
}

export function useUpdateSetting() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ name, value }: { name: string; value: unknown }) =>
			api.put(`/settings/${name}`, { value }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['settings'] });
		},
	});
}
