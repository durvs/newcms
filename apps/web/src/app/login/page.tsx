'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import type { LoginResponse } from '@/types/api';

export default function LoginPage() {
	const router = useRouter();
	const login = useAuthStore((s) => s.login);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [focused, setFocused] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError('');
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const loginValue = formData.get('login') as string;
		const password = formData.get('password') as string;

		try {
			const data = await api.post<LoginResponse>('/auth/login', {
				login: loginValue,
				password,
			});
			login(data.token, data.user, data.expiresAt);
			router.push('/dashboard');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="relative z-10 grid w-full grid-cols-1 lg:grid-cols-2 min-h-screen">
			{/* Left panel — brand */}
			<div className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
				<div className="animate-fade-in-up">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface">
								<path d="M12 2L2 7l10 5 10-5-10-5z" />
								<path d="M2 17l10 5 10-5" />
								<path d="M2 12l10 5 10-5" />
							</svg>
						</div>
						<span className="text-lg font-semibold tracking-tight text-text">
							NewCMS
						</span>
					</div>
				</div>

				<div className="max-w-md animate-fade-in-up-delay-1">
					<h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight text-text">
						Content,
						<br />
						<span className="text-accent">reimagined.</span>
					</h2>
					<p className="mt-5 text-base leading-relaxed text-text-muted">
						A modern content management system built from the ground up with
						TypeScript, designed for speed, extensibility, and developer experience.
					</p>
				</div>

				<div className="animate-fade-in-up-delay-2">
					<div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-text-muted">
						<span>v0.2.0</span>
						<span className="h-px w-8 bg-border" />
						<span>TypeScript</span>
						<span className="h-px w-8 bg-border" />
						<span>Open Source</span>
					</div>
				</div>
			</div>

			{/* Right panel — login form */}
			<div className="flex items-center justify-center p-6 sm:p-12">
				<div className="w-full max-w-[380px]">
					{/* Mobile logo */}
					<div className="mb-10 flex items-center gap-3 lg:hidden animate-fade-in-up">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface">
								<path d="M12 2L2 7l10 5 10-5-10-5z" />
								<path d="M2 17l10 5 10-5" />
								<path d="M2 12l10 5 10-5" />
							</svg>
						</div>
						<span className="text-lg font-semibold tracking-tight text-text">
							NewCMS
						</span>
					</div>

					<div className="animate-fade-in-up-delay-2">
						<h1 className="text-2xl font-bold tracking-tight text-text">
							Welcome back
						</h1>
						<p className="mt-2 text-sm text-text-muted">
							Enter your credentials to access the dashboard
						</p>
					</div>

					<form onSubmit={handleSubmit} className="mt-8 space-y-5">
						{error && (
							<div className="animate-fade-in-up flex items-center gap-2 rounded-lg bg-error-soft/10 px-4 py-3 text-sm text-error-soft ring-1 ring-error-soft/20">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
									<circle cx="12" cy="12" r="10" />
									<line x1="15" y1="9" x2="9" y2="15" />
									<line x1="9" y1="9" x2="15" y2="15" />
								</svg>
								{error}
							</div>
						)}

						<div className="space-y-1.5 animate-fade-in-up-delay-3">
							<label htmlFor="login" className="block text-xs font-medium uppercase tracking-wider text-text-muted">
								Username or email
							</label>
							<input
								id="login"
								name="login"
								type="text"
								required
								autoComplete="username"
								onFocus={() => setFocused('login')}
								onBlur={() => setFocused(null)}
								className={`
									block w-full rounded-lg border bg-input-bg px-4 py-3 text-sm text-text
									placeholder:text-text-muted/50
									outline-none transition-all duration-200
									${focused === 'login'
										? 'border-accent/60 ring-1 ring-accent/20'
										: 'border-border hover:border-text-faint/30'
									}
								`}
								placeholder="admin"
							/>
						</div>

						<div className="space-y-1.5 animate-fade-in-up-delay-3">
							<label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-text-muted">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								autoComplete="current-password"
								onFocus={() => setFocused('password')}
								onBlur={() => setFocused(null)}
								className={`
									block w-full rounded-lg border bg-input-bg px-4 py-3 text-sm text-text
									placeholder:text-text-muted/50
									outline-none transition-all duration-200
									${focused === 'password'
										? 'border-accent/60 ring-1 ring-accent/20'
										: 'border-border hover:border-text-faint/30'
									}
								`}
								placeholder="Enter your password"
							/>
						</div>

						<div className="animate-fade-in-up-delay-4 pt-1">
							<button
								type="submit"
								disabled={loading}
								className={`
									group relative flex h-12 w-full items-center justify-center rounded-lg
									bg-accent px-6 text-sm font-semibold text-surface
									transition-all duration-200
									hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(251,191,36,0.15)]
									active:scale-[0.98]
									disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
								`}
							>
								{loading ? (
									<div className="flex items-center gap-2">
										<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										Signing in...
									</div>
								) : (
									<>
										Sign in
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">
											<path d="M5 12h14" />
											<path d="m12 5 7 7-7 7" />
										</svg>
									</>
								)}
							</button>
						</div>
					</form>

					<div className="mt-8 flex items-center justify-center gap-4 text-xs text-text-muted/50 animate-fade-in-up-delay-4">
						<span className="font-mono">GPL-2.0</span>
						<span>&#183;</span>
						<span>NewCMS Project</span>
					</div>
				</div>
			</div>
		</div>
	);
}
