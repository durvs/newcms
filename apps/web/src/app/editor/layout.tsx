'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

/**
 * Editor layout — full viewport, no sidebar, no padding, no max-width.
 * The EditorShell manages its own chrome (toolbar, panel, preview).
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
	const hydrate = useAuthStore((s) => s.hydrate);
	const hydrateTheme = useThemeStore((s) => s.hydrate);

	useEffect(() => {
		hydrate();
		hydrateTheme();
	}, [hydrate, hydrateTheme]);

	return (
		<div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
			{children}
		</div>
	);
}
