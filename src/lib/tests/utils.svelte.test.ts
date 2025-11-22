import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';
import { createCounter, createMultiplier } from '../utils.svelte';

describe('createCounter', () => {
	it('should initialize with default value', () => {
		const counter = createCounter();
		expect(counter.value).toBe(0);
	});

	it('should initialize with custom value', () => {
		const counter = createCounter(10);
		expect(counter.value).toBe(10);
	});

	it('should increment the counter', () => {
		const counter = createCounter();
		counter.increment();
		expect(counter.value).toBe(1);
	});

	it('should decrement the counter', () => {
		const counter = createCounter(5);
		counter.decrement();
		expect(counter.value).toBe(4);
	});

	it('should reset to initial value', () => {
		const counter = createCounter(10);
		counter.increment();
		counter.increment();
		expect(counter.value).toBe(12);
		counter.reset();
		expect(counter.value).toBe(10);
	});
});

describe('createMultiplier', () => {
	it('should multiply reactive values', () => {
		let count = $state(5);
		const doubler = createMultiplier(() => count, 2);

		expect(doubler.value).toBe(10);

		count = 10;
		expect(doubler.value).toBe(20);
	});

	it('should work with different multipliers', () => {
		let value = $state(3);
		const tripler = createMultiplier(() => value, 3);

		expect(tripler.value).toBe(9);

		value = 4;
		expect(tripler.value).toBe(12);
	});
});
