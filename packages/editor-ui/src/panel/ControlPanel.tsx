import { useEditorStore, type ControlTab } from '../store/editor-store';

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
	const updateSetting = useEditorStore((s) => s.updateSetting);

	if (!selected || !selectedId) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<p className="text-sm text-[var(--cm-text-muted)]">Select an element to edit</p>
				<p className="mt-1 text-[11px] text-[var(--cm-text-faint)]">Click on an element in the preview</p>
			</div>
		);
	}

	return (
		<div>
			{/* Element type header */}
			<div className="border-b border-[var(--cm-border)] px-3 py-2">
				<p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
					{selected.widgetType ?? selected.elType}
				</p>
				<p className="text-[10px] text-[var(--cm-text-faint)] font-mono">{selected.id}</p>
			</div>

			{/* Tab bar */}
			<div className="flex border-b border-[var(--cm-border)]">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setControlTab(tab.id)}
						className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
							controlTab === tab.id
								? 'border-b border-[var(--color-accent)] text-[var(--cm-text)]'
								: 'text-[var(--cm-text-muted)] hover:text-[var(--cm-text)]'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Controls — basic inline editors per widget type */}
			<div className="p-3 space-y-3">
				{controlTab === 'content' && (
					<>
						{selected.widgetType === 'heading' && (
							<>
								<ControlField label="Text">
									<input
										type="text"
										value={String(selected.settings.content ?? '')}
										onChange={(e) => updateSetting(selectedId, 'content', e.target.value)}
										className="control-input"
										placeholder="Heading text"
									/>
								</ControlField>
								<ControlField label="Tag">
									<select
										value={String(selected.settings.level ?? 2)}
										onChange={(e) => updateSetting(selectedId, 'level', Number(e.target.value))}
										className="control-input"
									>
										{[1, 2, 3, 4, 5, 6].map((l) => (
											<option key={l} value={l}>H{l}</option>
										))}
									</select>
								</ControlField>
							</>
						)}

						{selected.widgetType === 'paragraph' && (
							<ControlField label="Text">
								<textarea
									value={String(selected.settings.content ?? '')}
									onChange={(e) => updateSetting(selectedId, 'content', e.target.value)}
									className="control-input min-h-[100px] resize-y"
									placeholder="Paragraph text..."
								/>
							</ControlField>
						)}

						{selected.widgetType === 'image' && (
							<>
								<ControlField label="Image URL">
									<input
										type="text"
										value={String(selected.settings.url ?? '')}
										onChange={(e) => updateSetting(selectedId, 'url', e.target.value)}
										className="control-input font-mono"
										placeholder="https://..."
									/>
								</ControlField>
								<ControlField label="Alt Text">
									<input
										type="text"
										value={String(selected.settings.alt ?? '')}
										onChange={(e) => updateSetting(selectedId, 'alt', e.target.value)}
										className="control-input"
										placeholder="Image description"
									/>
								</ControlField>
							</>
						)}

						{selected.widgetType === 'button' && (
							<>
								<ControlField label="Text">
									<input
										type="text"
										value={String(selected.settings.text ?? '')}
										onChange={(e) => updateSetting(selectedId, 'text', e.target.value)}
										className="control-input"
										placeholder="Button text"
									/>
								</ControlField>
								<ControlField label="Link URL">
									<input
										type="text"
										value={String(selected.settings.url ?? '')}
										onChange={(e) => updateSetting(selectedId, 'url', e.target.value)}
										className="control-input font-mono"
										placeholder="https://..."
									/>
								</ControlField>
							</>
						)}

						{selected.widgetType === 'code' && (
							<ControlField label="Code">
								<textarea
									value={String(selected.settings.content ?? '')}
									onChange={(e) => updateSetting(selectedId, 'content', e.target.value)}
									className="control-input min-h-[150px] resize-y font-mono text-[12px]"
									placeholder="// Code here..."
								/>
							</ControlField>
						)}

						{selected.widgetType === 'html' && (
							<ControlField label="HTML">
								<textarea
									value={String(selected.settings.content ?? '')}
									onChange={(e) => updateSetting(selectedId, 'content', e.target.value)}
									className="control-input min-h-[150px] resize-y font-mono text-[12px]"
									placeholder="<div>...</div>"
								/>
							</ControlField>
						)}

						{selected.widgetType === 'spacer' && (
							<ControlField label="Height">
								<input
									type="text"
									value={String(selected.settings.height ?? '40px')}
									onChange={(e) => updateSetting(selectedId, 'height', e.target.value)}
									className="control-input font-mono"
								/>
							</ControlField>
						)}

						{selected.elType === 'container' && (
							<>
								<ControlField label="Direction">
									<select
										value={String(selected.settings.direction ?? 'column')}
										onChange={(e) => updateSetting(selectedId, 'direction', e.target.value)}
										className="control-input"
									>
										<option value="column">Column (vertical)</option>
										<option value="row">Row (horizontal)</option>
									</select>
								</ControlField>
								<ControlField label="Gap">
									<input
										type="text"
										value={String(selected.settings.gap ?? '16px')}
										onChange={(e) => updateSetting(selectedId, 'gap', e.target.value)}
										className="control-input font-mono"
									/>
								</ControlField>
							</>
						)}

						{/* Fallback for types not yet handled */}
						{!selected.widgetType && selected.elType !== 'container' && (
							<p className="text-xs text-[var(--cm-text-faint)]">No controls available for this element type</p>
						)}
					</>
				)}

				{controlTab === 'style' && (
					<>
						<ControlField label="Text Color">
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={String(selected.settings.color ?? '#000000')}
									onChange={(e) => updateSetting(selectedId, 'color', e.target.value)}
									className="h-8 w-8 cursor-pointer rounded border border-[var(--cm-border)] bg-transparent"
								/>
								<input
									type="text"
									value={String(selected.settings.color ?? '')}
									onChange={(e) => updateSetting(selectedId, 'color', e.target.value)}
									className="control-input flex-1 font-mono"
									placeholder="#000000"
								/>
							</div>
						</ControlField>
						<ControlField label="Background">
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={String(selected.settings.backgroundColor ?? '#ffffff')}
									onChange={(e) => updateSetting(selectedId, 'backgroundColor', e.target.value)}
									className="h-8 w-8 cursor-pointer rounded border border-[var(--cm-border)] bg-transparent"
								/>
								<input
									type="text"
									value={String(selected.settings.backgroundColor ?? '')}
									onChange={(e) => updateSetting(selectedId, 'backgroundColor', e.target.value)}
									className="control-input flex-1 font-mono"
									placeholder="transparent"
								/>
							</div>
						</ControlField>
						<ControlField label="Padding">
							<input
								type="text"
								value={String(selected.settings.padding ?? '')}
								onChange={(e) => updateSetting(selectedId, 'padding', e.target.value)}
								className="control-input font-mono"
								placeholder="16px"
							/>
						</ControlField>
						<ControlField label="Margin">
							<input
								type="text"
								value={String(selected.settings.margin ?? '')}
								onChange={(e) => updateSetting(selectedId, 'margin', e.target.value)}
								className="control-input font-mono"
								placeholder="0"
							/>
						</ControlField>
					</>
				)}

				{controlTab === 'advanced' && (
					<>
						<ControlField label="CSS Classes">
							<input
								type="text"
								value={String(selected.settings.cssClasses ?? '')}
								onChange={(e) => updateSetting(selectedId, 'cssClasses', e.target.value)}
								className="control-input font-mono"
								placeholder="my-class another-class"
							/>
						</ControlField>
						<ControlField label="Custom CSS">
							<textarea
								value={String(selected.settings.customCss ?? '')}
								onChange={(e) => updateSetting(selectedId, 'customCss', e.target.value)}
								className="control-input min-h-[80px] resize-y font-mono text-[12px]"
								placeholder="selector { property: value; }"
							/>
						</ControlField>
					</>
				)}
			</div>
		</div>
	);
}

function ControlField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="space-y-1.5">
			<label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--cm-text-muted)]">
				{label}
			</label>
			{children}
		</div>
	);
}
