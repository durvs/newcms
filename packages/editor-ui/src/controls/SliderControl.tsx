import { useState, useRef, useCallback } from 'react';
import { Label, UnitSelector } from './shared';

interface SliderControlProps {
	label: string;
	value: number;
	unit: string;
	units?: string[];
	min?: number;
	max?: number;
	step?: number;
	onChange: (value: number, unit: string) => void;
}

export function SliderControl({
	label, value, unit, units = ['px', '%', 'em', 'rem'],
	min = 0, max = 100, step = 1, onChange,
}: SliderControlProps) {
	const [inputValue, setInputValue] = useState(String(value));

	const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const v = parseFloat(e.target.value);
		setInputValue(String(v));
		onChange(v, unit);
	}, [unit, onChange]);

	const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		const v = parseFloat(e.target.value);
		if (!isNaN(v)) onChange(v, unit);
	}, [unit, onChange]);

	// Track fill percentage for custom slider styling
	const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

	return (
		<div>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
				<Label>{label}</Label>
				{units.length > 1 && <UnitSelector units={units} value={unit} onChange={(u) => onChange(value, u)} />}
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div style={{ flex: 1, position: 'relative', height: 32, display: 'flex', alignItems: 'center' }}>
					{/* Track */}
					<div style={{
						position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2,
						background: 'var(--cm-surface-elevated)',
					}} />
					{/* Fill */}
					<div style={{
						position: 'absolute', left: 0, height: 4, borderRadius: 2,
						width: `${pct}%`,
						background: 'var(--color-accent)',
						transition: 'width .05s',
					}} />
					{/* Input range (invisible, covers the track for interaction) */}
					<input
						type="range"
						min={min}
						max={max}
						step={step}
						value={value}
						onChange={handleSlider}
						style={{
							position: 'absolute',
							width: '100%',
							height: 20,
							opacity: 0,
							cursor: 'pointer',
							margin: 0,
						}}
					/>
					{/* Thumb */}
					<div style={{
						position: 'absolute',
						left: `calc(${pct}% - 7px)`,
						width: 14,
						height: 14,
						borderRadius: 7,
						background: 'var(--color-accent)',
						boxShadow: '0 1px 3px rgba(0,0,0,.2)',
						pointerEvents: 'none',
						transition: 'left .05s',
					}} />
				</div>
				{/* Number input */}
				<input
					type="text"
					value={inputValue}
					onChange={handleInput}
					onBlur={() => setInputValue(String(value))}
					style={{
						width: 48,
						height: 28,
						borderRadius: 5,
						border: '1px solid var(--cm-border)',
						background: 'var(--cm-input-bg)',
						color: 'var(--cm-text)',
						fontSize: 11,
						fontFamily: 'monospace',
						textAlign: 'center' as const,
						outline: 'none',
						boxSizing: 'border-box' as const,
					}}
				/>
			</div>
		</div>
	);
}
