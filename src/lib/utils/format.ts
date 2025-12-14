/**
 * Formats a number as a currency string with K/M suffixes.
 *
 * @param num - The number to format (can be null or undefined)
 * @returns Formatted string like "$1.2M", "$500K", or "$123"
 *
 * @example
 * formatNumber(1234567) // "$1.2M"
 * formatNumber(12345) // "$12.3K"
 * formatNumber(123) // "$123"
 * formatNumber(null) // "$0"
 */
export function formatNumber(num: number | null | undefined): string {
	if (num === null || num === undefined) return '$0';
	if (num >= 1000000) {
		return `$${(num / 1000000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		return `$${(num / 1000).toFixed(1)}K`;
	}
	return `$${num.toFixed(0)}`;
}
