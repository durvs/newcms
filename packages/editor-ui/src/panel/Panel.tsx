import { LayoutGrid, SlidersHorizontal, Layers } from 'lucide-react';
import { useEditorStore, type PanelView } from '../store/editor-store';
import { WidgetPicker } from './WidgetPicker';
import { ControlPanel } from './ControlPanel';
import { NavigatorTree } from './NavigatorTree';

const tabs: { view: PanelView; icon: typeof LayoutGrid; label: string }[] = [
	{ view: 'widgets', icon: LayoutGrid, label: 'Widgets' },
	{ view: 'controls', icon: SlidersHorizontal, label: 'Style' },
	{ view: 'navigator', icon: Layers, label: 'Layers' },
];

export function Panel() {
	const panelView = useEditorStore((s) => s.panelView);
	const setPanelView = useEditorStore((s) => s.setPanelView);

	return (
		<div
			style={{
				width: 300,
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				borderRight: '1px solid var(--cm-border)',
				background: 'var(--cm-surface)',
				flexShrink: 0,
			}}
		>
			{/* Tab bar */}
			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid var(--cm-border)',
					padding: '0 4px',
					gap: 0,
					flexShrink: 0,
				}}
			>
				{tabs.map((tab) => {
					const active = panelView === tab.view;
					return (
						<button
							key={tab.view}
							onClick={() => setPanelView(tab.view)}
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 6,
								padding: '10px 0',
								border: 'none',
								borderBottom: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
								background: 'transparent',
								color: active ? 'var(--cm-text)' : 'var(--cm-text-muted)',
								fontSize: 11,
								fontWeight: 600,
								letterSpacing: '0.03em',
								cursor: 'pointer',
								transition: 'all .15s',
								marginBottom: -1,
							}}
						>
							<tab.icon size={14} strokeWidth={active ? 2 : 1.5} />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Content */}
			<div style={{ flex: 1, overflow: 'auto' }}>
				{panelView === 'widgets' && <WidgetPicker />}
				{panelView === 'controls' && <ControlPanel />}
				{panelView === 'navigator' && <NavigatorTree />}
			</div>
		</div>
	);
}
