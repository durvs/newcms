import { describe, it, expect, beforeEach } from 'vitest';
import { ShortcodeRegistry } from '../src/shortcode';

describe('ShortcodeRegistry', () => {
	let registry: ShortcodeRegistry;

	beforeEach(() => {
		registry = new ShortcodeRegistry();
	});

	it('should process a self-closing shortcode', () => {
		registry.register('hr', () => '<hr />');
		expect(registry.process('before [hr /] after')).toBe('before <hr /> after');
	});

	it('should process an enclosing shortcode', () => {
		registry.register('bold', (_attrs, content) => `<b>${content}</b>`);
		expect(registry.process('[bold]hello[/bold]')).toBe('<b>hello</b>');
	});

	it('should parse attributes', () => {
		let captured: Record<string, string> = {};
		registry.register('link', (attrs, content) => {
			captured = attrs;
			return `<a href="${attrs.href}">${content}</a>`;
		});
		const result = registry.process(
			'[link href="https://example.com" target="_blank"]Click[/link]',
		);
		expect(result).toBe('<a href="https://example.com">Click</a>');
		expect(captured.href).toBe('https://example.com');
		expect(captured.target).toBe('_blank');
	});

	it('should handle nested shortcodes', () => {
		registry.register('outer', (_attrs, content) => `<div>${content}</div>`);
		registry.register('inner', (_attrs, content) => `<span>${content}</span>`);
		const result = registry.process('[outer][inner]hello[/inner][/outer]');
		expect(result).toBe('<div><span>hello</span></div>');
	});

	it('should leave unregistered shortcodes untouched', () => {
		registry.register('known', () => 'OK');
		const input = '[known /] [unknown]text[/unknown]';
		expect(registry.process(input)).toBe('OK [unknown]text[/unknown]');
	});

	it('should strip shortcodes', () => {
		registry.register('bold', () => '');
		expect(registry.strip('[bold]keep this[/bold]')).toBe('keep this');
	});

	it('should strip self-closing shortcodes', () => {
		registry.register('hr', () => '');
		expect(registry.strip('before [hr /] after')).toBe('before  after');
	});

	it('should handle no registered handlers gracefully', () => {
		expect(registry.process('[test]content[/test]')).toBe('[test]content[/test]');
	});

	it('should register and unregister', () => {
		registry.register('test', () => 'x');
		expect(registry.has('test')).toBe(true);
		registry.unregister('test');
		expect(registry.has('test')).toBe(false);
	});

	it('should list all registered tags', () => {
		registry.register('a', () => '');
		registry.register('b', () => '');
		expect(registry.getAll()).toEqual(['a', 'b']);
	});
});
