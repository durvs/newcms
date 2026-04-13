/**
 * Reusable control groups — expand into multiple CSS properties.
 * When a control has type: 'group' and groupType: 'typography',
 * the CSS compiler expands it into font-family, font-size, etc.
 */

export interface ControlGroupExpansion {
	/** Sub-control suffix (appended to the group control's ID) */
	suffix: string;
	/** CSS property */
	property: string;
	/** Control type for the sub-control */
	type: 'text' | 'slider' | 'select' | 'color' | 'number';
	/** Label */
	label: string;
	/** Default value */
	default?: unknown;
	/** Units for sliders */
	units?: string[];
	/** Options for selects */
	options?: Record<string, string>;
}

export const CONTROL_GROUPS: Record<string, ControlGroupExpansion[]> = {
	typography: [
		{ suffix: '_font_family', property: 'font-family', type: 'text', label: 'Family', default: '' },
		{ suffix: '_font_size', property: 'font-size', type: 'slider', label: 'Size', units: ['px', 'em', 'rem', 'vw'], default: { size: 16, unit: 'px' } },
		{ suffix: '_font_weight', property: 'font-weight', type: 'select', label: 'Weight', options: { '100': 'Thin', '200': 'Extra Light', '300': 'Light', '400': 'Normal', '500': 'Medium', '600': 'Semi Bold', '700': 'Bold', '800': 'Extra Bold', '900': 'Black' }, default: '' },
		{ suffix: '_font_style', property: 'font-style', type: 'select', label: 'Style', options: { normal: 'Normal', italic: 'Italic', oblique: 'Oblique' }, default: '' },
		{ suffix: '_text_decoration', property: 'text-decoration', type: 'select', label: 'Decoration', options: { none: 'None', underline: 'Underline', overline: 'Overline', 'line-through': 'Line Through' }, default: '' },
		{ suffix: '_text_transform', property: 'text-transform', type: 'select', label: 'Transform', options: { none: 'Default', uppercase: 'Uppercase', lowercase: 'Lowercase', capitalize: 'Capitalize' }, default: '' },
		{ suffix: '_line_height', property: 'line-height', type: 'slider', label: 'Line Height', units: ['px', 'em', ''], default: { size: 1.5, unit: 'em' } },
		{ suffix: '_letter_spacing', property: 'letter-spacing', type: 'slider', label: 'Letter Spacing', units: ['px', 'em'], default: { size: 0, unit: 'px' } },
	],

	background: [
		{ suffix: '_color', property: 'background-color', type: 'color', label: 'Color', default: '' },
	],

	border: [
		{ suffix: '_type', property: 'border-style', type: 'select', label: 'Type', options: { none: 'None', solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted', double: 'Double', groove: 'Groove' }, default: 'none' },
		{ suffix: '_width', property: 'border-width', type: 'slider', label: 'Width', units: ['px'], default: { size: 0, unit: 'px' } },
		{ suffix: '_color', property: 'border-color', type: 'color', label: 'Color', default: '' },
		{ suffix: '_radius', property: 'border-radius', type: 'slider', label: 'Radius', units: ['px', '%'], default: { size: 0, unit: 'px' } },
	],

	shadow: [
		{ suffix: '_color', property: '--shadow-color', type: 'color', label: 'Color', default: 'rgba(0,0,0,0.1)' },
		{ suffix: '_horizontal', property: '--shadow-h', type: 'number', label: 'Horizontal', default: 0 },
		{ suffix: '_vertical', property: '--shadow-v', type: 'number', label: 'Vertical', default: 2 },
		{ suffix: '_blur', property: '--shadow-blur', type: 'number', label: 'Blur', default: 8 },
		{ suffix: '_spread', property: '--shadow-spread', type: 'number', label: 'Spread', default: 0 },
	],
};

/**
 * Expand a group control into its individual sub-controls with CSS selectors.
 */
export function expandGroup(
	controlId: string,
	groupType: string,
	_selector: string,
): { id: string; property: string; suffix: string }[] {
	const group = CONTROL_GROUPS[groupType];
	if (!group) return [];

	return group.map((sub) => ({
		id: `${controlId}${sub.suffix}`,
		property: sub.property,
		suffix: sub.suffix,
	}));
}
