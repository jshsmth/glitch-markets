/**
 * SvelteKit server route for creating bridge deposit addresses
 * POST /api/bridge/deposit
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { BridgeService } from '$lib/server/services/bridge-service.js';
import { formatErrorResponse, ApiError, ValidationError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const logger = new Logger({ component: 'BridgeDepositRoute' });
const bridgeService = new BridgeService();

/**
 * POST handler for /api/bridge/deposit
 * Creates unique deposit addresses for cross-chain transfers
 */
export async function POST({ request }: RequestEvent) {
	const startTime = Date.now();

	try {
		let body: unknown;
		try {
			body = await request.json();
		} catch (error) {
			logger.error('Failed to parse JSON body', error);
			return json(formatErrorResponse(new ValidationError('Invalid JSON in request body')), {
				status: 400
			});
		}

		if (!body || typeof body !== 'object') {
			logger.error('Request body is not an object', undefined, { body });
			return json(formatErrorResponse(new ValidationError('Request body must be a JSON object')), {
				status: 400
			});
		}

		const { address } = body as { address?: unknown };

		if (!address) {
			logger.error('Missing address field', undefined, { body });
			return json(formatErrorResponse(new ValidationError('address field is required')), {
				status: 400
			});
		}

		logger.info('Creating deposit addresses', { address });

		const result = await bridgeService.createDeposit(address as string);

		const duration = Date.now() - startTime;
		const addressTypes = Object.keys(result.address).length;
		logger.info('Deposit addresses created successfully', {
			addressTypes,
			hasEvm: !!result.address.evm,
			hasSvm: !!result.address.svm,
			hasBtc: !!result.address.btc,
			duration
		});

		return json(result, {
			status: 201,
			headers: {
				'Cache-Control': 'no-store'
			}
		});
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ValidationError) {
			logger.error('Validation error in deposit route', error, { duration });
			return json(formatErrorResponse(error), { status: 400 });
		}

		if (error instanceof ApiError) {
			logger.error('API error in deposit route', error, { duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		logger.error('Unexpected error in deposit route', error, { duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
