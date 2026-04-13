import type { ElementNode } from '../element-tree/types';
import type { WidgetControlSchema, ControlDefinition } from '../controls/types';
import { expandGroup, CONTROL_GROUPS } from '../controls/groups';
import { generateRule } from './selectors';
import { getMediaQuery, getResponsiveValue, getOrderedBreakpoints, type Breakpoint } from './responsive';
import { walkTree } from '../element-tree/traversal';

/**
 * Compile a complete CSS stylesheet from an element tree.
 *
 * Algorithm:
 * 1. Walk every element in the tree
 * 2. Look up the widget's control schema
 * 3. For each control with selectors, generate CSS rules
 * 4. For responsive controls, generate rules per breakpoint
 * 5. Group rules by media query
 * 6. Concatenate and return
 */
export function compileCSS(
	elements: ElementNode[],
	widgetSchemas: Map<string, WidgetControlSchema>,
	breakpoints?: Breakpoint[],
): string {
	const orderedBreakpoints = getOrderedBreakpoints(breakpoints);
	/** Map of media query string → CSS rules */
	const rulesByMedia: Map<string | null, string[]> = new Map();
	rulesByMedia.set(null, []); // desktop (no media query)

	for (const bp of orderedBreakpoints) {
		if (!bp.isDefault) {
			const mq = getMediaQuery(bp);
			if (mq) rulesByMedia.set(mq, []);
		}
	}

	walkTree(elements, (node) => {
		if (node.elType !== 'widget' || !node.widgetType) return;

		const schema = widgetSchemas.get(node.widgetType);
		if (!schema) return;

		for (const section of schema.sections) {
			for (const control of section.controls) {
				processControl(control, node, orderedBreakpoints, rulesByMedia);
			}
		}
	});

	return buildStylesheet(rulesByMedia);
}

function processControl(
	control: ControlDefinition,
	node: ElementNode,
	breakpoints: Breakpoint[],
	rulesByMedia: Map<string | null, string[]>,
): void {
	// Group controls expand into sub-controls
	if (control.type === 'group' && control.groupType && control.selector) {
		const expansions = expandGroup(control.id, control.groupType, control.selector);
		const group = CONTROL_GROUPS[control.groupType];
		if (!group) return;

		for (let i = 0; i < expansions.length; i++) {
			const exp = expansions[i];
			const sub = group[i];
			const selectorMap = { [control.selector]: `${sub.property}: {{VALUE}}` };

			processSimpleControl(
				exp.id,
				selectorMap,
				node,
				breakpoints,
				rulesByMedia,
				control.responsive ?? true,
			);
		}
		return;
	}

	// Simple controls with selectors
	if (control.selectors) {
		processSimpleControl(
			control.id,
			control.selectors,
			node,
			breakpoints,
			rulesByMedia,
			control.responsive ?? false,
		);
	}
}

function processSimpleControl(
	controlId: string,
	selectors: Record<string, string>,
	node: ElementNode,
	breakpoints: Breakpoint[],
	rulesByMedia: Map<string | null, string[]>,
	responsive: boolean,
): void {
	for (const [selectorTemplate, valueTemplate] of Object.entries(selectors)) {
		// Desktop value (always)
		const desktopValue = node.settings[controlId];
		const rule = generateRule(selectorTemplate, valueTemplate, node.id, desktopValue);
		if (rule) {
			rulesByMedia.get(null)!.push(rule);
		}

		// Responsive values
		if (responsive) {
			for (const bp of breakpoints) {
				if (bp.isDefault) continue;
				const mq = getMediaQuery(bp);
				if (!mq) continue;

				const bpValue = getResponsiveValue(node.settings, controlId, bp.name);
				if (bpValue === undefined) continue;

				const bpRule = generateRule(selectorTemplate, valueTemplate, node.id, bpValue);
				if (bpRule) {
					const rules = rulesByMedia.get(mq);
					if (rules) rules.push(bpRule);
				}
			}
		}
	}
}

function buildStylesheet(rulesByMedia: Map<string | null, string[]>): string {
	const parts: string[] = [];

	// Desktop rules first (no media query)
	const desktopRules = rulesByMedia.get(null) ?? [];
	if (desktopRules.length > 0) {
		parts.push(desktopRules.join('\n'));
	}

	// Media query rules
	for (const [mq, rules] of rulesByMedia) {
		if (mq === null || rules.length === 0) continue;
		parts.push(`${mq} {\n${rules.join('\n')}\n}`);
	}

	return parts.join('\n\n');
}

/**
 * Minify CSS (basic: remove extra whitespace and newlines).
 */
export function minifyCSS(css: string): string {
	return css
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\s+/g, ' ')
		.replace(/\s*\{\s*/g, '{')
		.replace(/\s*\}\s*/g, '}')
		.replace(/\s*:\s*/g, ':')
		.replace(/\s*;\s*/g, ';')
		.replace(/;}/g, '}')
		.trim();
}
