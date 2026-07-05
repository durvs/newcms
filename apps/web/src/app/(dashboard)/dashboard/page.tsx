'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, Users, Eye, TrendingUp, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { PostsResponse, User } from '@/types/api';

const statusColors: Record<string, string> = {
	publish: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
	draft: 'bg-accent/10 text-accent ring-accent/20',
	pending: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
	trash: 'bg-red-500/10 text-red-400 ring-red-500/20',
	private: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
};

export default function DashboardPage() {
	const { data: postsData, isLoading: postsLoading } = useQuery({
		queryKey: ['posts', 'dashboard'],
		queryFn: () => api.get<PostsResponse>('/posts?per_page=5&status=publish'),
	});

	const { data: draftsData } = useQuery({
		queryKey: ['posts', 'drafts'],
		queryFn: () => api.get<PostsResponse>('/posts?per_page=5&status=draft'),
	});

	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: () => api.get<User[]>('/users'),
	});

	const stats = [
		{
			label: 'Published',
			value: postsData?.total ?? '-',
			icon: FileText,
			color: 'text-emerald-400',
			bg: 'bg-emerald-500/10',
		},
		{
			label: 'Drafts',
			value: draftsData?.total ?? '-',
			icon: Eye,
			color: 'text-accent',
			bg: 'bg-accent/10',
		},
		{
			label: 'Users',
			value: usersData?.length ?? '-',
			icon: Users,
			color: 'text-blue-400',
			bg: 'bg-blue-500/10',
		},
	];

	return (
		<div>
			{/* Header */}
			<div className="mb-8 flex items-end justify-between animate-fade-in-up">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">
						Overview
					</p>
					<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Dashboard</h1>
				</div>
				<Link
					href="/posts/new"
					className="group flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-surface transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(251,191,36,0.12)] active:scale-[0.98]"
				>
					<Plus className="h-4 w-4" />
					New Post
				</Link>
			</div>

			{/* Stats */}
			<div className="mb-8 grid gap-4 sm:grid-cols-3 animate-fade-in-up-delay-1">
				{stats.map((stat) => (
					<div
						key={stat.label}
						className="group rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-text-faint/20"
					>
						<div className="flex items-center justify-between">
							<p className="text-xs font-medium uppercase tracking-wider text-text-muted">
								{stat.label}
							</p>
							<div className={`rounded-lg p-2 ${stat.bg}`}>
								<stat.icon className={`h-4 w-4 ${stat.color}`} />
							</div>
						</div>
						<p className="mt-3 text-3xl font-bold tracking-tight text-text">{stat.value}</p>
					</div>
				))}
			</div>

			{/* Content grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent Posts */}
				<div className="rounded-xl border border-border bg-surface-elevated animate-fade-in-up-delay-2">
					<div className="flex items-center justify-between border-b border-border px-5 py-4">
						<h2 className="text-sm font-semibold text-text">Recent Posts</h2>
						<Link
							href="/posts"
							className="text-xs font-medium text-text-muted transition-colors hover:text-accent"
						>
							View all
						</Link>
					</div>
					<div className="divide-y divide-border">
						{postsLoading && (
							<div className="px-5 py-8 text-center">
								<div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
							</div>
						)}
						{postsData?.posts.map((post) => (
							<Link
								key={post.id}
								href={`/editor/${post.id}`}
								className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface/50"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-[13px] font-medium text-text group-hover:text-accent transition-colors">
										{post.postTitle}
									</p>
									<p className="mt-0.5 text-[11px] text-text-muted font-mono">
										{new Date(post.postDate).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										})}
									</p>
								</div>
								<span
									className={`ml-3 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
										statusColors[post.postStatus] ?? statusColors['draft']
									}`}
								>
									{post.postStatus}
								</span>
							</Link>
						))}
						{!postsLoading && postsData?.posts.length === 0 && (
							<div className="px-5 py-8 text-center">
								<p className="text-sm text-text-muted">No posts yet</p>
								<Link
									href="/posts/new"
									className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
								>
									Create your first post
									<ExternalLink className="h-3 w-3" />
								</Link>
							</div>
						)}
					</div>
				</div>

				{/* Quick Actions */}
				<div className="space-y-6 animate-fade-in-up-delay-3">
					{/* Drafts */}
					<div className="rounded-xl border border-border bg-surface-elevated">
						<div className="flex items-center justify-between border-b border-border px-5 py-4">
							<h2 className="text-sm font-semibold text-text">Drafts</h2>
							<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
								{draftsData?.total ?? 0}
							</span>
						</div>
						<div className="divide-y divide-border">
							{draftsData?.posts.slice(0, 3).map((post) => (
								<Link
									key={post.id}
									href={`/editor/${post.id}`}
									className="group flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface/50"
								>
									<p className="truncate text-[13px] text-text-muted group-hover:text-text transition-colors">
										{post.postTitle}
									</p>
									<ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted/30 group-hover:text-accent transition-colors" />
								</Link>
							))}
							{(!draftsData || draftsData.posts.length === 0) && (
								<p className="px-5 py-6 text-center text-xs text-text-muted">No drafts</p>
							)}
						</div>
					</div>

					{/* System info */}
					<div className="rounded-xl border border-border bg-surface-elevated p-5">
						<h2 className="mb-4 text-sm font-semibold text-text">System</h2>
						<div className="space-y-3">
							{[
								['CMS Version', 'v0.2.0'],
								['Node.js', typeof process !== 'undefined' ? 'v22' : 'v22'],
								['Database', 'PostgreSQL 17'],
								['Cache', 'Redis 7'],
							].map(([label, value]) => (
								<div key={label} className="flex items-center justify-between">
									<span className="text-xs text-text-muted">{label}</span>
									<span className="rounded bg-surface px-2 py-0.5 text-[11px] font-mono text-text-muted">
										{value}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
