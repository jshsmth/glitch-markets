/**
 * A simple counter with reactive state
 * @param initial - The initial count value
 */
export function createCounter(initial = 0) {
	let count = $state(initial);

	return {
		get value() {
			return count;
		},
		increment: () => {
			count++;
		},
		decrement: () => {
			count--;
		},
		reset: () => {
			count = initial;
		}
	};
}

/**
 * Multiplies a reactive value by a constant
 * @param getValue - Function that returns the current value
 * @param multiplier - The multiplier constant
 */
export function createMultiplier(getValue: () => number, multiplier: number) {
	return {
		get value() {
			return getValue() * multiplier;
		}
	};
}
