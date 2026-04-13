/**
 * Design Kit — global design tokens applied across all elements.
 * One active kit per site, stored as a CMS option.
 */

export interface DesignColor {
	id: string;
	title: string;
	color: string;
}

export interface DesignTypography {
	id: string;
	title: string;
	fontFamily: string;
	fontSize: { size: number; unit: string };
	fontWeight: string;
	lineHeight: { size: number; unit: string };
	letterSpacing: { size: number; unit: string };
}

export interface DesignKit {
	/** Global color palette */
	colors: DesignColor[];
	/** Global typography presets */
	typography: DesignTypography[];
	/** Global button styles */
	buttonPadding: string;
	buttonBorderRadius: string;
	buttonFontSize: string;
	buttonFontWeight: string;
	/** Body default typography */
	bodyFontFamily: string;
	bodyFontSize: string;
	bodyColor: string;
	bodyLineHeight: string;
	/** Site identity */
	siteName: string;
	siteDescription: string;
	/** Breakpoints (customizable) */
	breakpoints: Record<string, number>;
}

export const DEFAULT_KIT: DesignKit = {
	colors: [
		{ id: 'primary', title: 'Primary', color: '#6366f1' },
		{ id: 'secondary', title: 'Secondary', color: '#8b5cf6' },
		{ id: 'text', title: 'Text', color: '#1e293b' },
		{ id: 'accent', title: 'Accent', color: '#f59e0b' },
		{ id: 'light', title: 'Light', color: '#f8fafc' },
		{ id: 'dark', title: 'Dark', color: '#0f172a' },
	],
	typography: [
		{ id: 'primary', title: 'Primary', fontFamily: 'Inter', fontSize: { size: 16, unit: 'px' }, fontWeight: '400', lineHeight: { size: 1.6, unit: '' }, letterSpacing: { size: 0, unit: 'px' } },
		{ id: 'secondary', title: 'Secondary', fontFamily: 'Inter', fontSize: { size: 16, unit: 'px' }, fontWeight: '400', lineHeight: { size: 1.6, unit: '' }, letterSpacing: { size: 0, unit: 'px' } },
		{ id: 'accent', title: 'Accent', fontFamily: 'Inter', fontSize: { size: 16, unit: 'px' }, fontWeight: '600', lineHeight: { size: 1.4, unit: '' }, letterSpacing: { size: -0.2, unit: 'px' } },
	],
	buttonPadding: '12px 24px',
	buttonBorderRadius: '6px',
	buttonFontSize: '14px',
	buttonFontWeight: '600',
	bodyFontFamily: 'Inter, system-ui, sans-serif',
	bodyFontSize: '16px',
	bodyColor: '#1e293b',
	bodyLineHeight: '1.6',
	siteName: 'My Site',
	siteDescription: '',
	breakpoints: {
		mobile: 767,
		tablet: 1023,
		laptop: 1366,
		widescreen: 1440,
	},
};

/**
 * Generate CSS custom properties from a design kit.
 */
export function kitToCSS(kit: DesignKit): string {
	const lines: string[] = [':root {'];

	// Colors
	for (const c of kit.colors) {
		lines.push(`  --e-global-color-${c.id}: ${c.color};`);
	}

	// Typography
	for (const t of kit.typography) {
		lines.push(`  --e-global-typography-${t.id}-font-family: ${t.fontFamily};`);
		lines.push(`  --e-global-typography-${t.id}-font-size: ${t.fontSize.size}${t.fontSize.unit};`);
		lines.push(`  --e-global-typography-${t.id}-font-weight: ${t.fontWeight};`);
		lines.push(`  --e-global-typography-${t.id}-line-height: ${t.lineHeight.size}${t.lineHeight.unit};`);
	}

	// Body
	lines.push(`  --e-global-body-font-family: ${kit.bodyFontFamily};`);
	lines.push(`  --e-global-body-font-size: ${kit.bodyFontSize};`);
	lines.push(`  --e-global-body-color: ${kit.bodyColor};`);
	lines.push(`  --e-global-body-line-height: ${kit.bodyLineHeight};`);

	lines.push('}');

	lines.push('');
	lines.push(`body { font-family: ${kit.bodyFontFamily}; font-size: ${kit.bodyFontSize}; color: ${kit.bodyColor}; line-height: ${kit.bodyLineHeight}; }`);

	return lines.join('\n');
}
