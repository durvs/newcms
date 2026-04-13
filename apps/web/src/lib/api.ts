import Cookies from 'js-cookie';

const TOKEN_COOKIE = 'newcms_token';
const USER_COOKIE = 'newcms_user';

export function getToken(): string | undefined {
	return Cookies.get(TOKEN_COOKIE);
}

export function setToken(token: string, expiresAt?: string) {
	const expires = expiresAt ? new Date(expiresAt) : 14;
	Cookies.set(TOKEN_COOKIE, token, { expires, path: '/' });
}

export function setUserCookie(user: { id: number; login: string; email: string; displayName: string }) {
	Cookies.set(USER_COOKIE, JSON.stringify(user), { expires: 14, path: '/' });
}

export function getUserCookie() {
	const raw = Cookies.get(USER_COOKIE);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function clearAuth() {
	Cookies.remove(TOKEN_COOKIE, { path: '/' });
	Cookies.remove(USER_COOKIE, { path: '/' });
}

class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...((options.headers as Record<string, string>) ?? {}),
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const res = await fetch(`/api/v2${path}`, {
		...options,
		headers,
	});

	if (res.status === 401) {
		clearAuth();
		if (typeof window !== 'undefined') {
			window.location.href = '/login';
		}
		throw new ApiError(401, 'Unauthorized');
	}

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new ApiError(res.status, body.message ?? `Request failed: ${res.status}`);
	}

	return res.json();
}

export const api = {
	get: <T>(path: string) => fetchAPI<T>(path),
	post: <T>(path: string, body?: unknown) =>
		fetchAPI<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
	put: <T>(path: string, body?: unknown) =>
		fetchAPI<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
	delete: <T>(path: string) => fetchAPI<T>(path, { method: 'DELETE' }),
};
