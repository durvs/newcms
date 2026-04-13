'use client';

import { useUsers } from '@/hooks/use-users';
import { Users as UsersIcon, Mail, Calendar } from 'lucide-react';

export default function UsersPage() {
	const { data: users, isLoading } = useUsers();

	return (
		<div>
			<div className="mb-6 animate-fade-in-up">
				<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">People</p>
				<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Users</h1>
			</div>

			<div className="rounded-xl border border-border bg-surface-elevated animate-fade-in-up-delay-1">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-border">
								<th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">User</th>
								<th className="hidden px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted sm:table-cell">Email</th>
								<th className="hidden px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted md:table-cell">Registered</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{isLoading && (
								<tr>
									<td colSpan={3} className="px-5 py-12 text-center">
										<div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
									</td>
								</tr>
							)}
							{users?.map((user) => (
								<tr key={user.id} className="group transition-colors hover:bg-surface-overlay/50">
									<td className="px-5 py-3">
										<div className="flex items-center gap-3">
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
												{user.displayName.charAt(0).toUpperCase()}
											</div>
											<div>
												<p className="text-[13px] font-medium text-text">{user.displayName}</p>
												<p className="text-[11px] text-text-faint font-mono">@{user.login}</p>
											</div>
										</div>
									</td>
									<td className="hidden px-5 py-3 sm:table-cell">
										<span className="text-xs text-text-muted">{user.email}</span>
									</td>
									<td className="hidden px-5 py-3 md:table-cell">
										<span className="text-xs text-text-muted font-mono">
											{new Date(user.registered).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</span>
									</td>
								</tr>
							))}
							{!isLoading && users?.length === 0 && (
								<tr>
									<td colSpan={3} className="px-5 py-12 text-center text-sm text-text-muted">No users found</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
