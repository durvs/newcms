'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
	theme: Theme;
	toggle: () => void;
	hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
	theme: 'dark',

	toggle: () => {
		const next = get().theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', next);
		localStorage.setItem('newcms_theme', next);
		set({ theme: next });
	},

	hydrate: () => {
		const saved = localStorage.getItem('newcms_theme') as Theme | null;
		const preferred = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		document.documentElement.setAttribute('data-theme', preferred);
		set({ theme: preferred });
	},
}));
