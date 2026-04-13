import { LayoutGrid, Sliders, Layers } from 'lucide-react';
import { useEditorStore, type PanelView } from '../store/editor-store';
import { WidgetPicker } from './WidgetPicker';
import { ControlPanel } from './ControlPanel';
import { NavigatorTree } from './NavigatorTree';

const tabs: { view: PanelView; icon: typeof LayoutGrid; label: string }[] = [
	{ view: 'widgets', icon: LayoutGrid, label: 'Widgets' },
	{ view: 'controls', icon: Sliders, label: 'Controls' },
	{ view: 'navigator', icon: Layers, label: 'Navigator' },
];

export function Panel() {
	const panelView = useEditorStore((s) => s.panelView);
	const setPanelView = useEditorStore((s) => s.setPanelView);
	const selectedId = useEditorStore((s) => s.selectedId);

	return (
		<div className="flex h-full w-[320px] flex-col border-r border-[var(--cm-border)] bg-[var(--cm-surface)]">
			{/* Tabs */}
			<div className="flex border-b border-[var(--cm-border)]">
				{tabs.map((tab) => (
					<button
						key={tab.view}
						onClick={() => setPanelView(tab.view)}
						className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
							panelView === tab.view
								? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
								: 'text-[var(--cm-text-muted)] hover:text-[var(--cm-text)]'
						}`}
					>
						<tab.icon className="h-3.5 w-3.5" />
						{tab.label}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{panelView === 'widgets' && <WidgetPicker />}
				{panelView === 'controls' && <ControlPanel />}
				{panelView === 'navigator' && <NavigatorTree />}
			</div>
		</div>
	);
}
