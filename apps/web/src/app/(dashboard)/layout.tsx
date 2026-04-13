'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { AppSidebar } from '@/components/layout/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const hydrate = useAuthStore((s) => s.hydrate);

	useEffect(() => {
		hydrate();
	}, [hydrate]);

	return (
		<div className="noise-bg flex h-screen bg-surface">
			<AppSidebar />
			<main className="relative z-10 flex-1 overflow-auto">
				<div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
					{children}
				</div>
			</main>
		</div>
	);
}
