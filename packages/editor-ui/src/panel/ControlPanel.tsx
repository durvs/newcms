import { useEditorStore, type ControlTab } from '../store/editor-store';
import { ControlSection, Label, S } from '../controls/shared';
import { SliderControl } from '../controls/SliderControl';
import { DimensionsControl, type DimensionsValue } from '../controls/DimensionsControl';
import { ColorControl } from '../controls/ColorControl';
import { SelectControl } from '../controls/SelectControl';

const tabs: { id: ControlTab; label: string }[] = [
	{ id: 'content', label: 'Content' },
	{ id: 'style', label: 'Style' },
	{ id: 'advanced', label: 'Advanced' },
];

export function ControlPanel() {
	const selectedId = useEditorStore((s) => s.selectedId);
	const selected = useEditorStore((s) => s.getSelectedElement());
	const controlTab = useEditorStore((s) => s.controlTab);
	const setControlTab = useEditorStore((s) => s.setControlTab);
	const update = useEditorStore((s) => s.updateSetting);
	const updateBatch = useEditorStore((s) => s.updateSettingsBatch);

	if (!selected || !selectedId) {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
				<div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--cm-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cm-text-faint)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></svg>
				</div>
				<p style={{ fontSize: 13, fontWeight: 500, color: 'var(--cm-text-muted)' }}>No element selected</p>
				<p style={{ fontSize: 11, color: 'var(--cm-text-faint)', marginTop: 4 }}>Click an element in the canvas</p>
			</div>
		);
	}

	const s = selected.settings;
	const id = selectedId;

	// Helpers
	function dim(key: string): DimensionsValue {
		return (s[key] as DimensionsValue) ?? { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', linked: true };
	}

	function slider(key: string, fallbackSize = 0, fallbackUnit = 'px'): { size: number; unit: string } {
		const v = s[key];
		if (v && typeof v === 'object' && 'size' in (v as Record<string, unknown>)) return v as { size: number; unit: string };
		if (typeof v === 'number') return { size: v, unit: fallbackUnit };
		return { size: fallbackSize, unit: fallbackUnit };
	}

	return (
		<div>
			{/* Element badge */}
			<div style={{
				padding: '8px 14px',
				borderBottom: '1px solid var(--cm-border)',
				display: 'flex',
				alignItems: 'center',
				gap: 8,
			}}>
				<div style={{
					width: 6, height: 6, borderRadius: 3,
					background: 'var(--color-accent)',
				}} />
				<span style={{
					fontSize: 12, fontWeight: 600, color: 'var(--cm-text)',
					textTransform: 'capitalize',
				}}>
					{selected.widgetType ?? selected.elType}
				</span>
				<span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--cm-text-faint)', marginLeft: 'auto' }}>
					{selected.id.slice(0, 6)}
				</span>
			</div>

			{/* Tabs */}
			<div style={{
				display: 'flex',
				borderBottom: '1px solid var(--cm-border)',
				padding: '0 4px',
			}}>
				{tabs.map((tab) => {
					const active = controlTab === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => setControlTab(tab.id)}
							style={{
								flex: 1, padding: '8px 0', border: 'none',
								borderBottom: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
								background: 'transparent',
								color: active ? 'var(--cm-text)' : 'var(--cm-text-faint)',
								fontSize: 11, fontWeight: 600, cursor: 'pointer',
								transition: 'all .12s', marginBottom: -1,
							}}
						>
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* ─── CONTENT TAB ─── */}
			{controlTab === 'content' && (
				<div>
					{selected.widgetType === 'heading' && (
						<ControlSection title="Heading">
							<div>
								<Label>Text</Label>
								<input
									type="text"
									value={String(s.content ?? '')}
									onChange={(e) => update(id, 'content', e.target.value)}
									placeholder="Heading text"
									style={S.input}
								/>
							</div>
							<SelectControl
								label="HTML Tag"
								value={String(s.level ?? 2)}
								options={[1,2,3,4,5,6].map((l) => ({ value: String(l), label: `H${l}` }))}
								onChange={(v) => update(id, 'level', Number(v))}
								mode="icons"
							/>
							<SelectControl
								label="Alignment"
								value={String(s.textAlign ?? 'left')}
								options={[
									{ value: 'left', label: 'Left', icon: 'align-left' },
									{ value: 'center', label: 'Center', icon: 'align-center' },
									{ value: 'right', label: 'Right', icon: 'align-right' },
								]}
								onChange={(v) => update(id, 'textAlign', v)}
								mode="icons"
							/>
						</ControlSection>
					)}

					{selected.widgetType === 'paragraph' && (
						<ControlSection title="Text">
							<div>
								<Label>Content</Label>
								<textarea
									value={String(s.content ?? '')}
									onChange={(e) => update(id, 'content', e.target.value)}
									placeholder="Type your text..."
									rows={5}
									style={{ ...S.input, height: 'auto', padding: '8px', resize: 'vertical' as const, lineHeight: 1.6 }}
								/>
							</div>
							<SelectControl
								label="Alignment"
								value={String(s.textAlign ?? 'left')}
								options={[
									{ value: 'left', label: 'Left', icon: 'align-left' },
									{ value: 'center', label: 'Center', icon: 'align-center' },
									{ value: 'right', label: 'Right', icon: 'align-right' },
									{ value: 'justify', label: 'Justify', icon: 'align-justify' },
								]}
								onChange={(v) => update(id, 'textAlign', v)}
								mode="icons"
							/>
						</ControlSection>
					)}

					{selected.widgetType === 'image' && (
						<ControlSection title="Image">
							<div>
								<Label>URL</Label>
								<input type="text" value={String(s.url ?? '')} onChange={(e) => update(id, 'url', e.target.value)} placeholder="https://..." style={{ ...S.input, fontFamily: 'monospace', fontSize: 11 }} />
							</div>
							<div>
								<Label>Alt Text</Label>
								<input type="text" value={String(s.alt ?? '')} onChange={(e) => update(id, 'alt', e.target.value)} placeholder="Description" style={S.input} />
							</div>
						</ControlSection>
					)}

					{selected.widgetType === 'button' && (
						<ControlSection title="Button">
							<div>
								<Label>Text</Label>
								<input type="text" value={String(s.text ?? '')} onChange={(e) => update(id, 'text', e.target.value)} placeholder="Click Here" style={S.input} />
							</div>
							<div>
								<Label>Link</Label>
								<input type="text" value={String(s.url ?? '')} onChange={(e) => update(id, 'url', e.target.value)} placeholder="https://..." style={{ ...S.input, fontFamily: 'monospace', fontSize: 11 }} />
							</div>
						</ControlSection>
					)}

					{selected.widgetType === 'code' && (
						<ControlSection title="Code">
							<div>
								<Label>Code</Label>
								<textarea value={String(s.content ?? '')} onChange={(e) => update(id, 'content', e.target.value)} rows={8} placeholder="// Code..." style={{ ...S.input, height: 'auto', padding: 8, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' as const }} />
							</div>
						</ControlSection>
					)}

					{selected.widgetType === 'spacer' && (
						<ControlSection title="Spacer">
							<SliderControl label="Height" value={parseInt(String(s.height ?? '40')) || 40} unit="px" units={['px', 'vh']} min={0} max={500} onChange={(v, u) => update(id, 'height', `${v}${u}`)} />
						</ControlSection>
					)}

					{selected.elType === 'container' && (
						<ControlSection title="Layout">
							<SelectControl
								label="Direction"
								value={String(s.direction ?? 'column')}
								options={[
									{ value: 'column', label: 'Column', icon: 'arrow-down' },
									{ value: 'row', label: 'Row', icon: 'arrow-right' },
									{ value: 'column-reverse', label: 'Col Rev', icon: 'arrow-up' },
									{ value: 'row-reverse', label: 'Row Rev', icon: 'arrow-left' },
								]}
								onChange={(v) => update(id, 'direction', v)}
								mode="icons"
							/>
							<SelectControl
								label="Justify Content"
								value={String(s.justifyContent ?? 'flex-start')}
								options={[
									{ value: 'flex-start', label: 'Start', icon: 'start-h' },
									{ value: 'center', label: 'Center', icon: 'center-h' },
									{ value: 'flex-end', label: 'End', icon: 'end-h' },
									{ value: 'space-between', label: 'Between' },
									{ value: 'space-around', label: 'Around' },
								]}
								onChange={(v) => update(id, 'justifyContent', v)}
								mode="icons"
							/>
							<SelectControl
								label="Align Items"
								value={String(s.alignItems ?? 'stretch')}
								options={[
									{ value: 'flex-start', label: 'Start', icon: 'start-v' },
									{ value: 'center', label: 'Center', icon: 'center-v' },
									{ value: 'flex-end', label: 'End', icon: 'end-v' },
									{ value: 'stretch', label: 'Stretch' },
								]}
								onChange={(v) => update(id, 'alignItems', v)}
								mode="icons"
							/>
							{(() => { const gv = slider('gap', 16, 'px'); return (
								<SliderControl label="Gap" value={gv.size} unit={gv.unit} units={['px', '%', 'em']} min={0} max={100} onChange={(v, u) => update(id, 'gap', { size: v, unit: u })} />
							); })()}
						</ControlSection>
					)}
				</div>
			)}

			{/* ─── STYLE TAB ─── */}
			{controlTab === 'style' && (
				<div>
					{/* Typography (for text widgets) */}
					{(selected.widgetType === 'heading' || selected.widgetType === 'paragraph' || selected.widgetType === 'quote') && (
						<ControlSection title="Typography">
							<ColorControl label="Text Color" value={String(s.color ?? '')} onChange={(v) => update(id, 'color', v)} />
							{(() => { const fv = slider('fontSize', 16, 'px'); return (
								<SliderControl label="Font Size" value={fv.size} unit={fv.unit} units={['px', 'em', 'rem', 'vw']} min={8} max={120} onChange={(v, u) => update(id, 'fontSize', { size: v, unit: u })} />
							); })()}
							<SelectControl
								label="Font Weight"
								value={String(s.fontWeight ?? '')}
								options={[
									{ value: '', label: 'Default' },
									{ value: '300', label: 'Light' },
									{ value: '400', label: 'Normal' },
									{ value: '500', label: 'Medium' },
									{ value: '600', label: 'Semi Bold' },
									{ value: '700', label: 'Bold' },
									{ value: '800', label: 'Extra Bold' },
								]}
								onChange={(v) => update(id, 'fontWeight', v)}
							/>
							{(() => { const lh = slider('lineHeight', 1.5, 'em'); return (
								<SliderControl label="Line Height" value={lh.size} unit={lh.unit} units={['px', 'em', '']} min={0.5} max={5} step={0.1} onChange={(v, u) => update(id, 'lineHeight', { size: v, unit: u })} />
							); })()}
						</ControlSection>
					)}

					{/* Background */}
					<ControlSection title="Background">
						<ColorControl label="Background Color" value={String(s.backgroundColor ?? '')} onChange={(v) => update(id, 'backgroundColor', v)} />
					</ControlSection>

					{/* Border */}
					<ControlSection title="Border" defaultOpen={false}>
						<SelectControl
							label="Border Style"
							value={String(s.borderStyle ?? 'none')}
							options={[
								{ value: 'none', label: 'None' },
								{ value: 'solid', label: 'Solid' },
								{ value: 'dashed', label: 'Dashed' },
								{ value: 'dotted', label: 'Dotted' },
								{ value: 'double', label: 'Double' },
							]}
							onChange={(v) => update(id, 'borderStyle', v)}
						/>
						{String(s.borderStyle ?? 'none') !== 'none' && (
							<>
								<ColorControl label="Border Color" value={String(s.borderColor ?? '')} onChange={(v) => update(id, 'borderColor', v)} />
								{(() => { const bw = slider('borderWidth', 1, 'px'); return (
									<SliderControl label="Border Width" value={bw.size} unit={bw.unit} units={['px']} min={0} max={20} onChange={(v, u) => update(id, 'borderWidth', { size: v, unit: u })} />
								); })()}
							</>
						)}
						<DimensionsControl
							label="Border Radius"
							value={dim('borderRadius')}
							units={['px', '%']}
							max={100}
							onChange={(v) => update(id, 'borderRadius', v)}
						/>
					</ControlSection>

					{/* Spacing */}
					<ControlSection title="Spacing">
						<DimensionsControl
							label="Padding"
							value={dim('_padding')}
							max={200}
							onChange={(v) => {
								update(id, '_padding', v);
								update(id, 'padding', `${v.top}${v.unit} ${v.right}${v.unit} ${v.bottom}${v.unit} ${v.left}${v.unit}`);
							}}
						/>
						<DimensionsControl
							label="Margin"
							value={dim('_margin')}
							max={200}
							onChange={(v) => {
								update(id, '_margin', v);
								update(id, 'margin', `${v.top}${v.unit} ${v.right}${v.unit} ${v.bottom}${v.unit} ${v.left}${v.unit}`);
							}}
						/>
					</ControlSection>

					{/* Shadow */}
					<ControlSection title="Shadow" defaultOpen={false}>
						<ColorControl label="Shadow Color" value={String(s.shadowColor ?? '')} onChange={(v) => update(id, 'shadowColor', v)} />
						{(() => { const sh = slider('shadowBlur', 0, 'px'); return (
							<SliderControl label="Blur" value={sh.size} unit="px" units={['px']} min={0} max={100} onChange={(v) => update(id, 'shadowBlur', { size: v, unit: 'px' })} />
						); })()}
					</ControlSection>
				</div>
			)}

			{/* ─── ADVANCED TAB ─── */}
			{controlTab === 'advanced' && (
				<div>
					<ControlSection title="Sizing">
						{(() => { const w = slider('width', 0, '%'); return (
							<SliderControl label="Width" value={w.size} unit={w.unit} units={['px', '%', 'vw', 'auto' as string]} min={0} max={1200} onChange={(v, u) => update(id, 'width', u === 'auto' ? 'auto' : { size: v, unit: u })} />
						); })()}
						{(() => { const mh = slider('minHeight', 0, 'px'); return (
							<SliderControl label="Min Height" value={mh.size} unit={mh.unit} units={['px', 'vh']} min={0} max={1000} onChange={(v, u) => update(id, 'minHeight', { size: v, unit: u })} />
						); })()}
					</ControlSection>

					<ControlSection title="Position" defaultOpen={false}>
						<SelectControl
							label="Position"
							value={String(s.position ?? 'static')}
							options={[
								{ value: 'static', label: 'Default' },
								{ value: 'relative', label: 'Relative' },
								{ value: 'absolute', label: 'Absolute' },
								{ value: 'fixed', label: 'Fixed' },
								{ value: 'sticky', label: 'Sticky' },
							]}
							onChange={(v) => update(id, 'position', v)}
						/>
						{(() => { const z = slider('zIndex', 0, ''); return (
							<SliderControl label="Z-Index" value={z.size} unit="" units={['']} min={-10} max={100} onChange={(v) => update(id, 'zIndex', v)} />
						); })()}
					</ControlSection>

					<ControlSection title="CSS Classes" defaultOpen={false}>
						<div>
							<Label>Additional Classes</Label>
							<input type="text" value={String(s.cssClasses ?? '')} onChange={(e) => update(id, 'cssClasses', e.target.value)} placeholder="class-a class-b" style={{ ...S.input, fontFamily: 'monospace', fontSize: 11 }} />
						</div>
					</ControlSection>

					<ControlSection title="Custom CSS" defaultOpen={false}>
						<div>
							<Label>CSS (selector = this element)</Label>
							<textarea
								value={String(s.customCss ?? '')}
								onChange={(e) => update(id, 'customCss', e.target.value)}
								placeholder="selector { color: red; }"
								rows={5}
								style={{ ...S.input, height: 'auto', padding: 8, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' as const, lineHeight: 1.5 }}
							/>
						</div>
					</ControlSection>

					<ControlSection title="Attributes" defaultOpen={false}>
						<div>
							<Label>Custom HTML Attributes</Label>
							<textarea
								value={String(s.customAttributes ?? '')}
								onChange={(e) => update(id, 'customAttributes', e.target.value)}
								placeholder={'data-analytics="hero"\naria-label="Main"'}
								rows={3}
								style={{ ...S.input, height: 'auto', padding: 8, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' as const }}
							/>
						</div>
					</ControlSection>
				</div>
			)}
		</div>
	);
}
