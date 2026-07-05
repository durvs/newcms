import { Label } from './shared';
import {
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	ArrowRight,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	AlignStartHorizontal,
	AlignCenterHorizontal,
	AlignEndHorizontal,
	AlignStartVertical,
	AlignCenterVertical,
	AlignEndVertical,
} from 'lucide-react';

interface SelectControlProps {
	label: string;
	value: string;
	options: { value: string; label: string; icon?: string }[];
	onChange: (value: string) => void;
	mode?: 'dropdown' | 'icons';
}

const iconMap: Record<string, typeof AlignLeft> = {
	'align-left': AlignLeft,
	'align-center': AlignCenter,
	'align-right': AlignRight,
	'align-justify': AlignJustify,
	'arrow-right': ArrowRight,
	'arrow-down': ArrowDown,
	'arrow-left': ArrowLeft,
	'arrow-up': ArrowUp,
	'start-h': AlignStartHorizontal,
	'center-h': AlignCenterHorizontal,
	'end-h': AlignEndHorizontal,
	'start-v': AlignStartVertical,
	'center-v': AlignCenterVertical,
	'end-v': AlignEndVertical,
};

export function SelectControl({
	label,
	value,
	options,
	onChange,
	mode = 'dropdown',
}: SelectControlProps) {
	if (mode === 'icons') {
		return (
			<div>
				<Label>{label}</Label>
				<div
					style={{
						display: 'flex',
						gap: 2,
						background: 'var(--cm-surface-elevated)',
						borderRadius: 6,
						padding: 2,
					}}
				>
					{options.map((opt) => {
						const active = value === opt.value;
						const Icon = opt.icon ? iconMap[opt.icon] : null;
						return (
							<button
								key={opt.value}
								onClick={() => onChange(opt.value)}
								title={opt.label}
								style={{
									flex: 1,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									height: 28,
									borderRadius: 4,
									border: 'none',
									cursor: 'pointer',
									background: active ? 'var(--cm-surface)' : 'transparent',
									color: active ? 'var(--color-accent)' : 'var(--cm-text-faint)',
									boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
									transition: 'all .12s',
								}}
							>
								{Icon ? (
									<Icon size={14} />
								) : (
									<span style={{ fontSize: 10, fontWeight: 600 }}>{opt.label}</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	// Dropdown mode
	return (
		<div>
			<Label>{label}</Label>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					width: '100%',
					height: 32,
					borderRadius: 6,
					border: '1px solid var(--cm-border)',
					background: 'var(--cm-input-bg)',
					color: 'var(--cm-text)',
					fontSize: 12,
					padding: '0 8px',
					outline: 'none',
					boxSizing: 'border-box',
					cursor: 'pointer',
					appearance: 'none',
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'right 8px center',
					paddingRight: 24,
				}}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}
