import { json, type RequestEvent } from '@sveltejs/kit';
import { formatErrorResponse, ApiError } from '$lib/server/errors/api-errors.js';
import { Logger } from '$lib/utils/logger';

interface ApiHandlerOptions<T> {
	loggerComponent: string;
	cacheMaxAge?: number;
	handler: (event: RequestEvent) => Promise<T>;
}

interface GetByIdOptions<T> {
	loggerComponent: string;
	entityName: string;
	cacheMaxAge?: number;
	serviceFn: (id: string) => Promise<T | null>;
}

/**
 * Centralized error handling for API routes
 * Handles both ApiError and generic errors with consistent logging and response formatting
 */
function handleApiError(error: unknown, logger: Logger, component: string, duration: number) {
	if (error instanceof ApiError) {
		logger.error(`API error in ${component}`, error, { duration });
		return json(formatErrorResponse(error), { status: error.statusCode });
	}

	logger.error(`Unexpected error in ${component}`, error, { duration });
	const errorResponse = formatErrorResponse(
		error instanceof Error ? error : new Error('Unknown error occurred')
	);
	return json(errorResponse, { status: 500 });
}

export function createApiHandler<T>(options: ApiHandlerOptions<T>) {
	const { loggerComponent, cacheMaxAge = 60, handler } = options;
	const logger = new Logger({ component: loggerComponent });

	return async (event: RequestEvent) => {
		const startTime = Date.now();

		try {
			const result = await handler(event);

			const duration = Date.now() - startTime;
			logger.info('Request completed successfully', { duration });

			return json(result, {
				headers: {
					'Cache-Control': `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
					'CDN-Cache-Control': `public, max-age=${cacheMaxAge}`,
					'Vercel-CDN-Cache-Control': `public, max-age=${cacheMaxAge}`
				}
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			return handleApiError(error, logger, loggerComponent, duration);
		}
	};
}

export function createGetByIdHandler<T>(options: GetByIdOptions<T>) {
	const { loggerComponent, entityName, cacheMaxAge = 60, serviceFn } = options;
	const logger = new Logger({ component: loggerComponent });

	return async ({ params }: RequestEvent) => {
		const startTime = Date.now();

		try {
			const { id } = params;

			if (!id || id.trim() === '') {
				logger.error(`Missing or empty ${entityName} ID`, undefined, { id });
				return json(
					formatErrorResponse(
						new ApiError(`${entityName} ID is required`, 400, 'VALIDATION_ERROR')
					),
					{ status: 400 }
				);
			}

			logger.info(`Fetching ${entityName} by ID`, { id });

			const result = await serviceFn(id);

			if (!result) {
				const duration = Date.now() - startTime;
				logger.info(`${entityName} not found`, { id, duration });
				return json(
					formatErrorResponse(new ApiError(`${entityName} not found`, 404, 'NOT_FOUND')),
					{ status: 404 }
				);
			}

			const duration = Date.now() - startTime;
			logger.info(`${entityName} fetched successfully`, { id, duration });

			return json(result, {
				headers: {
					'Cache-Control': `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
					'CDN-Cache-Control': `public, max-age=${cacheMaxAge}`,
					'Vercel-CDN-Cache-Control': `public, max-age=${cacheMaxAge}`
				}
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			return handleApiError(error, logger, loggerComponent, duration);
		}
	};
}
