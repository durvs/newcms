import { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import { Label, UnitSelector } from './shared';

interface DimensionsValue {
	top: number;
	right: number;
	bottom: number;
	left: number;
	unit: string;
	linked: boolean;
}

interface DimensionsControlProps {
	label: string;
	value: DimensionsValue;
	units?: string[];
	min?: number;
	max?: number;
	onChange: (value: DimensionsValue) => void;
}

const sides = ['top', 'right', 'bottom', 'left'] as const;
const sideLabels = { top: 'T', right: 'R', bottom: 'B', left: 'L' };

export function DimensionsControl({
	label, value, units = ['px', '%', 'em', 'rem'], min = 0, max = 200, onChange,
}: DimensionsControlProps) {

	function handleSide(side: typeof sides[number], raw: string) {
		const num = parseFloat(raw);
		if (isNaN(num)) return;
		const clamped = Math.min(max, Math.max(min, num));

		if (value.linked) {
			onChange({ ...value, top: clamped, right: clamped, bottom: clamped, left: clamped });
		} else {
			onChange({ ...value, [side]: clamped });
		}
	}

	function toggleLinked() {
		if (!value.linked) {
			// When linking, set all to the top value
			onChange({ ...value, linked: true, right: value.top, bottom: value.top, left: value.top });
		} else {
			onChange({ ...value, linked: false });
		}
	}

	return (
		<div>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
				<Label>{label}</Label>
				<UnitSelector units={units} value={value.unit} onChange={(u) => onChange({ ...value, unit: u })} />
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
				{sides.map((side) => (
					<div key={side} style={{ flex: 1, position: 'relative' }}>
						<input
							type="number"
							min={min}
							max={max}
							value={value[side]}
							onChange={(e) => handleSide(side, e.target.value)}
							style={{
								width: '100%',
								height: 30,
								borderRadius: 5,
								border: '1px solid var(--cm-border)',
								background: 'var(--cm-input-bg)',
								color: 'var(--cm-text)',
								fontSize: 11,
								fontFamily: 'monospace',
								textAlign: 'center' as const,
								outline: 'none',
								boxSizing: 'border-box' as const,
								paddingTop: 8,
							}}
						/>
						<span style={{
							position: 'absolute',
							top: 2,
							left: '50%',
							transform: 'translateX(-50%)',
							fontSize: 8,
							fontWeight: 700,
							color: 'var(--cm-text-faint)',
							letterSpacing: '0.05em',
							pointerEvents: 'none',
						}}>
							{sideLabels[side]}
						</span>
					</div>
				))}

				{/* Link toggle */}
				<button
					onClick={toggleLinked}
					title={value.linked ? 'Unlink sides' : 'Link all sides'}
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 28,
						height: 30,
						borderRadius: 5,
						border: '1px solid var(--cm-border)',
						background: value.linked ? 'var(--color-accent)' : 'var(--cm-input-bg)',
						color: value.linked ? '#fff' : 'var(--cm-text-faint)',
						cursor: 'pointer',
						flexShrink: 0,
						transition: 'all .12s',
					}}
				>
					{value.linked ? <Link2 size={12} /> : <Unlink size={12} />}
				</button>
			</div>
		</div>
	);
}

export type { DimensionsValue };
