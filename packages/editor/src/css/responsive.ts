/**
 * Responsive breakpoint system — 7 breakpoints as defined in the spec.
 */

export interface Breakpoint {
	name: string;
	label: string;
	/** Max-width for the media query. 0 means "base" (no media query). */
	maxWidth: number;
	/** Whether this is the default/base breakpoint */
	isDefault: boolean;
}

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
	{ name: 'widescreen', label: 'Wide Screen', maxWidth: 0, isDefault: false }, // min-width: 1440px
	{ name: 'desktop', label: 'Desktop', maxWidth: 0, isDefault: true },
	{ name: 'laptop', label: 'Laptop', maxWidth: 1366, isDefault: false },
	{ name: 'tablet_extra', label: 'Tablet Extra', maxWidth: 1024, isDefault: false },
	{ name: 'tablet', label: 'Tablet', maxWidth: 768, isDefault: false },
	{ name: 'mobile_extra', label: 'Mobile Extra', maxWidth: 480, isDefault: false },
	{ name: 'mobile', label: 'Mobile', maxWidth: 767, isDefault: false },
];

/**
 * Get the media query string for a breakpoint.
 */
export function getMediaQuery(breakpoint: Breakpoint): string | null {
	if (breakpoint.isDefault) return null; // Desktop = no media query
	if (breakpoint.name === 'widescreen') return `@media (min-width: 1440px)`;
	return `@media (max-width: ${breakpoint.maxWidth}px)`;
}

/**
 * Get a responsive setting value.
 * Checks for `{key}_{breakpointName}` suffix, falls back to base value.
 */
export function getResponsiveValue(
	settings: Record<string, unknown>,
	key: string,
	breakpointName: string,
): unknown {
	if (breakpointName === 'desktop') return settings[key];
	const responsiveKey = `${key}_${breakpointName}`;
	return settings[responsiveKey] ?? undefined; // undefined = inherit from desktop
}

/**
 * Get ordered breakpoints for CSS generation (desktop first, then by max-width descending).
 */
export function getOrderedBreakpoints(breakpoints: Breakpoint[] = DEFAULT_BREAKPOINTS): Breakpoint[] {
	const desktop = breakpoints.find((b) => b.isDefault);
	const others = breakpoints
		.filter((b) => !b.isDefault)
		.sort((a, b) => b.maxWidth - a.maxWidth);
	return desktop ? [desktop, ...others] : others;
}
