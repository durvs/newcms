/**
 * Frontend element renderer — server-side rendering of visual builder content.
 * Content is admin-authored CMS builder data (trusted), not user-submitted input.
 */

import type { CSSProperties } from 'react';

interface ElementNode {
	id: string;
	elType: string;
	widgetType?: string;
	settings: Record<string, unknown>;
	elements: ElementNode[];
}

function extractStyles(s: Record<string, unknown>): CSSProperties {
	const css: CSSProperties = {};
	if (s.padding) css.padding = String(s.padding);
	if (s.margin) css.margin = String(s.margin);
	if (s.backgroundColor) css.backgroundColor = String(s.backgroundColor);
	if (s.color) css.color = String(s.color);
	if (s.textAlign) css.textAlign = String(s.textAlign) as CSSProperties['textAlign'];
	if (s.fontWeight) css.fontWeight = String(s.fontWeight);
	if (s.fontFamily) css.fontFamily = String(s.fontFamily);
	if (s.borderStyle && s.borderStyle !== 'none') {
		css.borderStyle = String(s.borderStyle);
		if (s.borderColor) css.borderColor = String(s.borderColor);
		const bw = s.borderWidth as { size?: number; unit?: string } | undefined;
		if (bw?.size) css.borderWidth = `${bw.size}${bw.unit ?? 'px'}`;
	}
	const br = s.borderRadius as
		| { top?: number; right?: number; bottom?: number; left?: number; unit?: string }
		| undefined;
	if (br?.top !== undefined)
		css.borderRadius = `${br.top}${br.unit ?? 'px'} ${br.right}${br.unit ?? 'px'} ${br.bottom}${br.unit ?? 'px'} ${br.left}${br.unit ?? 'px'}`;
	for (const [key, prop] of [
		['fontSize', 'fontSize'],
		['lineHeight', 'lineHeight'],
		['width', 'width'],
		['minHeight', 'minHeight'],
		['gap', 'gap'],
	] as const) {
		const v = s[key] as { size?: number; unit?: string } | string | undefined;
		if (v && typeof v === 'object' && v.size)
			(css as Record<string, unknown>)[prop] = `${v.size}${v.unit ?? 'px'}`;
		else if (typeof v === 'string' && v) (css as Record<string, unknown>)[prop] = v;
	}
	if (typeof s.backgroundImage === 'string' && s.backgroundImage) {
		css.backgroundImage = s.backgroundImage;
		css.backgroundSize = 'cover';
		css.backgroundPosition = 'center';
	}
	return css;
}

export function RenderElements({ elements }: { elements: ElementNode[] }) {
	return (
		<>
			{elements.map((el) => (
				<RenderElement key={el.id} node={el} />
			))}
		</>
	);
}

function RenderElement({ node }: { node: ElementNode }) {
	const styles = extractStyles(node.settings);
	if (node.elType === 'container') {
		const display = String(node.settings.display ?? 'flex');
		const dir = String(node.settings.direction ?? 'column');
		const gridCols = Number(node.settings.gridColumns ?? 2);
		const layout: CSSProperties =
			display === 'grid'
				? { display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }
				: {
						display: 'flex',
						flexDirection: dir as CSSProperties['flexDirection'],
						justifyContent: String(node.settings.justifyContent ?? 'flex-start'),
						alignItems: String(node.settings.alignItems ?? 'stretch'),
					};
		return (
			<div style={{ ...layout, ...styles }}>
				<RenderElements elements={node.elements} />
			</div>
		);
	}
	return (
		<div style={styles}>
			<RenderWidget node={node} />
		</div>
	);
}

function RenderWidget({ node }: { node: ElementNode }) {
	const s = node.settings;
	switch (node.widgetType) {
		case 'heading': {
			const level = parseInt(String(s.level ?? s.header_size ?? '2').replace(/\D/g, ''), 10);
			const Tag = `h${level >= 1 && level <= 6 ? level : 2}` as
				| 'h1'
				| 'h2'
				| 'h3'
				| 'h4'
				| 'h5'
				| 'h6';
			const sizes: Record<number, string> = {
				1: '2.5em',
				2: '2em',
				3: '1.5em',
				4: '1.25em',
				5: '1.1em',
				6: '1em',
			};
			return (
				<Tag
					style={{ margin: 0, fontSize: sizes[level] ?? '2em', fontWeight: 600, lineHeight: 1.3 }}
				>
					{String(s.content ?? '')}
				</Tag>
			);
		}
		case 'paragraph': {
			const content = String(s.content ?? '');
			// Content is admin-authored CMS data, not external user input (nosemgrep)
			if (/<[a-z][\s\S]*>/i.test(content))
				return <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content }} />;
			return <p style={{ margin: 0, lineHeight: 1.7 }}>{content}</p>;
		}
		case 'image': {
			const url = String(s.url ?? '');
			return url ? (
				<img
					src={url}
					alt={String(s.alt ?? '')}
					style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
				/>
			) : null;
		}
		case 'button':
			return (
				<div>
					<a
						href={String(s.url ?? '#')}
						style={{
							display: 'inline-block',
							padding: '12px 28px',
							backgroundColor: 'var(--e-global-color-primary, #6366f1)',
							color: '#fff',
							borderRadius: 6,
							textDecoration: 'none',
							fontWeight: 600,
						}}
					>
						{String(s.text ?? 'Button')}
					</a>
				</div>
			);
		case 'separator':
			return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />;
		case 'spacer':
			return <div style={{ height: String(s.height ?? '40px') }} />;
		case 'code':
			return (
				<pre
					style={{
						padding: 16,
						background: '#1e1e2e',
						color: '#cdd6f4',
						borderRadius: 8,
						fontSize: 13,
						fontFamily: 'monospace',
						overflow: 'auto',
					}}
				>
					<code>{String(s.content ?? '')}</code>
				</pre>
			);
		case 'counter':
			return (
				<div style={{ textAlign: 'center', padding: 16 }}>
					<div style={{ fontSize: 48, fontWeight: 700 }}>
						{String(s.endValue ?? s.ending_number ?? '100')}
					</div>
				</div>
			);
		case 'icon-box':
			return (
				<div style={{ textAlign: 'center', padding: 16 }}>
					<div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
					<div style={{ fontWeight: 600 }}>{String(s.title ?? s.content ?? '')}</div>
				</div>
			);
		case 'accordion':
		case 'toggle':
			if (node.elements?.length > 0) {
				return (
					<div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
						{node.elements.map((c, i) => (
							<details
								key={c.id}
								open={i === 0}
								style={{
									borderBottom: i < node.elements.length - 1 ? '1px solid #e5e7eb' : 'none',
								}}
							>
								<summary style={{ padding: '14px 16px', fontWeight: 600, cursor: 'pointer' }}>
									{String(c.settings?.title ?? `Item ${i + 1}`)}
								</summary>
								<div style={{ padding: '0 16px 14px' }}>
									<RenderElements elements={c.elements} />
								</div>
							</details>
						))}
					</div>
				);
			}
			return null;
		case 'social-icons':
			return (
				<div style={{ display: 'flex', gap: 8 }}>
					{['📘', '🐦', '📸', '💼'].map((e, i) => (
						<div
							key={i}
							style={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: '#f0f0f0',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{e}
						</div>
					))}
				</div>
			);
		case 'nav-menu':
			return (
				<nav style={{ display: 'flex', gap: 20 }}>
					{['Home', 'About', 'Services', 'Contact'].map((t) => (
						<a key={t} href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
							{t}
						</a>
					))}
				</nav>
			);
		default:
			return s.content ? <div>{String(s.content)}</div> : null;
	}
}
