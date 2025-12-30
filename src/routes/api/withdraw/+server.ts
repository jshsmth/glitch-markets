/**
 * SvelteKit server route for gasless USDC withdrawals
 * POST /api/withdraw
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { withdrawalService } from '$lib/server/services/withdrawal-service.js';
import { formatErrorResponse, ApiError, ValidationError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

const log = Logger.forComponent('WithdrawRoute');

interface WithdrawRequestBody {
	fromAddress?: unknown;
	toAddress?: unknown;
	amount?: unknown;
}

/**
 * POST handler for /api/withdraw
 * Executes gasless USDC withdrawal via relayer
 *
 * Request body:
 * - fromAddress: User's proxy wallet address
 * - toAddress: Destination wallet address
 * - amount: Amount of USDC to withdraw (as string, e.g., "10.50")
 *
 * Response:
 * - success: boolean
 * - transactionHash: string (if successful)
 * - error: string (if failed)
 * - estimatedNetworkFee: string (always "0.00" for gasless)
 */
export async function POST({ request, locals }: RequestEvent) {
	const startTime = Date.now();

	try {
		const {
			data: { user: authUser },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !authUser) {
			log.error('Unauthorized withdrawal attempt', { error: authError });
			return json(formatErrorResponse(new ValidationError('Unauthorized')), {
				status: 401
			});
		}

		const userId = authUser.id;

		let body: unknown;
		try {
			body = await request.json();
		} catch (error) {
			log.error('Failed to parse JSON body', error);
			return json(formatErrorResponse(new ValidationError('Invalid JSON in request body')), {
				status: 400
			});
		}

		if (!body || typeof body !== 'object') {
			log.error('Request body is not an object', { body });
			return json(formatErrorResponse(new ValidationError('Request body must be a JSON object')), {
				status: 400
			});
		}

		const { fromAddress, toAddress, amount } = body as WithdrawRequestBody;

		if (!fromAddress || typeof fromAddress !== 'string') {
			log.error('Missing or invalid fromAddress field', { body });
			return json(
				formatErrorResponse(
					new ValidationError('fromAddress field is required and must be a string')
				),
				{ status: 400 }
			);
		}

		if (!toAddress || typeof toAddress !== 'string') {
			log.error('Missing or invalid toAddress field', { body });
			return json(
				formatErrorResponse(
					new ValidationError('toAddress field is required and must be a string')
				),
				{ status: 400 }
			);
		}

		if (!amount || typeof amount !== 'string') {
			log.error('Missing or invalid amount field', { body });
			return json(
				formatErrorResponse(new ValidationError('amount field is required and must be a string')),
				{ status: 400 }
			);
		}

		log.info('Processing withdrawal request', {
			userId,
			fromAddress,
			toAddress,
			amount
		});

		const result = await withdrawalService.executeWithdrawal({
			userId,
			fromAddress,
			toAddress,
			amount
		});

		const duration = Date.now() - startTime;

		if (result.success) {
			log.info('Withdrawal completed successfully', {
				userId,
				fromAddress,
				toAddress,
				amount,
				transactionHash: result.transactionHash,
				duration
			});

			return json(result, {
				status: 200,
				headers: {
					'Cache-Control': 'no-store'
				}
			});
		} else {
			log.warn('Withdrawal failed', {
				userId,
				fromAddress,
				toAddress,
				amount,
				error: result.error,
				duration
			});

			return json(result, {
				status: 400,
				headers: {
					'Cache-Control': 'no-store'
				}
			});
		}
	} catch (error) {
		const duration = Date.now() - startTime;

		if (error instanceof ValidationError) {
			log.error('Validation error in withdraw route', { error, duration });
			return json(formatErrorResponse(error), { status: 400 });
		}

		if (error instanceof ApiError) {
			log.error('API error in withdraw route', { error, duration });
			return json(formatErrorResponse(error), { status: error.statusCode });
		}

		log.error('Unexpected error in withdraw route', { error, duration });
		const errorResponse = formatErrorResponse(
			error instanceof Error ? error : new Error('Unknown error occurred')
		);
		return json(errorResponse, { status: 500 });
	}
}
