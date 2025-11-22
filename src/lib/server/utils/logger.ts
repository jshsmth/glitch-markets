/**
 * Logging utility for the Polymarket API integration
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, unknown>;
}

/**
 * Logger class for structured logging with timestamps
 */
export class Logger {
	private context: Record<string, unknown>;

	constructor(context: Record<string, unknown> = {}) {
		this.context = context;
	}

	/**
	 * Creates a log entry with timestamp
	 */
	private createLogEntry(
		level: LogLevel,
		message: string,
		data?: Record<string, unknown>
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: { ...this.context, ...data }
		};
	}

	/**
	 * Formats a log entry for output
	 */
	private formatLog(entry: LogEntry): string {
		const contextStr =
			entry.context && Object.keys(entry.context).length > 0
				? ` ${JSON.stringify(entry.context)}`
				: '';
		return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
	}

	/**
	 * Logs a debug message
	 */
	debug(message: string, data?: Record<string, unknown>): void {
		const entry = this.createLogEntry('debug', message, data);
		console.debug(this.formatLog(entry));
	}

	/**
	 * Logs an info message
	 */
	info(message: string, data?: Record<string, unknown>): void {
		const entry = this.createLogEntry('info', message, data);
		console.info(this.formatLog(entry));
	}

	/**
	 * Logs a warning message
	 */
	warn(message: string, data?: Record<string, unknown>): void {
		const entry = this.createLogEntry('warn', message, data);
		console.warn(this.formatLog(entry));
	}

	/**
	 * Logs an error message
	 */
	error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
		const errorData: Record<string, unknown> = { ...data };

		if (error instanceof Error) {
			errorData.error = {
				name: error.name,
				message: error.message,
				stack: error.stack
			};
		} else if (error) {
			errorData.error = error;
		}

		const entry = this.createLogEntry('error', message, errorData);
		console.error(this.formatLog(entry));
	}

	/**
	 * Creates a child logger with additional context
	 */
	child(additionalContext: Record<string, unknown>): Logger {
		return new Logger({ ...this.context, ...additionalContext });
	}
}

/**
 * Default logger instance
 */
export const logger = new Logger();
