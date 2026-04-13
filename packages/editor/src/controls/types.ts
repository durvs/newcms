/**
 * Control type system — defines the 12 control types and how they
 * map values to CSS via selectors.
 */

export type ControlType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'select'
	| 'switcher'
	| 'color'
	| 'slider'
	| 'dimensions'
	| 'media'
	| 'icon-choose'
	| 'repeater'
	| 'code';

/**
 * A single control definition.
 */
export interface ControlDefinition {
	/** Unique ID within the widget */
	id: string;
	/** Control type */
	type: ControlType | 'group';
	/** Display label */
	label: string;
	/** Default value */
	default?: unknown;
	/** CSS selector mapping: { "{{WRAPPER}} .class": "property: {{VALUE}}" } */
	selectors?: Record<string, string>;
	/** For select/icon-choose: available options */
	options?: Record<string, string>;
	/** For slider: min, max, step, units */
	min?: number;
	max?: number;
	step?: number;
	units?: string[];
	/** For groups: which group type (typography, background, border, shadow, flexbox, grid) */
	groupType?: string;
	/** CSS selector for groups (applied to all sub-controls) */
	selector?: string;
	/** Whether this control is responsive (generates per-breakpoint values) */
	responsive?: boolean;
	/** Condition: show only when another control has a specific value */
	condition?: Record<string, unknown>;
	/** For repeater: fields definition */
	fields?: ControlDefinition[];
	/** Placeholder text */
	placeholder?: string;
}

/**
 * A section of controls (collapsible group within a tab).
 */
export interface ControlSection {
	id: string;
	label: string;
	tab: 'content' | 'style' | 'advanced';
	controls: ControlDefinition[];
}

/**
 * Complete widget control schema — defines all controls for a widget type.
 */
export interface WidgetControlSchema {
	widgetType: string;
	title: string;
	icon?: string;
	category?: string;
	sections: ControlSection[];
}

/**
 * A slider value with size and unit.
 */
export interface SliderValue {
	size: number;
	unit: string;
}

/**
 * A dimensions value (margin, padding, border-radius).
 */
export interface DimensionsValue {
	top: string;
	right: string;
	bottom: string;
	left: string;
	unit: string;
	isLinked: boolean;
}

/**
 * A media value (image, file).
 */
export interface MediaValue {
	url: string;
	id?: number;
	alt?: string;
}
