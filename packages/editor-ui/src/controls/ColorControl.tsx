import { useState, useRef } from 'react';
import { Label } from './shared';

interface ColorControlProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function ColorControl({ label, value, onChange }: ColorControlProps) {
	const [inputVal, setInputVal] = useState(value || '');
	const pickerRef = useRef<HTMLInputElement>(null);

	function handleInput(raw: string) {
		setInputVal(raw);
		// Only update parent if it looks like a valid color
		if (/^#[0-9a-fA-F]{3,8}$/.test(raw) || /^rgba?\(/.test(raw) || /^[a-z]+$/.test(raw)) {
			onChange(raw);
		}
	}

	function handlePicker(hex: string) {
		setInputVal(hex);
		onChange(hex);
	}

	return (
		<div>
			<Label>{label}</Label>
			<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
				{/* Color swatch — clickable to open picker */}
				<div
					onClick={() => pickerRef.current?.click()}
					style={{
						width: 32,
						height: 28,
						borderRadius: 5,
						border: '1px solid var(--cm-border)',
						cursor: 'pointer',
						overflow: 'hidden',
						flexShrink: 0,
						position: 'relative',
						// Checkerboard pattern for transparent colors
						backgroundImage:
							'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
						backgroundSize: '8px 8px',
						backgroundPosition: '0 0, 4px 4px',
					}}
				>
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: value || 'transparent',
							borderRadius: 4,
						}}
					/>
					<input
						ref={pickerRef}
						type="color"
						value={value?.startsWith('#') ? value : '#000000'}
						onChange={(e) => handlePicker(e.target.value)}
						style={{
							position: 'absolute',
							inset: 0,
							opacity: 0,
							cursor: 'pointer',
							width: '100%',
							height: '100%',
						}}
					/>
				</div>

				{/* Hex input */}
				<input
					type="text"
					value={inputVal}
					onChange={(e) => handleInput(e.target.value)}
					onBlur={() => setInputVal(value || '')}
					placeholder="#000000"
					style={{
						flex: 1,
						height: 28,
						borderRadius: 5,
						border: '1px solid var(--cm-border)',
						background: 'var(--cm-input-bg)',
						color: 'var(--cm-text)',
						fontSize: 11,
						fontFamily: 'monospace',
						padding: '0 8px',
						outline: 'none',
						boxSizing: 'border-box',
					}}
				/>

				{/* Clear button */}
				{value && (
					<button
						onClick={() => {
							onChange('');
							setInputVal('');
						}}
						style={{
							width: 28,
							height: 28,
							borderRadius: 5,
							border: '1px solid var(--cm-border)',
							background: 'var(--cm-input-bg)',
							color: 'var(--cm-text-faint)',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 14,
							flexShrink: 0,
						}}
					>
						×
					</button>
				)}
			</div>
		</div>
	);
}
