/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * debouncedSearch('hello'); // Will only execute after 300ms of no calls
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return function (this: any, ...args: Parameters<T>) {
		const context = this;

		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func.apply(context, args);
		}, wait);
	};
}

/**
 * Creates a debounced function that also cancels pending invocations on cleanup
 * Useful for Svelte components with $effect
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Object with debounced function and cancel method
 *
 * @example
 * const { debounced, cancel } = debounceCancellable((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * $effect(() => {
 *   return cancel; // Cleanup on component unmount
 * });
 */
export function debounceCancellable<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): {
	debounced: (...args: Parameters<T>) => void;
	cancel: () => void;
} {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const cancel = () => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
	};

	const debounced = function (this: any, ...args: Parameters<T>) {
		const context = this;
		cancel();

		timeoutId = setTimeout(() => {
			func.apply(context, args);
		}, wait);
	};

	return { debounced, cancel };
}
