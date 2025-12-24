/**
 * SvelteKit server route for calculating user Profit/Loss over time
 * GET /api/users/pnl
 *
 * Aggregates realized P&L from closed positions and unrealized P&L from current positions
 * Returns time-series data suitable for charting
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { UserDataService } from '$lib/server/services/user-data-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'PnLRoute' });
const userDataService = new UserDataService();

type TimePeriod = '1D' | '1W' | '1M' | 'ALL';

interface PnLDataPoint {
	timestamp: number;
	value: number;
	realizedPnl: number;
	unrealizedPnl: number;
}

interface ClosedPosition {
	timestamp: number;
	realizedPnl?: number;
}

interface CurrentPosition {
	cashPnl?: number;
}

function getTimeRangeStart(period: TimePeriod): number {
	const now = Date.now();
	const ONE_DAY = 24 * 60 * 60 * 1000;

	switch (period) {
		case '1D':
			return now - ONE_DAY;
		case '1W':
			return now - 7 * ONE_DAY;
		case '1M':
			return now - 30 * ONE_DAY;
		case 'ALL':
			return 0;
		default:
			return now - 30 * ONE_DAY;
	}
}

function calculatePnLTimeSeries(
	closedPositions: ClosedPosition[],
	currentPositions: CurrentPosition[],
	period: TimePeriod
): PnLDataPoint[] {
	const startTime = getTimeRangeStart(period);

	const relevantClosedPositions = closedPositions.filter(
		(pos) => pos.timestamp * 1000 >= startTime
	);

	relevantClosedPositions.sort((a, b) => a.timestamp - b.timestamp);

	const dataPoints: PnLDataPoint[] = [];
	let cumulativeRealizedPnl = 0;

	const currentUnrealizedPnl = currentPositions.reduce((sum, p) => sum + (p.cashPnl || 0), 0);

	if (relevantClosedPositions.length === 0) {
		const now = Date.now();

		dataPoints.push({
			timestamp: startTime,
			value: 0,
			realizedPnl: 0,
			unrealizedPnl: 0
		});

		dataPoints.push({
			timestamp: now,
			value: currentUnrealizedPnl,
			realizedPnl: 0,
			unrealizedPnl: currentUnrealizedPnl
		});

		return dataPoints;
	}

	for (const position of relevantClosedPositions) {
		cumulativeRealizedPnl += position.realizedPnl || 0;

		dataPoints.push({
			timestamp: position.timestamp * 1000,
			value: cumulativeRealizedPnl,
			realizedPnl: cumulativeRealizedPnl,
			unrealizedPnl: 0
		});
	}
	const now = Date.now();

	dataPoints.push({
		timestamp: now,
		value: cumulativeRealizedPnl + currentUnrealizedPnl,
		realizedPnl: cumulativeRealizedPnl,
		unrealizedPnl: currentUnrealizedPnl
	});

	return dataPoints;
}

export async function GET({ url }: RequestEvent) {
	const startTime = Date.now();

	try {
		const user = url.searchParams.get('user');
		const period = (url.searchParams.get('period') || '1M') as TimePeriod;

		if (!user) {
			return json({ error: 'User parameter required' }, { status: 400 });
		}

		if (!['1D', '1W', '1M', 'ALL'].includes(period)) {
			return json({ error: 'Invalid period. Must be 1D, 1W, 1M, or ALL' }, { status: 400 });
		}

		logger.info('Calculating P&L', { user, period });

		const [closedPositions, currentPositions] = await Promise.all([
			userDataService.getClosedPositions(user),
			userDataService.getCurrentPositions(user)
		]);

		const pnlData = calculatePnLTimeSeries(closedPositions, currentPositions, period);

		const latestDataPoint = pnlData[pnlData.length - 1];
		const totalPnl = latestDataPoint?.value || 0;
		const realizedPnl = latestDataPoint?.realizedPnl || 0;
		const unrealizedPnl = latestDataPoint?.unrealizedPnl || 0;

		const duration = Date.now() - startTime;
		logger.info('P&L calculated successfully', {
			user,
			period,
			totalPnl,
			realizedPnl,
			unrealizedPnl,
			dataPoints: pnlData.length,
			duration
		});

		return json(
			{
				period,
				totalPnl,
				realizedPnl,
				unrealizedPnl,
				data: pnlData
			},
			{
				headers: {
					'Cache-Control': 'public, max-age=60, s-maxage=60',
					'CDN-Cache-Control': 'public, max-age=60',
					'Vercel-CDN-Cache-Control': 'public, max-age=60'
				}
			}
		);
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in P&L route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in P&L route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
