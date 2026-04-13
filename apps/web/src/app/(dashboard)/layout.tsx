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
		<div className="flex h-screen">
			<AppSidebar />
			<main className="flex-1 overflow-auto bg-background">
				<div className="p-6">{children}</div>
			</main>
		</div>
	);
}
