import { describe, it, expect } from 'vitest';
import { DEFAULT_ROLES, roleHasCapability, userHasCapability } from '../src/roles.js';

describe('Roles & Capabilities', () => {
	describe('DEFAULT_ROLES', () => {
		it('should define 5 roles', () => {
			expect(Object.keys(DEFAULT_ROLES)).toHaveLength(5);
			expect(DEFAULT_ROLES).toHaveProperty('administrator');
			expect(DEFAULT_ROLES).toHaveProperty('editor');
			expect(DEFAULT_ROLES).toHaveProperty('author');
			expect(DEFAULT_ROLES).toHaveProperty('contributor');
			expect(DEFAULT_ROLES).toHaveProperty('subscriber');
		});

		it('subscriber should only have read', () => {
			const caps = DEFAULT_ROLES['subscriber'].capabilities;
			expect(caps['read']).toBe(true);
			expect(Object.keys(caps).filter((k) => caps[k])).toHaveLength(1);
		});

		it('administrator should have manage_options', () => {
			expect(DEFAULT_ROLES['administrator'].capabilities['manage_options']).toBe(true);
		});

		it('contributor should NOT have publish_posts', () => {
			expect(DEFAULT_ROLES['contributor'].capabilities['publish_posts']).toBeUndefined();
		});

		it('author should have upload_files but NOT edit_others_posts', () => {
			expect(DEFAULT_ROLES['author'].capabilities['upload_files']).toBe(true);
			expect(DEFAULT_ROLES['author'].capabilities['edit_others_posts']).toBeUndefined();
		});
	});

	describe('roleHasCapability', () => {
		it('should return true for valid capability', () => {
			expect(roleHasCapability('administrator', 'edit_posts')).toBe(true);
		});

		it('should return false for missing capability', () => {
			expect(roleHasCapability('subscriber', 'edit_posts')).toBe(false);
		});

		it('should return false for non-existent role', () => {
			expect(roleHasCapability('nonexistent', 'read')).toBe(false);
		});
	});

	describe('userHasCapability', () => {
		it('should check capability across multiple roles', () => {
			expect(userHasCapability(['subscriber'], 'edit_posts')).toBe(false);
			expect(userHasCapability(['contributor'], 'edit_posts')).toBe(true);
			expect(userHasCapability(['subscriber', 'contributor'], 'edit_posts')).toBe(true);
		});

		it('should respect extra user-level capabilities (grant)', () => {
			expect(userHasCapability(['subscriber'], 'upload_files', { upload_files: true })).toBe(true);
		});

		it('should respect extra user-level capabilities (deny)', () => {
			expect(userHasCapability(['administrator'], 'edit_posts', { edit_posts: false })).toBe(false);
		});

		it('should return false for empty roles array', () => {
			expect(userHasCapability([], 'read')).toBe(false);
		});
	});
});
