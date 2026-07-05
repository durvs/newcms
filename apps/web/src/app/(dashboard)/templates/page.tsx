'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Upload, Plus, FileText, Layout, Columns, PanelTop, PanelBottom } from 'lucide-react';

const typeIcons: Record<string, typeof FileText> = {
	builder_header: PanelTop,
	builder_footer: PanelBottom,
	builder_single_post: FileText,
	builder_single_page: FileText,
	builder_archive: Columns,
	builder_section: Layout,
};

const typeLabels: Record<string, string> = {
	builder_header: 'Header',
	builder_footer: 'Footer',
	builder_single_post: 'Single Post',
	builder_single_page: 'Single Page',
	builder_archive: 'Archive',
	builder_error_404: '404 Page',
	builder_search_results: 'Search',
	builder_section: 'Section',
	builder_page: 'Page',
};

export default function TemplatesPage() {
	const { data: templates, isLoading } = useQuery({
		queryKey: ['templates'],
		queryFn: () => api.get<Record<string, unknown>[]>('/templates'),
	});

	return (
		<div>
			<div className="mb-6 flex items-end justify-between animate-fade-in-up">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">
						Theme Builder
					</p>
					<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Templates</h1>
				</div>
				<Link
					href="/templates/import"
					className="group flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-surface transition-all hover:bg-accent-hover active:scale-[0.98]"
				>
					<Upload className="h-4 w-4" />
					Import Kit
				</Link>
			</div>

			{isLoading && (
				<div className="py-12 text-center">
					<div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
				</div>
			)}

			{!isLoading && (!templates || templates.length === 0) && (
				<div className="rounded-xl border border-border bg-surface-elevated py-16 text-center animate-fade-in-up-delay-1">
					<Layout className="mx-auto h-10 w-10 text-text-faint mb-4" />
					<p className="text-lg font-semibold text-text">No templates yet</p>
					<p className="mt-2 text-sm text-text-muted mb-6">
						Import a template kit to get started with pre-built layouts
					</p>
					<Link
						href="/templates/import"
						className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-surface hover:bg-accent-hover"
					>
						<Upload className="h-4 w-4" />
						Import Template Kit
					</Link>
				</div>
			)}

			{templates && templates.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up-delay-1">
					{templates.map((tmpl: Record<string, unknown>) => {
						const postType = String(tmpl.postType ?? tmpl.post_type ?? '');
						const Icon = typeIcons[postType] ?? FileText;
						const label = typeLabels[postType] ?? postType.replace('builder_', '');

						return (
							<Link
								key={String(tmpl.id)}
								href={`/editor/${tmpl.id}`}
								className="group rounded-xl border border-border bg-surface-elevated p-5 transition-all hover:border-accent/30 hover:shadow-sm"
							>
								<div className="flex items-center gap-3 mb-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
										<Icon className="h-5 w-5 text-accent" />
									</div>
									<div>
										<p className="text-[13px] font-semibold text-text group-hover:text-accent transition-colors">
											{String(tmpl.postTitle ?? tmpl.post_title ?? 'Untitled')}
										</p>
										<p className="text-[11px] text-text-faint uppercase tracking-wider">{label}</p>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
