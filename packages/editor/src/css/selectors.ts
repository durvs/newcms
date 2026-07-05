import type { SliderValue } from '../controls/types';

/**
 * Resolve CSS selector placeholders.
 *
 * Replaces:
 *   {{WRAPPER}} → .builder-el-{elementId}
 *   {{VALUE}}   → the control value as string
 *   {{SIZE}}    → numeric part of a slider value
 *   {{UNIT}}    → unit part of a slider value
 */
export function resolveSelector(selectorTemplate: string, elementId: string): string {
	return selectorTemplate.replace(/\{\{WRAPPER\}\}/g, `.builder-el-${elementId}`);
}

/**
 * Resolve CSS value placeholders.
 */
export function resolveValue(valueTemplate: string, value: unknown): string | null {
	if (value === undefined || value === null || value === '') return null;

	// Slider value: { size: number, unit: string }
	if (typeof value === 'object' && value !== null && 'size' in value) {
		const sv = value as SliderValue;
		if (sv.size === undefined || sv.size === null) return null;
		return valueTemplate
			.replace(/\{\{VALUE\}\}/g, `${sv.size}${sv.unit}`)
			.replace(/\{\{SIZE\}\}/g, String(sv.size))
			.replace(/\{\{UNIT\}\}/g, sv.unit);
	}

	// Simple value
	return valueTemplate.replace(/\{\{VALUE\}\}/g, String(value));
}

/**
 * Generate a single CSS rule from a selector template and value.
 * Returns null if the value is empty/undefined.
 */
export function generateRule(
	selectorTemplate: string,
	valueTemplate: string,
	elementId: string,
	value: unknown,
): string | null {
	const resolvedValue = resolveValue(valueTemplate, value);
	if (!resolvedValue) return null;

	const resolvedSelector = resolveSelector(selectorTemplate, elementId);
	return `${resolvedSelector} { ${resolvedValue} }`;
}
