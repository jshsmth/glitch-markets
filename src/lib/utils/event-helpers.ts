import type { Market } from '$lib/server/api/polymarket-client';

export interface ParsedOutcome {
	label: string;
	price: number;
	priceFormatted: string;
	isResolved: boolean | null;
	won: boolean | null;
}

export function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return '';
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	} catch {
		return '';
	}
}

export function formatRelativeTime(dateStr: string | null): string {
	if (!dateStr) return '';
	try {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	} catch {
		return '';
	}
}

export function getMarketDisplayTitle(market: Market): string {
	if (market.groupItemTitle) return market.groupItemTitle;
	try {
		const outcomes =
			typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
		if (Array.isArray(outcomes) && outcomes[0]) return outcomes[0];
	} catch {
		// Invalid JSON, fall through to default
	}
	return market.question || 'Unknown';
}

export function parseMarketData(market: Market): ParsedOutcome[] | null {
	try {
		const outcomes =
			typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
		const prices =
			typeof market.outcomePrices === 'string'
				? JSON.parse(market.outcomePrices)
				: market.outcomePrices;
		if (!Array.isArray(outcomes) || !Array.isArray(prices)) return null;
		return outcomes.map((outcome: string, i: number) => {
			const price = parseFloat(prices[i]) * 100;
			const isResolved = market.closed && (price === 0 || price === 100);
			return {
				label: outcome,
				price,
				priceFormatted: isResolved ? (price === 100 ? 'Won' : 'Lost') : price.toFixed(0),
				isResolved,
				won: isResolved && price === 100
			};
		});
	} catch {
		return null;
	}
}

export function isPlaceholderMarket(market: Market): boolean {
	const title = getMarketDisplayTitle(market);
	const placeholderPrefixes = [
		'Person',
		'Candidate',
		'Company',
		'Team',
		'Player',
		'Country',
		'Option',
		'Choice',
		'Entry',
		'Participant',
		'Contestant',
		'Nominee',
		'Artist',
		'Song',
		'Film',
		'Movie',
		'Show',
		'Act'
	];
	const prefixPattern = new RegExp(`^(${placeholderPrefixes.join('|')}) [A-Z]$`, 'i');
	return prefixPattern.test(title) || /^Other$/i.test(title);
}

export function getMarketPrice(market: Market): number {
	const data = parseMarketData(market);
	return data?.[0]?.price ?? 0;
}

export function getClobTokenId(market: Market | null): string | null {
	if (!market?.clobTokenIds) return null;
	try {
		const tokenIds = JSON.parse(market.clobTokenIds);
		return Array.isArray(tokenIds) && tokenIds[0] ? tokenIds[0] : null;
	} catch {
		return null;
	}
}

export function getSeriesColor(index: number): string {
	const colors = ['#00d9ff', '#ff006e', '#a855f7'];
	return colors[index] || '#00d9ff';
}

export type TimeRange = '1H' | '6H' | '1D' | '1W' | '1M' | 'MAX';

export const getIntervalForTimeRange = (
	range: TimeRange
): '1h' | '6h' | '1d' | '1w' | '1m' | 'max' => {
	const mapping: Record<TimeRange, '1h' | '6h' | '1d' | '1w' | '1m' | 'max'> = {
		'1H': '1h',
		'6H': '6h',
		'1D': '1d',
		'1W': '1w',
		'1M': '1m',
		MAX: 'max'
	};
	return mapping[range];
};

export const getFidelityForTimeRange = (range: TimeRange): number | undefined => {
	const fidelityMap: Record<TimeRange, number | undefined> = {
		'1H': undefined,
		'6H': undefined,
		'1D': undefined,
		'1W': 5,
		'1M': 10,
		MAX: undefined
	};
	return fidelityMap[range];
};
