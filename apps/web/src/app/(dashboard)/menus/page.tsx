'use client';

import { useState } from 'react';
import { Plus, GripVertical, Trash2, ExternalLink, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItemLocal {
	id: string;
	title: string;
	url: string;
	type: 'custom' | 'page' | 'category';
	children: MenuItemLocal[];
}

const defaultLocations = [
	{ name: 'primary', label: 'Primary Navigation' },
	{ name: 'footer', label: 'Footer Menu' },
	{ name: 'mobile', label: 'Mobile Menu' },
];

export default function MenusPage() {
	const [activeLocation, setActiveLocation] = useState('primary');
	const [items, setItems] = useState<MenuItemLocal[]>([
		{ id: '1', title: 'Home', url: '/', type: 'custom', children: [] },
		{ id: '2', title: 'About', url: '/about', type: 'page', children: [
			{ id: '3', title: 'Our Team', url: '/about/team', type: 'page', children: [] },
		]},
		{ id: '4', title: 'Blog', url: '/blog', type: 'custom', children: [] },
		{ id: '5', title: 'Contact', url: '/contact', type: 'page', children: [] },
	]);
	const [newTitle, setNewTitle] = useState('');
	const [newUrl, setNewUrl] = useState('');

	function addItem() {
		if (!newTitle.trim() || !newUrl.trim()) return;
		setItems([...items, {
			id: String(Date.now()),
			title: newTitle,
			url: newUrl,
			type: 'custom',
			children: [],
		}]);
		setNewTitle('');
		setNewUrl('');
		toast.success('Menu item added');
	}

	function removeItem(id: string) {
		setItems(items.filter((item) => {
			item.children = item.children.filter((c) => c.id !== id);
			return item.id !== id;
		}));
		toast.success('Menu item removed');
	}

	function renderItem(item: MenuItemLocal, depth: number = 0) {
		return (
			<div key={item.id}>
				<div
					className="group flex items-center gap-3 rounded-lg border border-border bg-surface-elevated px-4 py-3 transition-colors hover:border-text-faint/20"
					style={{ marginLeft: depth * 24 }}
				>
					<GripVertical className="h-4 w-4 shrink-0 cursor-grab text-text-faint" />
					<div className="flex-1 min-w-0">
						<p className="text-[13px] font-medium text-text">{item.title}</p>
						<p className="text-[11px] text-text-faint font-mono">{item.url}</p>
					</div>
					<span className="rounded bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-faint">
						{item.type}
					</span>
					<button
						onClick={() => removeItem(item.id)}
						className="rounded-md p-1 text-text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-error-soft/10 hover:text-error-soft"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
				{item.children.map((child) => renderItem(child, depth + 1))}
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6 animate-fade-in-up">
				<p className="text-xs font-medium uppercase tracking-widest text-text-muted font-mono">Navigation</p>
				<h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Menus</h1>
			</div>

			<div className="grid gap-6 lg:grid-cols-[240px_1fr] animate-fade-in-up-delay-1">
				{/* Locations sidebar */}
				<div className="space-y-1">
					<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-faint">Locations</p>
					{defaultLocations.map((loc) => (
						<button
							key={loc.name}
							onClick={() => setActiveLocation(loc.name)}
							className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
								activeLocation === loc.name
									? 'bg-accent/10 text-accent'
									: 'text-text-muted hover:bg-surface-elevated hover:text-text'
							}`}
						>
							{loc.label}
							{activeLocation === loc.name && <ChevronRight className="h-3.5 w-3.5" />}
						</button>
					))}
				</div>

				{/* Menu items */}
				<div>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-sm font-semibold text-text">
							{defaultLocations.find((l) => l.name === activeLocation)?.label}
						</h2>
						<span className="text-xs text-text-faint">{items.length} items</span>
					</div>

					{/* Item list */}
					<div className="space-y-2 mb-6">
						{items.map((item) => renderItem(item))}
						{items.length === 0 && (
							<div className="rounded-xl border border-border bg-surface-elevated py-8 text-center">
								<p className="text-sm text-text-muted">No menu items yet</p>
							</div>
						)}
					</div>

					{/* Add item form */}
					<div className="rounded-xl border border-border bg-surface-elevated p-4">
						<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Add Custom Link</p>
						<div className="flex gap-2">
							<input
								type="text"
								placeholder="Label"
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								className="h-9 flex-1 rounded-lg border border-border bg-input-bg px-3 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent/50"
							/>
							<input
								type="text"
								placeholder="/url"
								value={newUrl}
								onChange={(e) => setNewUrl(e.target.value)}
								className="h-9 flex-1 rounded-lg border border-border bg-input-bg px-3 text-sm text-text font-mono placeholder:text-text-faint outline-none transition-colors focus:border-accent/50"
							/>
							<button
								onClick={addItem}
								disabled={!newTitle.trim() || !newUrl.trim()}
								className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[13px] font-semibold text-surface transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
							>
								<Plus className="h-3.5 w-3.5" />
								Add
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
