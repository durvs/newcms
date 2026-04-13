'use client';

import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { BLOCK_DEFINITIONS, type BlockDefinition } from './types';

interface BlockInserterProps {
	onInsert: (type: string) => void;
}

export function BlockInserter({ onInsert }: BlockInserterProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const filtered = search
		? BLOCK_DEFINITIONS.filter((b) =>
				b.label.toLowerCase().includes(search.toLowerCase()),
			)
		: BLOCK_DEFINITIONS;

	const categories = ['text', 'media', 'design'] as const;

	function handleInsert(type: string) {
		onInsert(type);
		setOpen(false);
		setSearch('');
	}

	if (!open) {
		return (
			<button
				onClick={() => setOpen(true)}
				className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-text-faint transition-all hover:border-accent/40 hover:text-accent"
			>
				<Plus className="h-4 w-4" />
				Add Block
			</button>
		);
	}

	return (
		<div className="rounded-xl border border-border bg-surface-elevated shadow-lg">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<p className="text-sm font-semibold text-text">Add Block</p>
				<button
					onClick={() => { setOpen(false); setSearch(''); }}
					className="rounded-md p-1 text-text-faint hover:bg-surface hover:text-text"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Search */}
			<div className="border-b border-border px-4 py-2">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
					<input
						type="text"
						placeholder="Search blocks..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						autoFocus
						className="h-8 w-full rounded-md bg-surface pl-8 pr-3 text-xs text-text placeholder:text-text-faint outline-none"
					/>
				</div>
			</div>

			{/* Block grid */}
			<div className="max-h-64 overflow-y-auto p-3">
				{categories.map((cat) => {
					const items = filtered.filter((b) => b.category === cat);
					if (items.length === 0) return null;
					return (
						<div key={cat} className="mb-3 last:mb-0">
							<p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-faint">
								{cat}
							</p>
							<div className="grid grid-cols-3 gap-1.5">
								{items.map((block) => (
									<button
										key={block.type}
										onClick={() => handleInsert(block.type)}
										className="flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-text-muted transition-colors hover:bg-accent/10 hover:text-accent"
									>
										<span className="text-lg leading-none">{block.icon}</span>
										<span className="text-[10px] font-medium">{block.label}</span>
									</button>
								))}
							</div>
						</div>
					);
				})}
				{filtered.length === 0 && (
					<p className="py-4 text-center text-xs text-text-faint">No blocks found</p>
				)}
			</div>
		</div>
	);
}
