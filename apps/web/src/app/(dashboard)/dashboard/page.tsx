'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FileText, Users, Tag, Settings } from 'lucide-react';
import type { PostsResponse, User } from '@/types/api';

export default function DashboardPage() {
	const { data: postsData } = useQuery({
		queryKey: ['posts', 'stats'],
		queryFn: () => api.get<PostsResponse>('/posts?per_page=5'),
	});

	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: () => api.get<User[]>('/users'),
	});

	const stats = [
		{ label: 'Posts', value: postsData?.total ?? '-', icon: FileText },
		{ label: 'Users', value: usersData?.length ?? '-', icon: Users },
	];

	return (
		<div>
			<h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

			<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<div key={stat.label} className="rounded-xl border bg-card p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
							<stat.icon className="h-4 w-4 text-muted-foreground" />
						</div>
						<p className="mt-2 text-3xl font-bold">{stat.value}</p>
					</div>
				))}
			</div>

			<div className="rounded-xl border bg-card shadow-sm">
				<div className="border-b px-6 py-4">
					<h2 className="font-semibold">Recent Posts</h2>
				</div>
				<div className="divide-y">
					{postsData?.posts.map((post) => (
						<div key={post.id} className="flex items-center justify-between px-6 py-3">
							<div>
								<p className="font-medium">{post.postTitle}</p>
								<p className="text-xs text-muted-foreground">
									{new Date(post.postDate).toLocaleDateString()}
								</p>
							</div>
							<span
								className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
									post.postStatus === 'publish'
										? 'bg-green-100 text-green-700'
										: 'bg-yellow-100 text-yellow-700'
								}`}
							>
								{post.postStatus}
							</span>
						</div>
					))}
					{postsData?.posts.length === 0 && (
						<p className="px-6 py-8 text-center text-sm text-muted-foreground">No posts yet</p>
					)}
				</div>
			</div>
		</div>
	);
}
