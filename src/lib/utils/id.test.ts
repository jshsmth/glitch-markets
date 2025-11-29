import { describe, it, expect } from 'vitest';
import { generateId, generateComponentId } from './id';

describe('id utilities', () => {
	describe('generateId', () => {
		it('generates a unique id', () => {
			const id1 = generateId();
			const id2 = generateId();
			expect(id1).not.toBe(id2);
		});

		it('includes prefix when provided', () => {
			const id = generateId('test');
			expect(id).toMatch(/^test-/);
		});

		it('generates different ids even when called quickly', () => {
			const ids = Array.from({ length: 10 }, () => generateId());
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(10);
		});
	});

	describe('generateComponentId', () => {
		it('generates sequential ids', () => {
			const id1 = generateComponentId('comp');
			const id2 = generateComponentId('comp');
			expect(id1).not.toBe(id2);
		});

		it('includes prefix when provided', () => {
			const id = generateComponentId('icon');
			expect(id).toMatch(/^icon-/);
		});
	});
});
