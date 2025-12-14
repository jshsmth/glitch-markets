import { describe, it, expect } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
	it('formats millions correctly', () => {
		expect(formatNumber(1000000)).toBe('$1.0M');
		expect(formatNumber(1234567)).toBe('$1.2M');
		expect(formatNumber(10500000)).toBe('$10.5M');
	});

	it('formats thousands correctly', () => {
		expect(formatNumber(1000)).toBe('$1.0K');
		expect(formatNumber(12345)).toBe('$12.3K');
		expect(formatNumber(999999)).toBe('$1000.0K');
	});

	it('formats small numbers correctly', () => {
		expect(formatNumber(0)).toBe('$0');
		expect(formatNumber(1)).toBe('$1');
		expect(formatNumber(123)).toBe('$123');
		expect(formatNumber(999)).toBe('$999');
	});

	it('handles null and undefined', () => {
		expect(formatNumber(null)).toBe('$0');
		expect(formatNumber(undefined)).toBe('$0');
	});

	it('handles decimal values', () => {
		expect(formatNumber(123.456)).toBe('$123');
		expect(formatNumber(1234.5)).toBe('$1.2K');
	});
});
