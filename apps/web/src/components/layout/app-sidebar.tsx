'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

const navItems = [
	{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ title: 'Posts', href: '/posts', icon: FileText },
	{ title: 'Users', href: '/users', icon: Users },
	{ title: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
	const pathname = usePathname();
	const logout = useAuthStore((s) => s.logout);
	const user = useAuthStore((s) => s.user);
	const router = useRouter();

	function handleLogout() {
		logout();
		router.push('/login');
	}

	return (
		<aside className="flex h-screen w-64 flex-col border-r bg-sidebar">
			<div className="flex h-14 items-center border-b px-4">
				<Link href="/dashboard" className="text-lg font-bold text-sidebar-primary">
					NewCMS
				</Link>
			</div>

			<nav className="flex-1 space-y-1 p-3">
				{navItems.map((item) => {
					const isActive = pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
								isActive
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground hover:bg-sidebar-accent/50',
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.title}
						</Link>
					);
				})}
			</nav>

			<div className="border-t p-3">
				<div className="flex items-center gap-3 px-3 py-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
						{user?.displayName?.charAt(0).toUpperCase() ?? 'A'}
					</div>
					<div className="flex-1 truncate">
						<p className="text-sm font-medium">{user?.displayName ?? 'Admin'}</p>
						<p className="truncate text-xs text-muted-foreground">{user?.email}</p>
					</div>
					<button
						onClick={handleLogout}
						className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						title="Sign out"
					>
						<LogOut className="h-4 w-4" />
					</button>
				</div>
			</div>
		</aside>
	);
}
