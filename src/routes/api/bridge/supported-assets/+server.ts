/**
 * SvelteKit server route for fetching supported bridge assets
 * GET /api/bridge/supported-assets
 */

import { json } from '@sveltejs/kit';
import { BridgeService } from '$lib/server/services/bridge-service.js';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/server/utils/logger.js';

const logger = new Logger({ component: 'BridgeSupportedAssetsRoute' });
const bridgeService = new BridgeService();

/**
 * GET handler for /api/bridge/supported-assets
 * Returns all supported chains and tokens for bridging
 */
export async function GET() {
	const startTime = Date.now();

	try {
		logger.info('Fetching supported bridge assets');

		const result = await bridgeService.getSupportedAssets();

		const duration = Date.now() - startTime;
		logger.info('Supported assets fetched successfully', {
			assetCount: result.supportedAssets.length,
			duration
		});

		return json(result, {
			status: 200,
			headers: {
				'Cache-Control': 'public, max-age=300, s-maxage=300',
				'CDN-Cache-Control': 'public, max-age=300',
				'Vercel-CDN-Cache-Control': 'public, max-age=300'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ApiError) {
			logger.error('API error in supported assets route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in supported assets route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
