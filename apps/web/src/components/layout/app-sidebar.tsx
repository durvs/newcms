'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
	LayoutDashboard,
	FileText,
	Users,
	Settings,
	LogOut,
	PanelLeftClose,
	PanelLeft,
	Sun,
	Moon,
	MessageSquare,
	Menu,
	Layout,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useState, useEffect } from 'react';

const navItems = [
	{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ title: 'Posts', href: '/posts', icon: FileText },
	{ title: 'Templates', href: '/templates', icon: Layout },
	{ title: 'Comments', href: '/comments', icon: MessageSquare },
	{ title: 'Menus', href: '/menus', icon: Menu },
	{ title: 'Users', href: '/users', icon: Users },
	{ title: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
	const pathname = usePathname();
	const logout = useAuthStore((s) => s.logout);
	const user = useAuthStore((s) => s.user);
	const router = useRouter();
	const [collapsed, setCollapsed] = useState(false);
	const theme = useThemeStore((s) => s.theme);
	const toggleTheme = useThemeStore((s) => s.toggle);
	const hydrateTheme = useThemeStore((s) => s.hydrate);

	useEffect(() => {
		hydrateTheme();
	}, [hydrateTheme]);

	function handleLogout() {
		logout();
		router.push('/login');
	}

	return (
		<aside
			className={cn(
				'flex h-screen flex-col border-r border-border bg-surface transition-all duration-300',
				collapsed ? 'w-[68px]' : 'w-60',
			)}
		>
			{/* Logo */}
			<div className={cn('flex h-14 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')}>
				<Link href="/dashboard" className="flex items-center gap-2.5">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface">
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5" />
							<path d="M2 12l10 5 10-5" />
						</svg>
					</div>
					{!collapsed && (
						<span className="text-sm font-semibold tracking-tight text-text">
							NewCMS
						</span>
					)}
				</Link>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-0.5 p-2 pt-3">
				{navItems.map((item) => {
					const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							title={collapsed ? item.title : undefined}
							className={cn(
								'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
								collapsed && 'justify-center px-0',
								isActive
									? 'bg-accent/10 text-accent'
									: 'text-text-muted hover:bg-surface-elevated hover:text-text',
							)}
						>
							<item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-accent')} />
							{!collapsed && item.title}
							{isActive && !collapsed && (
								<div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
							)}
						</Link>
					);
				})}
			</nav>

			{/* Bottom controls */}
			<div className="space-y-1 px-2 pb-1">
				{/* Theme toggle */}
				<button
					onClick={toggleTheme}
					title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
					className={cn(
						'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface-elevated hover:text-text',
						collapsed && 'justify-center px-0',
					)}
				>
					{theme === 'dark' ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
					{!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
				</button>

				{/* Collapse toggle */}
				<button
					onClick={() => setCollapsed(!collapsed)}
					className={cn(
						'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-faint transition-colors hover:bg-surface-elevated hover:text-text-muted',
						collapsed && 'justify-center px-0',
					)}
				>
					{collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
					{!collapsed && 'Collapse'}
				</button>
			</div>

			{/* User */}
			<div className="border-t border-border p-2">
				<div className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2', collapsed && 'justify-center px-0')}>
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-xs font-semibold text-accent ring-1 ring-border">
						{user?.displayName?.charAt(0).toUpperCase() ?? 'A'}
					</div>
					{!collapsed && (
						<div className="flex-1 min-w-0">
							<p className="truncate text-[13px] font-medium text-text">
								{user?.displayName ?? 'Admin'}
							</p>
							<p className="truncate text-[11px] text-text-muted">
								{user?.email}
							</p>
						</div>
					)}
					{!collapsed && (
						<button
							onClick={handleLogout}
							className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-elevated hover:text-error-soft"
							title="Sign out"
						>
							<LogOut className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			</div>
		</aside>
	);
}
