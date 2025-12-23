/**
 * Generic Sorting Utilities
 * Provides reusable sorting functions to eliminate duplicate sort logic across services
 */

/**
 * Value accessor function type
 * Extracts a numeric value from an item for sorting purposes
 */
export type ValueAccessor<T> = (item: T) => number;

/**
 * Generic sort function for sorting arrays of objects by numeric values
 * Eliminates duplicate sorting logic across Market, Event, and Series services
 *
 * @param items - Array of items to sort
 * @param sortBy - Field name to sort by
 * @param sortOrder - Sort direction ('asc' or 'desc')
 * @param valueAccessors - Map of field names to value extraction functions
 * @returns New sorted array (does not mutate original)
 *
 * @example
 * ```typescript
 * const sorted = genericSort(markets, 'volume', 'desc', {
 *   volume: (m) => m.volumeNum ?? 0,
 *   liquidity: (m) => m.liquidityNum ?? 0,
 *   createdAt: (m) => m.endDate ? new Date(m.endDate).getTime() : 0
 * });
 * ```
 */
export function genericSort<T>(
	items: T[],
	sortBy: string,
	sortOrder: 'asc' | 'desc',
	valueAccessors: Record<string, ValueAccessor<T>>
): T[] {
	const accessor = valueAccessors[sortBy];

	if (!accessor) {
		return items;
	}

	return [...items].sort((a, b) => {
		const aValue = accessor(a);
		const bValue = accessor(b);

		const comparison = aValue - bValue;
		return sortOrder === 'asc' ? comparison : -comparison;
	});
}

/**
 * Helper to parse date strings to timestamps for sorting
 * Returns 0 if date is null/undefined
 *
 * @param dateString - ISO date string or null/undefined
 * @returns Unix timestamp in milliseconds, or 0 if date is invalid
 *
 * @example
 * ```typescript
 * const timestamp = parseDateForSort(market.endDate); // 1735689600000 or 0
 * ```
 */
export function parseDateForSort(dateString: string | null | undefined): number {
	return dateString ? new Date(dateString).getTime() : 0;
}
