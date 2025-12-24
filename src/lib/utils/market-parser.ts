import type { Market } from '$lib/server/api/polymarket-client';
import { memoize } from './memo';

export interface ParsedMarket {
	outcomes: string[];
	prices: string[];
}

export interface OutcomeData {
	label: string;
	percentage: number;
}

export interface BinaryMarketData {
	yes: OutcomeData;
	no: OutcomeData;
	leansYes: boolean;
}

/**
 * Safely parses market outcomes from string or array format
 */
export function parseOutcomes(outcomes: string[] | string | null | undefined): string[] | null {
	if (!outcomes) return null;

	if (Array.isArray(outcomes)) return outcomes;

	if (typeof outcomes === 'string') {
		try {
			const parsed = JSON.parse(outcomes);
			return Array.isArray(parsed) ? parsed : null;
		} catch {
			return null;
		}
	}

	return null;
}

/**
 * Safely parses market outcome prices from string or array format
 */
export function parsePrices(prices: string[] | string | null | undefined): string[] | null {
	if (!prices) return null;

	if (Array.isArray(prices)) return prices;

	if (typeof prices === 'string') {
		try {
			const parsed = JSON.parse(prices);
			return Array.isArray(parsed) ? parsed : null;
		} catch {
			return null;
		}
	}

	return null;
}

/**
 * Parses both outcomes and prices for a market
 */
const parseMarketImpl = (market: Market | null | undefined): ParsedMarket | null => {
	if (!market) return null;

	const outcomes = parseOutcomes(market.outcomes);
	const prices = parsePrices(market.outcomePrices);

	if (!outcomes || !prices) return null;
	if (outcomes.length === 0 || prices.length === 0) return null;

	return { outcomes, prices };
};

export const parseMarket = memoize(parseMarketImpl, (market) => market?.id || 'null');

/**
 * Parses binary market data (Yes/No outcomes with percentages)
 */
const parseBinaryMarketImpl = (market: Market | null | undefined): BinaryMarketData | null => {
	const parsed = parseMarket(market);
	if (!parsed) return null;

	const { outcomes, prices } = parsed;
	if (outcomes.length < 2 || prices.length < 2) return null;

	const yesPercentage = parseFloat(prices[0]) * 100;
	const noPercentage = parseFloat(prices[1]) * 100;

	return {
		yes: { label: outcomes[0] || 'Yes', percentage: yesPercentage },
		no: { label: outcomes[1] || 'No', percentage: noPercentage },
		leansYes: yesPercentage >= 50
	};
};

export const parseBinaryMarket = memoize(parseBinaryMarketImpl, (market) => market?.id || 'null');

/**
 * Parses multiple markets into sorted outcome data
 */
const parseMultiMarketOutcomesImpl = (
	markets: Market[] | null | undefined
): OutcomeData[] | null => {
	if (!markets || markets.length === 0) return null;

	const allOutcomes: OutcomeData[] = [];

	for (const market of markets) {
		const parsed = parseMarket(market);
		if (!parsed) continue;

		const { outcomes, prices } = parsed;
		if (outcomes.length >= 1 && prices.length >= 1) {
			const displayTitle = market.groupItemTitle || outcomes[0] || market.question || 'Unknown';
			const percentage = parseFloat(prices[0]) * 100;
			allOutcomes.push({ label: displayTitle, percentage });
		}
	}

	return allOutcomes.length > 0 ? allOutcomes.sort((a, b) => b.percentage - a.percentage) : null;
};

export const parseMultiMarketOutcomes = memoize(
	parseMultiMarketOutcomesImpl,
	(markets) => markets?.map((m) => m.id).join(',') || 'null'
);

/**
 * Checks if a market is effectively resolved (>=99% probability)
 */
export function isMarketEffectivelyResolved(market: Market | null | undefined): boolean {
	const parsed = parseMarket(market);
	if (!parsed) return false;

	const { prices } = parsed;
	return prices.some((price) => parseFloat(price) * 100 >= 99);
}

/**
 * Gets the winning outcome for a resolved market
 */
export function getWinningOutcome(market: Market | null | undefined): OutcomeData | null {
	const parsed = parseMarket(market);
	if (!parsed) return null;

	const { outcomes, prices } = parsed;

	let maxPercentage = 0;
	let winningIndex = 0;

	prices.forEach((price, index) => {
		const percentage = parseFloat(price) * 100;
		if (percentage > maxPercentage) {
			maxPercentage = percentage;
			winningIndex = index;
		}
	});

	return {
		label: outcomes[winningIndex] || 'Unknown',
		percentage: maxPercentage
	};
}

export interface MarketResolution {
	winner: string;
	loser: string;
	winnerIsYes: boolean;
}

/**
 * Gets the resolution of a binary market (for resolved markets where one price is 1 and other is 0)
 */
export function getMarketResolution(market: Market | null | undefined): MarketResolution | null {
	const parsed = parseMarket(market);
	if (!parsed) return null;

	const { outcomes, prices } = parsed;
	if (outcomes.length < 2 || prices.length < 2) return null;

	const winnerIndex = prices.findIndex((p: string) => parseFloat(p) === 1);
	if (winnerIndex === -1) return null;

	return {
		winner: outcomes[winnerIndex],
		loser: outcomes[winnerIndex === 0 ? 1 : 0],
		winnerIsYes: winnerIndex === 0
	};
}

/**
 * Checks if a market is a winning outcome (price is 1)
 */
export function isWinningMarket(market: Market | null | undefined): boolean {
	const parsed = parseMarket(market);
	if (!parsed) return false;

	const { prices } = parsed;
	return prices.length >= 2 && parseFloat(prices[0]) === 1;
}
