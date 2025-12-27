import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('delays function execution', () => {
		const func = vi.fn();
		const debouncedFunc = debounce(func, 300);

		debouncedFunc();
		expect(func).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);
		expect(func).toHaveBeenCalledTimes(1);
	});

	it('cancels previous calls when called multiple times', () => {
		const func = vi.fn();
		const debouncedFunc = debounce(func, 300);

		debouncedFunc();
		debouncedFunc();
		debouncedFunc();

		vi.advanceTimersByTime(300);
		expect(func).toHaveBeenCalledTimes(1);
	});

	it('passes arguments to the debounced function', () => {
		const func = vi.fn();
		const debouncedFunc = debounce(func, 300);

		debouncedFunc('arg1', 'arg2');
		vi.advanceTimersByTime(300);

		expect(func).toHaveBeenCalledWith('arg1', 'arg2');
	});
});
