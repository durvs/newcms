'use client';

import { create } from 'zustand';
import { getToken, getUserCookie, setToken, setUserCookie, clearAuth } from '@/lib/api';

interface AuthUser {
	id: number;
	login: string;
	email: string;
	displayName: string;
}

interface AuthState {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (token: string, user: AuthUser, expiresAt?: string) => void;
	logout: () => void;
	hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isAuthenticated: false,

	login: (token, user, expiresAt) => {
		setToken(token, expiresAt);
		setUserCookie(user);
		set({ user, token, isAuthenticated: true });
	},

	logout: () => {
		const token = getToken();
		if (token) {
			fetch('/api/v2/auth/logout', {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			}).catch(() => {});
		}
		clearAuth();
		set({ user: null, token: null, isAuthenticated: false });
	},

	hydrate: () => {
		const token = getToken();
		const user = getUserCookie();
		if (token && user) {
			set({ user, token, isAuthenticated: true });
		}
	},
}));
