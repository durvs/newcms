import { useState } from 'react';

// ─── Shared styles ──────────────────────────────────────────────

const S = {
	label: {
		display: 'block',
		fontSize: 11,
		fontWeight: 500 as const,
		color: 'var(--cm-text-muted)',
		marginBottom: 6,
		letterSpacing: '0.02em',
	},
	input: {
		width: '100%',
		height: 32,
		borderRadius: 6,
		border: '1px solid var(--cm-border)',
		background: 'var(--cm-input-bg)',
		color: 'var(--cm-text)',
		fontSize: 12,
		padding: '0 8px',
		outline: 'none',
		boxSizing: 'border-box' as const,
		transition: 'border-color .15s',
	},
	inputFocus: {
		borderColor: 'var(--color-accent)',
	},
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
	},
	section: {
		padding: '12px 14px',
		borderBottom: '1px solid var(--cm-border-subtle, var(--cm-border))',
	},
	sectionLabel: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		cursor: 'pointer',
		userSelect: 'none' as const,
		marginBottom: 10,
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: 700 as const,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		color: 'var(--cm-text-muted)',
	},
	unitPill: (active: boolean) => ({
		padding: '2px 6px',
		borderRadius: 4,
		border: 'none',
		fontSize: 10,
		fontWeight: 600 as const,
		cursor: 'pointer',
		background: active ? 'var(--color-accent)' : 'transparent',
		color: active ? '#fff' : 'var(--cm-text-faint)',
		transition: 'all .12s',
	}),
};

export { S };

// ─── Collapsible Section ────────────────────────────────────────

export function ControlSection({
	title,
	children,
	defaultOpen = true,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div style={S.section}>
			<div style={S.sectionLabel} onClick={() => setOpen(!open)}>
				<span style={S.sectionTitle}>{title}</span>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					style={{
						color: 'var(--cm-text-faint)',
						transform: open ? 'rotate(180deg)' : 'rotate(0)',
						transition: 'transform .15s',
					}}
				>
					<path d="M6 9l6 6 6-6" />
				</svg>
			</div>
			{open && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>}
		</div>
	);
}

// ─── Label ──────────────────────────────────────────────────────

export function Label({ children }: { children: React.ReactNode }) {
	return <div style={S.label}>{children}</div>;
}

// ─── Unit Selector ──────────────────────────────────────────────

export function UnitSelector({
	units,
	value,
	onChange,
}: {
	units: string[];
	value: string;
	onChange: (unit: string) => void;
}) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 1,
				background: 'var(--cm-surface-elevated)',
				borderRadius: 4,
				padding: 1,
			}}
		>
			{units.map((u) => (
				<button key={u} onClick={() => onChange(u)} style={S.unitPill(value === u)}>
					{u || '—'}
				</button>
			))}
		</div>
	);
}
