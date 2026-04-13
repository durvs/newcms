import { Undo2, Redo2, Monitor, Tablet, Smartphone, Save, ArrowLeft, Layers, Eye } from 'lucide-react';
import { useEditorStore } from '../store/editor-store';

interface ToolbarProps {
	onSave: () => void;
	onBack: () => void;
	onPreview?: () => void;
	saving?: boolean;
	title?: string;
}

const devices = [
	{ name: 'desktop', icon: Monitor, width: 0 },
	{ name: 'tablet', icon: Tablet, width: 768 },
	{ name: 'mobile', icon: Smartphone, width: 375 },
] as const;

export function Toolbar({ onSave, onBack, onPreview, saving, title }: ToolbarProps) {
	const bp = useEditorStore((s) => s.activeBreakpoint);
	const setBp = useEditorStore((s) => s.setBreakpoint);
	const view = useEditorStore((s) => s.panelView);
	const setView = useEditorStore((s) => s.setPanelView);
	const undo = useEditorStore((s) => s.undo);
	const redo = useEditorStore((s) => s.redo);
	const past = useEditorStore((s) => s.past);
	const future = useEditorStore((s) => s.future);
	const dirty = useEditorStore((s) => s.dirty);

	return (
		<header
			style={{
				height: 48,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0 12px',
				borderBottom: '1px solid var(--cm-border)',
				background: 'var(--cm-surface)',
				flexShrink: 0,
				gap: 8,
			}}
		>
			{/* Left */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
				<ToolBtn onClick={onBack} title="Back"><ArrowLeft size={16} /></ToolBtn>
				{title && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cm-text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 4 }}>{title}</span>}
				<Divider />
				<ToolBtn onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)"><Undo2 size={15} /></ToolBtn>
				<ToolBtn onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Shift+Z)"><Redo2 size={15} /></ToolBtn>
			</div>

			{/* Center — device */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--cm-surface-elevated)', borderRadius: 8, padding: 2 }}>
				{devices.map((d) => (
					<button
						key={d.name}
						onClick={() => setBp(d.name)}
						title={d.name}
						style={{
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							width: 32, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
							background: bp === d.name ? 'var(--cm-surface)' : 'transparent',
							color: bp === d.name ? 'var(--cm-text)' : 'var(--cm-text-muted)',
							boxShadow: bp === d.name ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
							transition: 'all .15s',
						}}
					>
						<d.icon size={15} />
					</button>
				))}
			</div>

			{/* Right */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
				<ToolBtn
					onClick={() => setView(view === 'navigator' ? 'widgets' : 'navigator')}
					active={view === 'navigator'}
					title="Navigator"
				>
					<Layers size={15} />
				</ToolBtn>
				{onPreview && <ToolBtn onClick={onPreview} title="Preview"><Eye size={15} /></ToolBtn>}
				<Divider />
				<button
					onClick={onSave}
					disabled={saving || !dirty}
					style={{
						display: 'flex', alignItems: 'center', gap: 6,
						height: 30, padding: '0 14px', borderRadius: 6, border: 'none',
						background: dirty ? 'var(--color-accent)' : 'var(--cm-surface-elevated)',
						color: dirty ? 'var(--cm-surface)' : 'var(--cm-text-faint)',
						fontSize: 12, fontWeight: 600, cursor: dirty ? 'pointer' : 'default',
						opacity: saving ? 0.5 : 1,
						transition: 'all .15s',
					}}
				>
					<Save size={13} />
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</header>
	);
}

function ToolBtn({ children, onClick, disabled, active, title }: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	active?: boolean;
	title?: string;
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={title}
			style={{
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				width: 30, height: 30, borderRadius: 6, border: 'none', cursor: disabled ? 'default' : 'pointer',
				background: active ? 'var(--cm-surface-elevated)' : 'transparent',
				color: disabled ? 'var(--cm-text-faint)' : active ? 'var(--cm-text)' : 'var(--cm-text-muted)',
				opacity: disabled ? 0.4 : 1,
				transition: 'all .12s',
			}}
		>
			{children}
		</button>
	);
}

function Divider() {
	return <div style={{ width: 1, height: 20, background: 'var(--cm-border)', margin: '0 4px' }} />;
}
