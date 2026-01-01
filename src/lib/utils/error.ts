/**
 * Error handling utilities
 */

/**
 * Type guard to check if an error has a message property
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	);
}

/**
 * Get error message from unknown error type
 * @param error - The error object
 * @param fallback - Fallback message if error doesn't have a message
 * @returns The error message
 */
export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
	if (isErrorWithMessage(error)) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	return fallback;
}
