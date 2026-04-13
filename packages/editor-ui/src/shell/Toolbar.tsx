import { Undo2, Redo2, Monitor, Tablet, Smartphone, Eye, Save, ArrowLeft, Layers } from 'lucide-react';
import { useEditorStore } from '../store/editor-store';

interface ToolbarProps {
	onSave: () => void;
	onBack: () => void;
	saving?: boolean;
	title?: string;
}

const devices = [
	{ name: 'desktop', icon: Monitor, label: 'Desktop', width: 0 },
	{ name: 'tablet', icon: Tablet, label: 'Tablet', width: 768 },
	{ name: 'mobile', icon: Smartphone, label: 'Mobile', width: 375 },
] as const;

export function Toolbar({ onSave, onBack, saving, title }: ToolbarProps) {
	const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint);
	const setBreakpoint = useEditorStore((s) => s.setBreakpoint);
	const panelView = useEditorStore((s) => s.panelView);
	const setPanelView = useEditorStore((s) => s.setPanelView);
	const undo = useEditorStore((s) => s.undo);
	const redo = useEditorStore((s) => s.redo);
	const past = useEditorStore((s) => s.past);
	const future = useEditorStore((s) => s.future);
	const dirty = useEditorStore((s) => s.dirty);

	return (
		<div className="flex h-12 items-center justify-between border-b border-[var(--cm-border)] bg-[var(--cm-surface)] px-3">
			{/* Left section */}
			<div className="flex items-center gap-2">
				<button
					onClick={onBack}
					className="rounded-md p-1.5 text-[var(--cm-text-muted)] transition-colors hover:bg-[var(--cm-surface-elevated)] hover:text-[var(--cm-text)]"
					title="Back to editor"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>

				{title && (
					<span className="hidden text-[13px] font-medium text-[var(--cm-text)] sm:block truncate max-w-48">
						{title}
					</span>
				)}

				<div className="ml-2 h-5 w-px bg-[var(--cm-border)]" />

				<button
					onClick={undo}
					disabled={past.length === 0}
					className="rounded-md p-1.5 text-[var(--cm-text-muted)] transition-colors hover:bg-[var(--cm-surface-elevated)] hover:text-[var(--cm-text)] disabled:opacity-30"
					title="Undo (Ctrl+Z)"
				>
					<Undo2 className="h-4 w-4" />
				</button>
				<button
					onClick={redo}
					disabled={future.length === 0}
					className="rounded-md p-1.5 text-[var(--cm-text-muted)] transition-colors hover:bg-[var(--cm-surface-elevated)] hover:text-[var(--cm-text)] disabled:opacity-30"
					title="Redo (Ctrl+Shift+Z)"
				>
					<Redo2 className="h-4 w-4" />
				</button>
			</div>

			{/* Center — device selector */}
			<div className="flex items-center gap-1 rounded-lg bg-[var(--cm-surface-elevated)] p-0.5">
				{devices.map((d) => (
					<button
						key={d.name}
						onClick={() => setBreakpoint(d.name)}
						className={`rounded-md p-1.5 transition-colors ${
							activeBreakpoint === d.name
								? 'bg-[var(--cm-surface)] text-[var(--cm-text)] shadow-sm'
								: 'text-[var(--cm-text-muted)] hover:text-[var(--cm-text)]'
						}`}
						title={d.label}
					>
						<d.icon className="h-4 w-4" />
					</button>
				))}
			</div>

			{/* Right section */}
			<div className="flex items-center gap-2">
				<button
					onClick={() => setPanelView(panelView === 'navigator' ? 'widgets' : 'navigator')}
					className={`rounded-md p-1.5 transition-colors ${
						panelView === 'navigator'
							? 'bg-[var(--cm-surface-elevated)] text-[var(--cm-text)]'
							: 'text-[var(--cm-text-muted)] hover:text-[var(--cm-text)]'
					}`}
					title="Navigator"
				>
					<Layers className="h-4 w-4" />
				</button>

				<div className="h-5 w-px bg-[var(--cm-border)]" />

				<button
					onClick={onSave}
					disabled={saving || !dirty}
					className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--cm-surface)] transition-all hover:bg-[var(--color-accent-hover)] active:scale-[0.97] disabled:opacity-40"
				>
					<Save className="h-3.5 w-3.5" />
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	);
}
