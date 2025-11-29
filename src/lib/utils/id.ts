/**
 * Generates a unique ID
 * Uses a combination of timestamp and random number for uniqueness
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 *
 * @example
 * const id = generateId('clip'); // 'clip-1234567890-abc123'
 */
export function generateId(prefix?: string): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 9);
	return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Generates a unique ID that's stable for the lifetime of a component instance
 * Uses a counter to ensure uniqueness even if called at the same millisecond
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 *
 * @example
 * const id = generateComponentId('icon'); // 'icon-1'
 */
let counter = 0;
export function generateComponentId(prefix?: string): string {
	counter++;
	return prefix ? `${prefix}-${counter}` : `${counter}`;
}
